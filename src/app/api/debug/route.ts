import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const websites = await db.website.findMany({
      select: { id: true, name: true, domain: true, createdAt: true, _count: { select: { sessions: true, pageViews: true, events: true } } }
    })
    const totalSessions = await db.session.count()
    const totalPageViews = await db.pageView.count()
    const totalEvents = await db.event.count()
    
    // آخر 5 جلسات
    const recentSessions = await db.session.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5,
      select: { id: true, visitorId: true, websiteId: true, startedAt: true, isActive: true }
    })
    
    // آخر 5 مشاهدات
    const recentPageViews = await db.pageView.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, path: true, websiteId: true, sessionId: true, visitorId: true, createdAt: true }
    })
    
    return NextResponse.json({
      websites,
      totals: { sessions: totalSessions, pageViews: totalPageViews, events: totalEvents },
      recentSessions,
      recentPageViews
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 })
  }
}
