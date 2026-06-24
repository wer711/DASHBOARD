import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// آخر النشاطات (جدول موحّد للمشاهدات + الأحداث)
// يفلتر البيانات بـ timestamps <= الآن (لتجاهل البيانات التجريبية المستقبلية)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(Number(searchParams.get('limit') || 30), 100)
  const website = await db.website.findFirst({ where: { domain: 'sada-elaqar.vercel.app' } })
  if (!website) return NextResponse.json({ items: [] })

  const now = new Date()

  const [pageViews, events] = await Promise.all([
    db.pageView.findMany({
      where: { websiteId: website.id, createdAt: { lte: now } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true, path: true, title: true, createdAt: true,
        session: { select: { country: true, countryCode: true, city: true, device: true, browser: true, os: true, referrerDomain: true, utmSource: true, utmCampaign: true, visitorId: true } },
      },
    }),
    db.event.findMany({
      where: { websiteId: website.id, createdAt: { lte: now } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true, name: true, category: true, label: true, createdAt: true, path: true,
        session: { select: { country: true, countryCode: true, city: true, device: true, browser: true, os: true, referrerDomain: true, utmSource: true, utmCampaign: true, visitorId: true } },
      },
    }),
  ])

  type Item = {
    id: string
    kind: 'pageview' | 'event'
    name?: string | null
    label?: string | null
    category?: string | null
    path?: string | null
    title?: string | null
    createdAt: string
    country: string | null
    countryCode: string | null
    city: string | null
    device: string | null
    browser: string | null
    os: string | null
    referrerDomain: string | null
    utmSource: string | null
    utmCampaign: string | null
    visitorId: string | null
  }

  const items: Item[] = []
  for (const pv of pageViews) {
    items.push({
      id: `pv_${pv.id}`,
      kind: 'pageview',
      path: pv.path, title: pv.title,
      createdAt: pv.createdAt.toISOString(),
      country: pv.session?.country || null,
      countryCode: pv.session?.countryCode || null,
      city: pv.session?.city || null,
      device: pv.session?.device || null,
      browser: pv.session?.browser || null,
      os: pv.session?.os || null,
      referrerDomain: pv.session?.referrerDomain || null,
      utmSource: pv.session?.utmSource || null,
      utmCampaign: pv.session?.utmCampaign || null,
      visitorId: pv.session?.visitorId || null,
    })
  }
  for (const e of events) {
    items.push({
      id: `ev_${e.id}`,
      kind: 'event',
      name: e.name, label: e.label, category: e.category, path: e.path,
      createdAt: e.createdAt.toISOString(),
      country: e.session?.country || null,
      countryCode: e.session?.countryCode || null,
      city: e.session?.city || null,
      device: e.session?.device || null,
      browser: e.session?.browser || null,
      os: e.session?.os || null,
      referrerDomain: e.session?.referrerDomain || null,
      utmSource: e.session?.utmSource || null,
      utmCampaign: e.session?.utmCampaign || null,
      visitorId: e.session?.visitorId || null,
    })
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({ items: items.slice(0, limit) })
}
