import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// نظرة عامة على الإحصائيات
// GET /api/stats/overview?range=today|yesterday|7d|30d|all
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const range = (searchParams.get('range') as string) || '7d'

  const website = await db.website.findFirst({ where: { domain: 'sada-elaqar.vercel.app' } })
  if (!website) {
    return NextResponse.json(emptyOverview())
  }

  const now = new Date()
  const { from, prevFrom, prevTo } = getRange(range, now)

  // الجلسات في الفترة
  const sessions = await db.session.findMany({
    where: { websiteId: website.id, startedAt: { gte: from } },
    select: { visitorId: true, pageViews: true, isBounce: true, duration: true, id: true },
  })

  // الفترة السابقة للمقارنة
  const prevSessions = await db.session.findMany({
    where: { websiteId: website.id, startedAt: { gte: prevFrom, lt: prevTo } },
    select: { visitorId: true },
  })

  // الزوار الفريدون
  const uniqueVisitors = new Set(sessions.map((s) => s.visitorId)).size
  const prevUniqueVisitors = new Set(prevSessions.map((s) => s.visitorId)).size

  // إجمالي المشاهدات
  const pageViews = sessions.reduce((sum, s) => sum + s.pageViews, 0)

  // معدل الارتداد
  const bounces = sessions.filter((s) => s.isBounce).length
  const bounceRate = sessions.length > 0 ? (bounces / sessions.length) * 100 : 0

  // متوسط مدة الجلسة
  const avgDuration = sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length : 0

  // الأحداث المخصصة في الفترة
  const events = await db.event.findMany({
    where: { websiteId: website.id, createdAt: { gte: from } },
    select: { name: true },
  })

  const eventCounts: Record<string, number> = {}
  for (const e of events) {
    eventCounts[e.name] = (eventCounts[e.name] || 0) + 1
  }

  const signups = eventCounts['signup'] || 0
  const generations = eventCounts['generate'] || 0
  const notes = eventCounts['note'] || 0
  const referrals = eventCounts['referral'] || 0
  const conversions = eventCounts['conversion'] || 0

  // الفترة السابقة للأحداث الرئيسية
  const prevEvents = await db.event.findMany({
    where: { websiteId: website.id, createdAt: { gte: prevFrom, lt: prevTo } },
    select: { name: true },
  })
  const prevEventCounts: Record<string, number> = {}
  for (const e of prevEvents) {
    prevEventCounts[e.name] = (prevEventCounts[e.name] || 0) + 1
  }

  // نسب التغيّر
  const calcChange = (curr: number, prev: number): number => {
    if (prev === 0) return curr > 0 ? 100 : 0
    return ((curr - prev) / prev) * 100
  }

  return NextResponse.json({
    range,
    visitors: uniqueVisitors,
    visitorsChange: calcChange(uniqueVisitors, prevUniqueVisitors),
    pageViews,
    pageViewsChange: calcChange(pageViews, prevSessions.length || 1),
    sessions: sessions.length,
    sessionsChange: calcChange(sessions.length, prevSessions.length),
    bounceRate: Math.round(bounceRate * 10) / 10,
    bounceRateChange: 0,
    avgSessionDuration: Math.round(avgDuration),
    signups,
    signupsChange: calcChange(signups, prevEventCounts['signup'] || 0),
    generations,
    generationsChange: calcChange(generations, prevEventCounts['generate'] || 0),
    notes,
    notesChange: calcChange(notes, prevEventCounts['note'] || 0),
    referrals,
    referralsChange: calcChange(referrals, prevEventCounts['referral'] || 0),
    conversions,
    conversionsChange: calcChange(conversions, prevEventCounts['conversion'] || 0),
  })
}

function emptyOverview() {
  return {
    range: '7d',
    visitors: 0, visitorsChange: 0,
    pageViews: 0, pageViewsChange: 0,
    sessions: 0, sessionsChange: 0,
    bounceRate: 0, bounceRateChange: 0,
    avgSessionDuration: 0,
    signups: 0, signupsChange: 0,
    generations: 0, generationsChange: 0,
    notes: 0, notesChange: 0,
    referrals: 0, referralsChange: 0,
    conversions: 0, conversionsChange: 0,
  }
}

function getRange(range: string, now: Date) {
  const from = new Date(now)
  const prevFrom = new Date(now)
  const prevTo = new Date(now)

  switch (range) {
    case 'today':
      from.setHours(0, 0, 0, 0)
      prevFrom.setDate(prevFrom.getDate() - 1)
      prevFrom.setHours(0, 0, 0, 0)
      prevTo.setDate(prevTo.getDate() - 1)
      prevTo.setHours(23, 59, 59, 999)
      break
    case 'yesterday':
      from.setDate(from.getDate() - 1)
      from.setHours(0, 0, 0, 0)
      prevFrom.setDate(prevFrom.getDate() - 2)
      prevFrom.setHours(0, 0, 0, 0)
      prevTo.setDate(prevTo.getDate() - 2)
      prevTo.setHours(23, 59, 59, 999)
      break
    case '30d':
      from.setDate(from.getDate() - 30)
      prevFrom.setDate(prevFrom.getDate() - 60)
      break
    case 'all':
      from.setFullYear(2020, 0, 1)
      prevFrom.setFullYear(2020, 0, 1)
      break
    case '7d':
    default:
      from.setDate(from.getDate() - 7)
      prevFrom.setDate(prevFrom.getDate() - 14)
      break
  }
  return { from, prevFrom, prevTo }
}
