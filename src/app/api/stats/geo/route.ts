import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// التوزيع الجغرافي
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const range = (searchParams.get('range') as string) || '7d'
  const website = await db.website.findFirst({ where: { domain: 'sada-elaqar.vercel.app' } })
  if (!website) return NextResponse.json({ countries: [], cities: [] })

  const from = getFrom(range)
  const sessions = await db.session.findMany({
    where: { websiteId: website.id, startedAt: { gte: from }, visitorId: { not: { startsWith: 'demo_' } } },
    select: { country: true, countryCode: true, city: true, latitude: true, longitude: true, visitorId: true },
  })

  // الدول
  const countryMap = new Map<string, { name: string; code: string; visitors: Set<string>; sessions: number }>()
  for (const s of sessions) {
    const name = s.country || 'غير معروف'
    const code = s.countryCode || '?'
    const key = code
    if (!countryMap.has(key)) {
      countryMap.set(key, { name, code, visitors: new Set(), sessions: 0 })
    }
    const entry = countryMap.get(key)!
    entry.visitors.add(s.visitorId)
    entry.sessions++
  }
  const countries = Array.from(countryMap.values())
    .map((c) => ({ name: c.name, code: c.code, visitors: c.visitors.size, sessions: c.sessions }))
    .sort((a, b) => b.sessions - a.sessions)

  // المدن
  const cityMap = new Map<string, { city: string; country: string; code: string; visitors: Set<string>; sessions: number }>()
  for (const s of sessions) {
    if (!s.city) continue
    const key = `${s.city}|${s.countryCode}`
    if (!cityMap.has(key)) {
      cityMap.set(key, { city: s.city, country: s.country || '', code: s.countryCode || '', visitors: new Set(), sessions: 0 })
    }
    const entry = cityMap.get(key)!
    entry.visitors.add(s.visitorId)
    entry.sessions++
  }
  const cities = Array.from(cityMap.values())
    .map((c) => ({ city: c.city, country: c.country, code: c.code, visitors: c.visitors.size, sessions: c.sessions }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 15)

  return NextResponse.json({ countries, cities })
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
