import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// توليد بيانات تجريبية لاختبار اللوحة فوراً
// POST /api/seed-demo
export async function POST() {
  let website = await db.website.findFirst({ where: { domain: 'sada-elaqar.vercel.app' } })
  if (!website) {
    website = await db.website.create({
      data: { name: 'صدى العقار', domain: 'sada-elaqar.vercel.app' },
    })
  }

  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
  const pick = <T,>(arr: T[]) => arr[rand(0, arr.length - 1)]
  const countries = [
    { name: 'السعودية', code: 'SA', cities: ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة'] },
    { name: 'الإمارات', code: 'AE', cities: ['دبي', 'أبوظبي', 'الشارقة'] },
    { name: 'مصر', code: 'EG', cities: ['القاهرة', 'الإسكندرية', 'الجيزة'] },
    { name: 'الكويت', code: 'KW', cities: ['الكويت', 'حولي'] },
    { name: 'قطر', code: 'QA', cities: ['الدوحة'] },
    { name: 'المغرب', code: 'MA', cities: ['الدار البيضاء', 'الرباط', 'مراكش'] },
    { name: 'الأردن', code: 'JO', cities: ['عمّان', 'الزرقاء'] },
    { name: 'البحرين', code: 'BH', cities: ['المنامة'] },
    { name: 'عُمان', code: 'OM', cities: ['مسقط', 'صلالة'] },
    { name: 'الجزائر', code: 'DZ', cities: ['الجزائر', 'وهران'] },
  ]
  const browsers = [
    { name: 'Chrome', version: '120.0.0' },
    { name: 'Safari', version: '17.0' },
    { name: 'Edge', version: '120.0.0' },
    { name: 'Firefox', version: '121.0' },
  ]
  const osList = [
    { name: 'Windows', version: '10/11' },
    { name: 'iOS', version: '17.0' },
    { name: 'Android', version: '14' },
    { name: 'macOS', version: '14.0' },
  ]
  const devices = ['desktop', 'mobile', 'tablet']
  const brands = ['Apple', 'Samsung', 'Xiaomi', 'Huawei', null]
  const paths = ['/', '/#demo', '/#features', '/#how', '/#faq', '/#lead-form']
  const titles = ['صدى العقار — الرئيسية', 'تجربة الآن', 'المميزات', 'كيف يعمل', 'الأسئلة الشائعة', 'تسجيل']
  const referrers = [
    'https://google.com', 'https://twitter.com', 'https://facebook.com',
    'https://instagram.com', 'https://t.co', 'https://linkedin.com',
    'https://wa.me', null, null, null,
  ]
  const utmCombos = [
    { source: 'google', medium: 'cpc', campaign: 'brand_q4' },
    { source: 'instagram', medium: 'social', campaign: 'reels_khaleej' },
    { source: 'twitter', medium: 'social', campaign: 'launch_promo' },
    { source: 'newsletter', medium: 'email', campaign: 'weekly' },
    { source: 'whatsapp', medium: 'social', campaign: 'friend_referral' },
    null, null, null,
  ]

  // نولّد جلسات آخر 7 أيام
  const now = new Date()
  let sessionsCreated = 0
  let pageViewsCreated = 0
  let eventsCreated = 0

  for (let dayAgo = 6; dayAgo >= 0; dayAgo--) {
    const dayStart = new Date(now)
    dayStart.setDate(dayStart.getDate() - dayAgo)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)

    // عدد الجلسات في هذا اليوم (مع نمو تدريجي)
    const baseCount = 15 + (6 - dayAgo) * 5 + rand(0, 10)
    const sessionCount = baseCount

    // للـ dayAgo = 0 (اليوم)، نحدّد النطاق من بداية اليوم حتى "الآن" فقط
    // لتفادي إنشاء بيانات بـ timestamps مستقبلية
    const now = new Date()
    const dayRangeEnd = dayAgo === 0 ? now : dayEnd

    for (let i = 0; i < sessionCount; i++) {
      const country = pick(countries)
      const browser = pick(browsers)
      const os = pick(osList)
      const device = pick(devices)
      const brand = pick(brands)
      const city = pick(country.cities)
      const path = pick(paths)
      const title = titles[paths.indexOf(path)] || null
      const referrer = pick(referrers)
      const utm = pick(utmCombos)
      const visitorId = `demo_v_${rand(10000, 99999)}_${dayAgo}_${i}`
      const sessionId = `demo_s_${rand(100000, 999999)}_${dayAgo}_${i}`

      const startedAt = new Date(dayStart.getTime() + Math.random() * (dayRangeEnd.getTime() - dayStart.getTime()))
      const duration = rand(5, 600)
      const lastActiveAt = new Date(startedAt.getTime() + duration * 1000)
      // نشط فقط إذا كانت الجلسة في آخر 5 دقائق
      const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000)
      const isActive = dayAgo === 0 && lastActiveAt > fiveMinAgo
      const pageViewCount = rand(1, 5)
      const isBounce = pageViewCount === 1 && Math.random() < 0.5

      const session = await db.session.create({
        data: {
          websiteId: website.id,
          sessionId,
          visitorId,
          ip: `89.${rand(0, 250)}.${rand(0, 250)}.${rand(1, 250)}`,
          country: country.name,
          countryCode: country.code,
          city,
          region: city,
          latitude: 0,
          longitude: 0,
          browser: browser.name,
          browserVersion: browser.version,
          os: os.name,
          osVersion: os.version,
          device,
          brand: brand || null,
          model: brand || null,
          screenWidth: device === 'mobile' ? pick([375, 390, 414]) : pick([1920, 1440, 1366]),
          screenHeight: device === 'mobile' ? pick([667, 844, 896]) : pick([1080, 900, 768]),
          language: pick(['ar', 'ar-SA', 'ar-AE', 'ar-EG', 'en']),
          referrer,
          referrerDomain: referrer ? new URL(referrer).hostname.replace(/^www\./, '') : null,
          utmSource: utm?.source || null,
          utmMedium: utm?.medium || null,
          utmCampaign: utm?.campaign || null,
          startedAt,
          lastActiveAt,
          endedAt: isActive ? null : lastActiveAt,
          duration,
          pageViews: pageViewCount,
          isBounce,
          isActive,
        },
      })
      sessionsCreated++

      // مشاهدات الصفحة
      for (let p = 0; p < pageViewCount; p++) {
        const pPath = pick(paths)
        const pTitle = titles[paths.indexOf(pPath)] || null
        await db.pageView.create({
          data: {
            websiteId: website.id,
            sessionId: session.id,
            visitorId,
            url: `https://sada-elaqar.vercel.app${pPath}`,
            path: pPath,
            title: pTitle,
            referrer: p === 0 ? referrer : null,
            createdAt: new Date(startedAt.getTime() + p * 60000),
          },
        })
        pageViewsCreated++
      }

      // أحداث — التسجيل/التوليد/الملاحظة/الإحالة (احتمال أقل)
      if (!isBounce) {
        // تسجيل
        if (Math.random() < 0.25) {
          await db.event.create({
            data: {
              websiteId: website.id, sessionId: session.id, visitorId,
              name: 'signup', category: 'conversion', label: 'تسجيل جديد',
              url: `https://sada-elaqar.vercel.app${path}`,
              path, createdAt: new Date(startedAt.getTime() + 90000),
            },
          })
          eventsCreated++

          // توليد
          if (Math.random() < 0.7) {
            const genCount = rand(1, 5)
            for (let g = 0; g < genCount; g++) {
              await db.event.create({
                data: {
                  websiteId: website.id, sessionId: session.id, visitorId,
                  name: 'generate', category: 'content', label: 'توليد محتوى عقاري',
                  url: `https://sada-elaqar.vercel.app${path}`,
                  path, createdAt: new Date(startedAt.getTime() + 120000 + g * 60000),
                },
              })
              eventsCreated++
            }

            // ملاحظة
            if (Math.random() < 0.4) {
              await db.event.create({
                data: {
                  websiteId: website.id, sessionId: session.id, visitorId,
                  name: 'note', category: 'engagement', label: 'حفظ ملاحظة',
                  url: `https://sada-elaqar.vercel.app${path}`,
                  path, createdAt: new Date(startedAt.getTime() + 180000),
                },
              })
              eventsCreated++
            }
          }

          // إحالة
          if (Math.random() < 0.2) {
            await db.event.create({
              data: {
                websiteId: website.id, sessionId: session.id, visitorId,
                name: 'referral', category: 'conversion', label: 'مشاركة رابط إحالة',
                url: `https://sada-elaqar.vercel.app${path}`,
                path, createdAt: new Date(startedAt.getTime() + 200000),
              },
            })
            eventsCreated++
          }
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    created: {
      sessions: sessionsCreated,
      pageViews: pageViewsCreated,
      events: eventsCreated,
    },
  })
}
