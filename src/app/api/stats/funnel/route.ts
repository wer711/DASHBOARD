import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// مسار التحويل: زيارة → تسجيل → توليد → ملاحظة → إحالة
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const range = (searchParams.get('range') as string) || '7d'
  const website = await db.website.findFirst({ where: { domain: 'sada-elaqar.vercel.app' } })
  if (!website) return NextResponse.json({ funnel: [], conversionRate: 0 })

  const from = getFrom(range)
  const [sessions, signups, generations, notes, referrals] = await Promise.all([
    db.session.count({ where: { websiteId: website.id, startedAt: { gte: from } } }),
    db.event.count({ where: { websiteId: website.id, createdAt: { gte: from }, name: 'signup' } }),
    db.event.count({ where: { websiteId: website.id, createdAt: { gte: from }, name: 'generate' } }),
    db.event.count({ where: { websiteId: website.id, createdAt: { gte: from }, name: 'note' } }),
    db.event.count({ where: { websiteId: website.id, createdAt: { gte: from }, name: 'referral' } }),
  ])

  const funnel = [
    { step: 'زيارة', icon: 'eye', count: sessions, rate: sessions > 0 ? 100 : 0 },
    { step: 'تسجيل', icon: 'user-plus', count: signups, rate: sessions > 0 ? (signups / sessions) * 100 : 0 },
    { step: 'توليد محتوى', icon: 'sparkles', count: generations, rate: sessions > 0 ? (generations / sessions) * 100 : 0 },
    { step: 'حفظ ملاحظة', icon: 'sticky-note', count: notes, rate: sessions > 0 ? (notes / sessions) * 100 : 0 },
    { step: 'إحالة', icon: 'share', count: referrals, rate: sessions > 0 ? (referrals / sessions) * 100 : 0 },
  ]

  const conversionRate = sessions > 0 ? (signups / sessions) * 100 : 0

  return NextResponse.json({ funnel, conversionRate })
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
