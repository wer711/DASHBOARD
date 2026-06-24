import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  getClientIP,
  getUserAgent,
  parseUserAgent,
  extractDomain,
  extractUTM,
  extractPath,
} from '@/lib/analytics-utils'

// CORS — نسمح للموقع المُتابَع بإرسال البيانات
// قائمة ثابتة + متغير بيئي لمرونة الإضافة لاحقاً
const ALLOWED_ORIGINS = [
  'https://sada-elaqar.vercel.app',
  'https://sada-elaqar.netlify.app',
  'http://localhost:3000',
  'http://localhost:3001',
]
// إضافة مصادر إضافية من متغير البيئة إن وُجدت (مفصولة بفواصل)
if (process.env.ALLOWED_TRACKING_ORIGINS) {
  for (const o of process.env.ALLOWED_TRACKING_ORIGINS.split(',')) {
    const trimmed = o.trim()
    if (trimmed) ALLOWED_ORIGINS.push(trimmed)
  }
}

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Website-Id, X-Session-Id',
    'Access-Control-Max-Age': '86400',
  }
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Credentials'] = 'true'
  } else {
    headers['Access-Control-Allow-Origin'] = '*'
  }
  return headers
}

// ضمان وجود الموقع الافتراضي
async function ensureDefaultWebsite() {
  let website = await db.website.findFirst({ where: { domain: 'sada-elaqar.vercel.app' } })
  if (!website) {
    website = await db.website.create({
      data: {
        name: 'صدى العقار',
        domain: 'sada-elaqar.vercel.app',
      },
    })
  }
  return website
}

