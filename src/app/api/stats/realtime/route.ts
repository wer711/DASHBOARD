import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// الزوار النشطون الآن + آخر الأحداث اللحظية
export async function GET() {
  const website = await db.website.findFirst({ where: { domain: 'sada-elaqar.vercel.app' } })
  if (!website) {
    return NextResponse.json({ activeVisitors: 0, activeSessions: [], recentEvents: [] })
  }

  // الزائر يُعتبر "نشطاً" إذا كان نشطه في آخر 5 دقائق
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)

  const activeSessions = await db.session.findMany({
    where: { websiteId: website.id, isActive: true, lastActiveAt: { gte: fiveMinAgo } },
    orderBy: { lastActiveAt: 'desc' },
    take: 50,
    select: {
      id: true,
      visitorId: true,
      country: true,
      countryCode: true,
      city: true,
      device: true,
      browser: true,
      os: true,
      path: true,
      referrerDomain: true,
      utmSource: true,
      utmCampaign: true,
      startedAt: true,
      lastActiveAt: true,
      pageViews: true,
    },
  })

  // آخر الأحداث (كل الأنواع) — آخر 20
  const [recentPageViews, recentEvents] = await Promise.all([
    db.pageView.findMany({
      where: { websiteId: website.id },
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: {
        id: true,
        path: true,
        title: true,
        createdAt: true,
        session: {
          select: {
            country: true,
            countryCode: true,
            city: true,
            device: true,
            browser: true,
            utmSource: true,
          },
        },
      },
    }),
    db.event.findMany({
      where: { websiteId: website.id },
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: {
        id: true,
        name: true,
        category: true,
        label: true,
        createdAt: true,
        session: {
          select: {
            country: true,
            countryCode: true,
            city: true,
            device: true,
            utmSource: true,
          },
        },
      },
    }),
  ])

  // دمج وترتيب زمنياً
  type Feed = {
    id: string
    kind: 'pageview' | 'event'
    name?: string
    label?: string
    path?: string
    title?: string
    createdAt: string
    country: string | null
    countryCode: string | null
    city: string | null
    device: string | null
    browser: string | null
    utmSource: string | null
  }

  const feed: Feed[] = []
  for (const pv of recentPageViews) {
    feed.push({
      id: pv.id,
      kind: 'pageview',
      path: pv.path,
      title: pv.title,
      createdAt: pv.createdAt.toISOString(),
      country: pv.session?.country || null,
      countryCode: pv.session?.countryCode || null,
      city: pv.session?.city || null,
      device: pv.session?.device || null,
      browser: pv.session?.browser || null,
      utmSource: pv.session?.utmSource || null,
    })
  }
  for (const ev of recentEvents) {
    feed.push({
      id: ev.id,
      kind: 'event',
      name: ev.name,
      label: ev.label,
      createdAt: ev.createdAt.toISOString(),
      country: ev.session?.country || null,
      countryCode: ev.session?.countryCode || null,
      city: ev.session?.city || null,
      device: ev.session?.device || null,
      browser: ev.session?.browser || null,
      utmSource: ev.session?.utmSource || null,
    })
  }

  feed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({
    activeVisitors: activeSessions.length,
    activeSessions: activeSessions.map((s) => ({
      id: s.id,
      visitorId: s.visitorId,
      country: s.country,
      countryCode: s.countryCode,
      city: s.city,
      device: s.device,
      browser: s.browser,
      os: s.os,
      referrerDomain: s.referrerDomain,
      utmSource: s.utmSource,
      utmCampaign: s.utmCampaign,
      startedAt: s.startedAt.toISOString(),
      lastActiveAt: s.lastActiveAt.toISOString(),
      pageViews: s.pageViews,
    })),
    recentEvents: feed.slice(0, 20),
  })
}
