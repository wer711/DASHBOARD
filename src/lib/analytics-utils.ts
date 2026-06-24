/**
 * أدوات استخراج معلومات الزائر من الطلب
 */

// استخراج IP الحقيقي للزائر خلف البروكسي/Caddy
export function getClientIP(req: Request): string {
  const headers = req.headers
  return (
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('cf-connecting-ip') ||
    headers.get('x-client-ip') ||
    '0.0.0.0'
  )
}

// استخراج الـ User-Agent
export function getUserAgent(req: Request): string {
  return req.headers.get('user-agent') || ''
}

// تحليل User-Agent إلى متصفح/نظام/جهاز
export interface DeviceInfo {
  browser: string
  browserVersion: string
  os: string
  osVersion: string
  device: 'desktop' | 'mobile' | 'tablet'
  brand?: string
  model?: string
}

export function parseUserAgent(ua: string): DeviceInfo {
  const result: DeviceInfo = {
    browser: 'Unknown',
    browserVersion: '',
    os: 'Unknown',
    osVersion: '',
    device: 'desktop',
  }
  if (!ua) return result

  // نظام التشغيل
  if (/Windows NT 10/.test(ua)) { result.os = 'Windows'; result.osVersion = '10/11' }
  else if (/Windows NT 6\.3/.test(ua)) { result.os = 'Windows'; result.osVersion = '8.1' }
  else if (/Windows/.test(ua)) { result.os = 'Windows' }
  else if (/Android ([\d.]+)/.test(ua)) { result.os = 'Android'; result.osVersion = RegExp.$1 }
  else if (/iPhone OS ([\d_]+)/.test(ua)) { result.os = 'iOS'; result.osVersion = RegExp.$1.replace(/_/g, '.') }
  else if (/iPad.*OS ([\d_]+)/.test(ua)) { result.os = 'iOS'; result.osVersion = RegExp.$1.replace(/_/g, '.') }
  else if (/Mac OS X ([\d_]+)/.test(ua)) { result.os = 'macOS'; result.osVersion = RegExp.$1.replace(/_/g, '.') }
  else if (/Mac OS X/.test(ua)) { result.os = 'macOS' }
  else if (/Linux/.test(ua)) { result.os = 'Linux' }
  else if (/CrOS/.test(ua)) { result.os = 'ChromeOS' }

  // المتصفح
  if (/Edg\/([\d.]+)/.test(ua)) { result.browser = 'Edge'; result.browserVersion = RegExp.$1 }
  else if (/OPR\/([\d.]+)/.test(ua)) { result.browser = 'Opera'; result.browserVersion = RegExp.$1 }
  else if (/Firefox\/([\d.]+)/.test(ua)) { result.browser = 'Firefox'; result.browserVersion = RegExp.$1 }
  else if (/Chrome\/([\d.]+)/.test(ua)) { result.browser = 'Chrome'; result.browserVersion = RegExp.$1 }
  else if (/Version\/([\d.]+).*Safari/.test(ua)) { result.browser = 'Safari'; result.browserVersion = RegExp.$1 }
  else if (/Safari/.test(ua)) { result.browser = 'Safari' }

  // الجهاز
  if (/iPad|Tablet|PlayBook|Silk/.test(ua)) {
    result.device = 'tablet'
  } else if (/Mobile|Android|iPhone|iPod|Windows Phone/.test(ua)) {
    result.device = 'mobile'
  } else {
    result.device = 'desktop'
  }

  // العلامة التجارية
  if (/iPhone/.test(ua)) { result.brand = 'Apple'; result.model = 'iPhone' }
  else if (/iPad/.test(ua)) { result.brand = 'Apple'; result.model = 'iPad' }
  else if (/Samsung|SM-|Galaxy/.test(ua)) { result.brand = 'Samsung' }
  else if (/Huawei|HUAWEI/.test(ua)) { result.brand = 'Huawei' }
  else if (/Xiaomi|Redmi|MI\s/.test(ua)) { result.brand = 'Xiaomi' }
  else if (/Pixel/.test(ua)) { result.brand = 'Google' }
  else if (/Oppo/.test(ua)) { result.brand = 'Oppo' }
  else if (/Macintosh/.test(ua)) { result.brand = 'Apple'; result.model = 'Mac' }

  return result
}

// استخراج النطاق من URL
export function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

// استخراج معاملات UTM من URL
export function extractUTM(url: string): {
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmTerm: string | null
  utmContent: string | null
} {
  try {
    const u = new URL(url, 'http://localhost')
    return {
      utmSource: u.searchParams.get('utm_source'),
      utmMedium: u.searchParams.get('utm_medium'),
      utmCampaign: u.searchParams.get('utm_campaign'),
      utmTerm: u.searchParams.get('utm_term'),
      utmContent: u.searchParams.get('utm_content'),
    }
  } catch {
    return { utmSource: null, utmMedium: null, utmCampaign: null, utmTerm: null, utmContent: null }
  }
}

// استخراج المسار من URL
export function extractPath(url: string): string {
  try {
    const u = new URL(url, 'http://localhost')
    return u.pathname
  } catch {
    return '/'
  }
}

// تحديد ما إذا كان المُحيل داخلياً (نفس الموقع)
export function isInternalReferrer(referrer: string | null, currentDomain: string): boolean {
  if (!referrer) return false
  const refDomain = extractDomain(referrer)
  return refDomain === currentDomain
}

// توليد مفتاح مختصر للجلسة النشطة (للاستخدام في الذاكرة)
export function sessionKey(websiteId: string, sessionId: string): string {
  return `${websiteId}:${sessionId}`
}