// استعلام جغرافي عن IP عبر خدمة مجانية
async function getGeoFromIP(ip: string): Promise<{
  country: string | null
  countryCode: string | null
  city: string | null
  region: string | null
  latitude: number | null
  longitude: number | null
}> {
  if (!ip || ip === '0.0.0.0' || ip.startsWith('127.') || ip.startsWith('::1') || ip.startsWith('10.')) {
    return { country: null, countryCode: null, city: null, region: null, latitude: null, longitude: null }
  }
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) throw new Error('geo failed')
    const data = await res.json()
    return {
      country: data.country_name || null,
      countryCode: data.country_code || null,
      city: data.city || null,
      region: data.region || null,
      latitude: data.latitude ? Number(data.latitude) : null,
      longitude: data.longitude ? Number(data.longitude) : null,
    }
  } catch {
    return { country: null, countryCode: null, city: null, region: null, latitude: null, longitude: null }
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get('origin')),
  })
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin')
  const headers = corsHeaders(origin)

  try {
    const website = await ensureDefaultWebsite()
    const body = await req.json().catch(() => ({}))
    const type = body.type as string // 'pageview' | 'event' | 'heartbeat' | 'leave'

    const ip = getClientIP(req)
    const ua = getUserAgent(req)
    const device = parseUserAgent(ua)

    const sessionId = body.sessionId as string
    const visitorId = body.visitorId as string
    if (!sessionId || !visitorId) {
      return NextResponse.json({ ok: false, error: 'missing session/visitor' }, { status: 400, headers })
    }

    const url = body.url as string
    const referrer = body.referrer as string | null
    const path = extractPath(url)
    const utm = extractUTM(url)
    const referrerDomain = extractDomain(referrer)

    // ====== مشاهدة صفحة ======
    if (type === 'pageview') {
      let session = await db.session.findUnique({ where: { sessionId } })
      if (!session) {
        const geo = await getGeoFromIP(ip)
        session = await db.session.create({
          data: {
            websiteId: website.id,
            sessionId,
            visitorId,
            ip,
            country: geo.country,
            countryCode: geo.countryCode,
            city: geo.city,
            region: geo.region,
            latitude: geo.latitude,
            longitude: geo.longitude,
            browser: device.browser,
            browserVersion: device.browserVersion,
            os: device.os,
            osVersion: device.osVersion,
            device: device.device,
            brand: device.brand,
            model: device.model,
            screenWidth: body.screenWidth || null,
            screenHeight: body.screenHeight || null,
            language: body.language || null,
            referrer: referrer || null,
            referrerDomain: referrerDomain || null,
            utmSource: utm.utmSource,
            utmMedium: utm.utmMedium,
            utmCampaign: utm.utmCampaign,
            utmTerm: utm.utmTerm,
            utmContent: utm.utmContent,
            pageViews: 1,
            isActive: true,
            lastActiveAt: new Date(),
          },
        })
      } else {
        session = await db.session.update({
          where: { sessionId },
          data: {
            lastActiveAt: new Date(),
            isActive: true,
            pageViews: { increment: 1 },
            isBounce: false,
          },
        })
      }

      const pageView = await db.pageView.create({
        data: {
          websiteId: website.id,
          sessionId: session.id,
          visitorId,
          url,
          path,
          title: body.title || null,
          referrer: referrer || null,
        },
      })

      // إشعار خدمة الـ WebSocket
      notifyLiveService({
        type: 'pageview',
        websiteId: website.id,
        sessionId: session.id,
        visitorId,
        path,
        title: body.title || null,
        country: session.country,
        countryCode: session.countryCode,
        city: session.city,
        device: session.device,
        browser: session.browser,
        os: session.os,
        referrerDomain: session.referrerDomain,
        utmSource: session.utmSource,
        utmCampaign: session.utmCampaign,
        timestamp: pageView.createdAt.toISOString(),
      }).catch(() => {})

      return NextResponse.json({ ok: true, sessionId: session.id }, { headers })
    }

    // ====== حدث مخصص ======
    if (type === 'event') {
      let session = await db.session.findUnique({ where: { sessionId } })
      if (!session) {
        const geo = await getGeoFromIP(ip)
        session = await db.session.create({
          data: {
            websiteId: website.id,
            sessionId,
            visitorId,
            ip,
            country: geo.country,
            countryCode: geo.countryCode,
            city: geo.city,
            region: geo.region,
            latitude: geo.latitude,
            longitude: geo.longitude,
            browser: device.browser,
            browserVersion: device.browserVersion,
            os: device.os,
            osVersion: device.osVersion,
            device: device.device,
            brand: device.brand,
            model: device.model,
            referrer: referrer || null,
            referrerDomain: referrerDomain || null,
            utmSource: utm.utmSource,
            utmMedium: utm.utmMedium,
            utmCampaign: utm.utmCampaign,
            pageViews: 0,
            isActive: true,
            lastActiveAt: new Date(),
          },
        })
      } else {
        session = await db.session.update({
          where: { sessionId },
          data: { lastActiveAt: new Date(), isActive: true, isBounce: false },
        })
      }

      const event = await db.event.create({
        data: {
          websiteId: website.id,
          sessionId: session.id,
          visitorId,
          name: body.name || 'unknown',
          category: body.category || null,
          label: body.label || null,
          value: body.value != null ? Number(body.value) : null,
          url: url || null,
          path: path || null,
          metadata: body.metadata ? JSON.stringify(body.metadata) : null,
        },
      })

      notifyLiveService({
        type: 'event',
        websiteId: website.id,
        sessionId: session.id,
        visitorId,
        name: event.name,
        category: event.category,
        label: event.label,
        country: session.country,
        countryCode: session.countryCode,
        city: session.city,
        device: session.device,
        browser: session.browser,
        timestamp: event.createdAt.toISOString(),
      }).catch(() => {})

      return NextResponse.json({ ok: true, eventId: event.id }, { headers })
    }

    // ====== نبضة قلب ======
    if (type === 'heartbeat') {
      const session = await db.session.findUnique({ where: { sessionId } })
      if (session) {
        await db.session.update({
          where: { sessionId },
          data: {
            lastActiveAt: new Date(),
            isActive: true,
            duration: { increment: 10 },
          },
        })
      }
      return NextResponse.json({ ok: true }, { headers })
    }

    // ====== مغادرة ======
    if (type === 'leave') {
      const session = await db.session.findUnique({ where: { sessionId } })
      if (session) {
        await db.session.update({
          where: { sessionId },
          data: {
            lastActiveAt: new Date(),
            endedAt: new Date(),
            isActive: false,
          },
        })
      }
      return NextResponse.json({ ok: true }, { headers })
    }

    return NextResponse.json({ ok: false, error: 'unknown type' }, { status: 400, headers })
  } catch (err) {
    console.error('[track] error:', err)
    return NextResponse.json(
      { ok: false, error: 'server error' },
      { status: 500, headers }
    )
  }
}

// إشعار خدمة WebSocket (اختياري)
// إن لم يُضبط LIVE_SERVICE_URL، يتخطّى الإشعار بصمت — اللوحة ستعتمد على polling
async function notifyLiveService(payload: unknown) {
  const url = process.env.LIVE_SERVICE_URL
  if (!url) return // لا توجد خدمة WebSocket مُعدّة — تجاهل
  try {
    await fetch(`${url.replace(/\/$/, '')}/internal/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2000),
    })
  } catch {
    // تجاهل — خدمة الـ WebSocket قد تكون غير متاحة
  }
}
