import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// الأحداث المخصصة (تسجيلات، توليدات، ملاحظات، إحالات...)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const range = (searchParams.get('range') as string) || '7d'
  const website = await db.website.findFirst({ where: { domain: 'sada-elaqar.vercel.app' } })
  if (!website) return NextResponse.json({ events: [], total: 0 })

  const from = getFrom(range)
  const events = await db.event.findMany({
    where: { websiteId: website.id, createdAt: { gte: from } },
    select: { name: true, category: true, visitorId: true },
  })

  const map = new Map<string, { name: string; category: string | null; count: number; visitors: Set<string> }>()
  for (const e of events) {
    if (!map.has(e.name)) {
      map.set(e.name, { name: e.name, category: e.category, count: 0, visitors: new Set() })
    }
    const entry = map.get(e.name)!
    entry.count++
    entry.visitors.add(e.visitorId)
  }

  const result = Array.from(map.values())
    .map((e) => ({
      name: e.name,
      category: e.category,
      count: e.count,
      visitors: e.visitors.size,
    }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json({ events: result, total: events.length })
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
