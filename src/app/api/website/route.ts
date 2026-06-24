import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// معلومات الموقع المُتابَع
export async function GET() {
  let website = await db.website.findFirst({ where: { domain: 'sada-elaqar.vercel.app' } })
  if (!website) {
    website = await db.website.create({
      data: { name: 'صدى العقار', domain: 'sada-elaqar.vercel.app' },
    })
  }

  return NextResponse.json({
    id: website.id,
    name: website.name,
    domain: website.domain,
    createdAt: website.createdAt.toISOString(),
    trackingScriptUrl: '/track.js',
    websiteId: website.id,
  })
}
