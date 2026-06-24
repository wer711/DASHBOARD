import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// سلسلة زمنية للزوار/المشاهدات
// GET /api/stats/timeseries?range=7d|30d|today
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const range = (searchParams.get('range') as string) || '7d'

  const website = await db.website.findFirst({ where: { domain: 'sada-elaqar.vercel.app' } })
  if (!website) {
    return NextResponse.json({ points: [] })
  }

  const now = new Date()
  const { from, buckets, granularity } = getBuckets(range, now)

  // كل الجلسات والمشاهدات في الفترة
  const [sessions, pageViews, events] = await Promise.all([
    db.session.findMany({
      where: { websiteId: website.id, startedAt: { gte: from } },
      select: { startedAt: true, visitorId: true },
    }),
    db.pageView.findMany({
      where: { websiteId: website.id, createdAt: { gte: from } },
      select: { createdAt: true, sessionId: true },
    }),
    db.event.findMany({
      where: { websiteId: website.id, createdAt: { gte: from } },
      select: { createdAt: true, name: true },
    }),
  ])

  // نملأ كل bucket
  const points = buckets.map((b) => {
    const sIn = sessions.filter((s) => s.startedAt >= b.start && s.startedAt < b.end)
    const pvIn = pageViews.filter((p) => p.createdAt >= b.start && p.createdAt < b.end)
    const evIn = events.filter((e) => e.createdAt >= b.start && e.createdAt < b.end)
    const uniqueVisitors = new Set(sIn.map((s) => s.visitorId)).size
    const signups = evIn.filter((e) => e.name === 'signup').length
    const generations = evIn.filter((e) => e.name === 'generate').length
    return {
      label: b.label,
      timestamp: b.start.toISOString(),
      visitors: uniqueVisitors,
      pageViews: pvIn.length,
      sessions: sIn.length,
      signups,
      generations,
    }
  })

  return NextResponse.json({ granularity, points })
}

function getBuckets(range: string, now: Date) {
  const from = new Date(now)
  const buckets: { start: Date; end: Date; label: string }[] = []

  if (range === 'today') {
    // ساعات اليوم
    from.setHours(0, 0, 0, 0)
    for (let h = 0; h < 24; h++) {
      const start = new Date(from)
      start.setHours(h, 0, 0, 0)
      const end = new Date(start)
      end.setHours(h + 1, 0, 0, 0)
      buckets.push({ start, end, label: `${h}:00` })
    }
    return { from, buckets, granularity: 'hour' as const }
  }

  if (range === '30d') {
    from.setDate(from.getDate() - 29)
    from.setHours(0, 0, 0, 0)
    for (let d = 0; d < 30; d++) {
      const start = new Date(from)
      start.setDate(start.getDate() + d)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      const label = `${start.getDate()}/${start.getMonth() + 1}`
      buckets.push({ start, end, label })
    }
    return { from, buckets, granularity: 'day' as const }
  }

  // 7d افتراضياً
  from.setDate(from.getDate() - 6)
  from.setHours(0, 0, 0, 0)
  const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  for (let d = 0; d < 7; d++) {
    const start = new Date(from)
    start.setDate(start.getDate() + d)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    const label = dayNames[start.getDay()]
    buckets.push({ start, end, label })
  }
  return { from, buckets, granularity: 'day' as const }
}
