import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// حذف كل البيانات التجريبية (التي تحمل visitorId يبدأ بـ demo_)
export async function POST() {
  try {
    const website = await db.website.findFirst({ where: { domain: 'sada-elaqar.vercel.app' } })
    if (!website) {
      return NextResponse.json({ ok: false, error: 'website not found' }, { status: 404 })
    }

    // حذف مشاهدات الجلسات التجريبية
    const demoSessions = await db.session.findMany({
      where: { visitorId: { startsWith: 'demo_' } },
      select: { id: true },
    })
    const demoSessionIds = demoSessions.map((s) => s.id)

    const deletedPageViews = await db.pageView.deleteMany({
      where: { sessionId: { in: demoSessionIds } },
    })
    const deletedEvents = await db.event.deleteMany({
      where: { sessionId: { in: demoSessionIds } },
    })
    const deletedSessions = await db.session.deleteMany({
      where: { id: { in: demoSessionIds } },
    })

    return NextResponse.json({
      ok: true,
      deleted: {
        sessions: deletedSessions.count,
        pageViews: deletedPageViews.count,
        events: deletedEvents.count,
      },
    })
  } catch (err: any) {
    console.error('[clear-demo] error:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
