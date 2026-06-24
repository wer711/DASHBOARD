import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// الحملات الترويجية (UTM)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const range = (searchParams.get('range') as string) || '7d'
  const website = await db.website.findFirst({ where: { domain: 'sada-elaqar.vercel.app' } })
  if (!website) return NextResponse.json({ campaigns: [], sources: [], mediums: [] })

  const from = getFrom(range)
  const sessions = await db.session.findMany({
    where: { websiteId: website.id, startedAt: { gte: from } },
    select: { utmSource: true, utmMedium: true, utmCampaign: true, visitorId: true },
  })

  const withUtm = sessions.filter((s) => s.utmSource || s.utmMedium || s.utmCampaign)

  // الحملات
  const campaignMap = new Map<string, { name: string; visitors: Set<string>; sessions: number }>()
  for (const s of withUtm) {
    const key = s.utmCampaign || '(بدون حملة)'
    if (!campaignMap.has(key)) campaignMap.set(key, { name: key, visitors: new Set(), sessions: 0 })
    const e = campaignMap.get(key)!
    e.visitors.add(s.visitorId)
    e.sessions++
  }
  const campaigns = Array.from(campaignMap.values())
    .map((c) => ({ name: c.name, visitors: c.visitors.size, sessions: c.sessions }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 15)

  // المصادر
  const sourceMap = new Map<string, { name: string; visitors: Set<string>; sessions: number }>()
  for (const s of withUtm) {
    if (!s.utmSource) continue
    if (!sourceMap.has(s.utmSource)) sourceMap.set(s.utmSource, { name: s.utmSource, visitors: new Set(), sessions: 0 })
    const e = sourceMap.get(s.utmSource)!
    e.visitors.add(s.visitorId)
    e.sessions++
  }
  const sources = Array.from(sourceMap.values())
    .map((c) => ({ name: c.name, visitors: c.visitors.size, sessions: c.sessions }))
    .sort((a, b) => b.sessions - a.sessions)

  // الوسائط
  const mediumMap = new Map<string, { name: string; visitors: Set<string>; sessions: number }>()
  for (const s of withUtm) {
    if (!s.utmMedium) continue
    if (!mediumMap.has(s.utmMedium)) mediumMap.set(s.utmMedium, { name: s.utmMedium, visitors: new Set(), sessions: 0 })
    const e = mediumMap.get(s.utmMedium)!
    e.visitors.add(s.visitorId)
    e.sessions++
  }
  const mediums = Array.from(mediumMap.values())
    .map((c) => ({ name: c.name, visitors: c.visitors.size, sessions: c.sessions }))
    .sort((a, b) => b.sessions - a.sessions)

  return NextResponse.json({
    campaigns,
    sources,
    mediums,
    trackedVisitors: withUtm.length,
    totalVisitors: sessions.length,
  })
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
