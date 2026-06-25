import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// المصادر (Referrers)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const range = (searchParams.get('range') as string) || '7d'
  const website = await db.website.findFirst({ where: { domain: 'sada-elaqar.vercel.app' } })
  if (!website) return NextResponse.json({ sources: [], direct: 0 })

  const from = getFrom(range)
  const sessions = await db.session.findMany({
    where: { websiteId: website.id, startedAt: { gte: from }, visitorId: { not: { startsWith: 'demo_' } } },
    select: { referrerDomain: true, visitorId: true },
  })

  // تجميع حسب المصدر
  const map = new Map<string, { source: string; visitors: Set<string>; sessions: number }>()
  let direct = 0
  for (const s of sessions) {
    const key = s.referrerDomain || 'مباشر'
    if (key === 'مباشر') direct++
    if (!map.has(key)) {
      map.set(key, { source: key, visitors: new Set(), sessions: 0 })
    }
    const entry = map.get(key)!
    entry.visitors.add(s.visitorId)
    entry.sessions++
  }

  const sources = Array.from(map.values())
    .map((s) => ({
      source: s.source,
      visitors: s.visitors.size,
      sessions: s.sessions,
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 15)

  return NextResponse.json({ sources, direct, total: sessions.length })
}

function getFrom(range: string): Date {
  const from = new Date()
  switch (range) {
    case 'today': from.setHours(0, 0, 0, 0); break
    case '30d': from.setDate(from.getDate() - 30); break
    case 'all': from.setFullYear(2020, 0, 1); break
    default: from.setDate(from.getDate() - 7); break
  }
  return from
}
