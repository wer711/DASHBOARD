import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// مسار زائر محدد — يعرض كل مشاهداته وأحداثه مرتبة زمنياً
// GET /api/stats/visitor-journey?visitorId=xxx&limit=50
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const visitorId = searchParams.get('visitorId')
  const limit = Math.min(Number(searchParams.get('limit') || 50), 200)

  if (!visitorId) {
    return NextResponse.json({ error: 'visitorId required' }, { status: 400 })
  }

  const website = await db.website.findFirst({ where: { domain: 'sada-elaqar.vercel.app' } })
  if (!website) return NextResponse.json({ sessions: [], journey: [] })

  // جلب كل جلسات الزائر
  const sessions = await db.session.findMany({
    where: {
      websiteId: website.id,
      visitorId,
      visitorId: { not: { startsWith: 'demo_' } },
    },
    orderBy: { startedAt: 'asc' },
    select: {
      id: true,
      sessionId: true,
      startedAt: true,
      lastActiveAt: true,
      duration: true,
      pageViews: true,
      isBounce: true,
      country: true,
      countryCode: true,
      city: true,
      device: true,
      browser: true,
      os: true,
      referrerDomain: true,
      utmSource: true,
      utmCampaign: true,
      isActive: true,
    },
  })

  if (sessions.length === 0) {
    return NextResponse.json({ sessions: [], journey: [] })
  }

  // لكل جلسة، جلب مشاهداتها وأحداثها
  const sessionIds = sessions.map((s) => s.id)
  const [pageViews, events] = await Promise.all([
    db.pageView.findMany({
      where: { sessionId: { in: sessionIds } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        sessionId: true,
        path: true,
        title: true,
        createdAt: true,
        referrer: true,
      },
    }),
    db.event.findMany({
      where: { sessionId: { in: sessionIds } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        sessionId: true,
        name: true,
        category: true,
        label: true,
        createdAt: true,
        path: true,
      },
    }),
  ])

  // دمج في مسار زمني واحد
  type JourneyItem = {
    id: string
    kind: 'pageview' | 'event'
    sessionId: string
    name?: string
    label?: string
    category?: string
    path?: string
    title?: string
    createdAt: string
  }
  const journey: JourneyItem[] = []
  for (const pv of pageViews) {
    journey.push({
      id: pv.id,
      kind: 'pageview',
      sessionId: pv.sessionId,
      path: pv.path,
      title: pv.title,
      createdAt: pv.createdAt.toISOString(),
    })
  }
  for (const ev of events) {
    journey.push({
      id: ev.id,
      kind: 'event',
      sessionId: ev.sessionId,
      name: ev.name,
      label: ev.label,
      category: ev.category,
      path: ev.path,
      createdAt: ev.createdAt.toISOString(),
    })
  }
  journey.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  // إحصائيات ملخصة
  const summary = {
    totalSessions: sessions.length,
    totalPageViews: pageViews.length,
    totalEvents: events.length,
    totalDuration: sessions.reduce((sum, s) => sum + s.duration, 0),
    firstVisit: sessions[0]?.startedAt.toISOString() || null,
    lastVisit: sessions[sessions.length - 1]?.lastActiveAt.toISOString() || null,
    countries: [...new Set(sessions.map((s) => s.country).filter(Boolean))],
    devices: [...new Set(sessions.map((s) => s.device).filter(Boolean))],
    browsers: [...new Set(sessions.map((s) => s.browser).filter(Boolean))],
  }

  return NextResponse.json({
    visitorId,
    summary,
    sessions: sessions.map((s) => ({
      ...s,
      startedAt: s.startedAt.toISOString(),
      lastActiveAt: s.lastActiveAt.toISOString(),
    })),
    journey: journey.slice(0, limit),
  })
}
