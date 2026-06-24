import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// الأجهزة / المتصفحات / أنظمة التشغيل
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const range = (searchParams.get('range') as string) || '7d'
  const website = await db.website.findFirst({ where: { domain: 'sada-elaqar.vercel.app' } })
  if (!website) return NextResponse.json({ devices: [], browsers: [], os: [], brands: [] })

  const from = getFrom(range)
  const sessions = await db.session.findMany({
    where: { websiteId: website.id, startedAt: { gte: from } },
    select: { device: true, browser: true, os: true, brand: true, visitorId: true },
  })

  const agg = (field: keyof typeof sessions) => {
    const map = new Map<string, { name: string; visitors: Set<string>; sessions: number }>()
    for (const s of sessions) {
      const v = (s[field] as string) || 'غير معروف'
      if (!map.has(v)) map.set(v, { name: v, visitors: new Set(), sessions: 0 })
      const e = map.get(v)!
      e.visitors.add(s.visitorId)
      e.sessions++
    }
    return Array.from(map.values())
      .map((e) => ({ name: e.name, visitors: e.visitors.size, sessions: e.sessions }))
      .sort((a, b) => b.sessions - a.sessions)
  }

  return NextResponse.json({
    devices: agg('device').slice(0, 10),
    browsers: agg('browser').slice(0, 10),
    os: agg('os').slice(0, 10),
    brands: agg('brand').slice(0, 10),
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
