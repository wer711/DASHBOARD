import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// أعلى الصفحات
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const range = (searchParams.get('range') as string) || '7d'
  const website = await db.website.findFirst({ where: { domain: 'sada-elaqar.vercel.app' } })
  if (!website) return NextResponse.json({ pages: [] })

  const from = getFrom(range)
  const pageViews = await db.pageView.findMany({
    where: { websiteId: website.id, createdAt: { gte: from }, visitorId: { not: { startsWith: 'demo_' } } },
    select: { path: true, title: true, visitorId: true, sessionId: true },
  })

  // تجميع حسب المسار
  const map = new Map<string, { path: string; title: string | null; views: number; visitors: Set<string>; sessions: Set<string> }>()
  for (const pv of pageViews) {
    const key = pv.path
    if (!map.has(key)) {
      map.set(key, { path: pv.path, title: pv.title, views: 0, visitors: new Set(), sessions: new Set() })
    }
    const entry = map.get(key)!
    entry.views++
    entry.visitors.add(pv.visitorId)
    entry.sessions.add(pv.sessionId)
  }

  const pages = Array.from(map.values())
    .map((p) => ({
      path: p.path,
      title: p.title,
      views: p.views,
      visitors: p.visitors.size,
      sessions: p.sessions.size,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 15)

  return NextResponse.json({ pages })
}

function getFrom(range: string): Date {
  const from = new Date()
  switch (range) {
    case 'today':
      from.setHours(0, 0, 0, 0); break
    case '30d':
      from.setDate(from.getDate() - 30); break
    case 'all':
      from.setFullYear(2020, 0, 1); break
    case '7d':
    default:
      from.setDate(from.getDate() - 7); break
  }
  return from
}
