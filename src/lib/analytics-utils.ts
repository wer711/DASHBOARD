/**
 * أدوات استخراج معلومات الزائر من الطلب
 */

// استخراج IP الحقيقي للزائر خلف البروكسي/Caddy/Vercel
export function getClientIP(req: Request): string {
  const headers = req.headers
  // Vercel تستخدم x-vercel-forwarded-for كأولوية
  return (
    headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('cf-connecting-ip') ||
    headers.get('x-client-ip') ||
    '0.0.0.0'
  )
}

// استخراج بيانات الموقع الجغرافي من Vercel headers (مجانية وموثوقة)
export interface GeoInfo {
  country: string | null
  countryCode: string | null
  city: string | null
  region: string | null
  latitude: number | null
  longitude: number | null
}

// أسماء الدول بالعربية
const COUNTRY_NAMES_AR: Record<string, string> = {
  SA: 'السعودية', AE: 'الإمارات', EG: 'مصر', KW: 'الكويت', QA: 'قطر',
  BH: 'البحرين', OM: 'عُمان', JO: 'الأردن', IQ: 'العراق', YE: 'اليمن',
  SY: 'سوريا', LB: 'لبنان', PS: 'فلسطين', SD: 'السودان', LY: 'ليبيا',
  TN: 'تونس', DZ: 'الجزائر', MA: 'المغرب', MR: 'موريتانIA', DJ: 'جيبوتي',
  SO: 'الصومال', KM: 'جزر القمر', TD: 'تشاد',
  US: 'الولايات المتحدة', GB: 'المملكة المتحدة', FR: 'فرنسا', DE: 'ألمانيا',
  TR: 'تركيا', IR: 'إيران', IN: 'الهند', PK: 'باكستان', ID: 'إندونيسيا',
  MY: 'ماليزيا', CA: 'كندا', AU: 'أستراليا', BR: 'البرازيل', RU: 'روسيا',
  CN: 'الصين', JP: 'اليابان', KR: 'كوريا الجنوبية', ES: 'إسبانيا',
  IT: 'إيطاليا', NL: 'هولندا', BE: 'بلجيكا', CH: 'سويسرا', SE: 'السويد',
  NO: 'النرويج', DK: 'الدنمارك', FI: 'فنلندا', PL: 'بولندا', PT: 'البرتغال',
  GR: 'اليونان', AT: 'النمسا', IE: 'أيرلندا', CZ: 'التشيك', RO: 'رومانيا',
  HU: 'المجر', SK: 'سلوفاكيا', BG: 'بلغاريا', HR: 'كرواتيا', RS: 'صربيا',
  UA: 'أوكرانيا', BY: 'بيلاروس', LT: 'ليتوانيا', LV: 'لاتفيا', EE: 'إستونيا',
}

export function getGeoFromHeaders(req: Request): GeoInfo {
  const headers = req.headers
  const countryCode = headers.get('x-vercel-ip-country') || null
  const country = countryCode ? (COUNTRY_NAMES_AR[countryCode] || countryCode) : null
  const city = headers.get('x-vercel-ip-city') || null
  const region = headers.get('x-vercel-ip-country-region') || null
  const latStr = headers.get('x-vercel-ip-latitude')
  const lonStr = headers.get('x-vercel-ip-longitude')

  return {
    country,
    countryCode,
    city: city ? decodeURIComponent(city) : null,
    region,
    latitude: latStr ? Number(latStr) : null,
    longitude: lonStr ? Number(lonStr) : null,
  }
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

  // نظام التشغيل (ترتيب مهم: الأكثر تحديداً أولاً)
  if (/Windows NT 10/.test(ua)) { result.os = 'Windows'; result.osVersion = '10/11' }
  else if (/Windows NT 6\.3/.test(ua)) { result.os = 'Windows'; result.osVersion = '8.1' }
  else if (/Windows NT 6\.1/.test(ua)) { result.os = 'Windows'; result.osVersion = '7' }
  else if (/Windows/.test(ua)) { result.os = 'Windows' }
  else if (/Android ([\d.]+)/.test(ua)) { result.os = 'Android'; result.osVersion = RegExp.$1 }
  else if (/iPhone OS ([\d_]+)/.test(ua)) { result.os = 'iOS'; result.osVersion = RegExp.$1.replace(/_/g, '.') }
  else if (/iPad.*OS ([\d_]+)/.test(ua)) { result.os = 'iOS'; result.osVersion = RegExp.$1.replace(/_/g, '.') }
  else if (/CPU OS ([\d_]+)/.test(ua)) { result.os = 'iOS'; result.osVersion = RegExp.$1.replace(/_/g, '.') }
  else if (/Mac OS X ([\d_]+)/.test(ua)) { result.os = 'macOS'; result.osVersion = RegExp.$1.replace(/_/g, '.') }
  else if (/Mac OS X/.test(ua)) { result.os = 'macOS' }
  else if (/Macintosh/.test(ua)) { result.os = 'macOS' }
  else if (/CrOS/.test(ua)) { result.os = 'ChromeOS' }
  else if (/Linux/.test(ua)) { result.os = 'Linux' }
  else if (/Ubuntu/.test(ua)) { result.os = 'Linux'; result.osVersion = 'Ubuntu' }

  // المتصفح (ترتيب مهم: Edg قبل Chrome، OPR قبل Chrome، إلخ)
  if (/Edg\/([\d.]+)/.test(ua) || /Edge\/([\d.]+)/.test(ua)) {
    result.browser = 'Edge'
    result.browserVersion = RegExp.$1
  }
  else if (/OPR\/([\d.]+)/.test(ua) || /Opera\/([\d.]+)/.test(ua)) {
    result.browser = 'Opera'
    result.browserVersion = RegExp.$1
  }
  else if (/SamsungBrowser\/([\d.]+)/.test(ua)) {
    result.browser = 'Samsung Internet'
    result.browserVersion = RegExp.$1
  }
  else if (/MiuiBrowser\/([\d.]+)/.test(ua)) {
    result.browser = 'Mi Browser'
    result.browserVersion = RegExp.$1
  }
  else if (/Firefox\/([\d.]+)/.test(ua)) {
    result.browser = 'Firefox'
    result.browserVersion = RegExp.$1
  }
  else if (/YaBrowser\/([\d.]+)/.test(ua)) {
    result.browser = 'Yandex'
    result.browserVersion = RegExp.$1
  }
  else if (/UCBrowser\/([\d.]+)/.test(ua)) {
    result.browser = 'UC Browser'
    result.browserVersion = RegExp.$1
  }
  // Chrome: تأكد أنه ليس Safari أو Edge أو Opera (تم التحقق أعلاه)
  else if (/Chrome\/([\d.]+)/.test(ua)) {
    result.browser = 'Chrome'
    result.browserVersion = RegExp.$1
  }
  // Safari: يجب التأكد أنه ليس Chrome (الذي يدّعي أنه Safari)
  else if (/Version\/([\d.]+).*Safari/.test(ua)) {
    result.browser = 'Safari'
    result.browserVersion = RegExp.$1
  }
  else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    result.browser = 'Safari'
  }
  // متصفحات WebView للهواتف
  else if (/wv\)/.test(ua) && /Chrome/.test(ua)) {
    result.browser = 'Chrome WebView'
  }
  // Facebook/Twitter/Instagram in-app browsers
  else if (/FBAN|FBAV/.test(ua)) {
    result.browser = 'Facebook'
  }
  else if (/Instagram/.test(ua)) {
    result.browser = 'Instagram'
  }
  else if (/Twitter/.test(ua)) {
    result.browser = 'Twitter'
  }
  else if (/WhatsApp/.test(ua)) {
    result.browser = 'WhatsApp'
  }
  else if (/Snapchat/.test(ua)) {
    result.browser = 'Snapchat'
  }

  // الجهاز
  if (/iPad|Tablet|PlayBook|Silk/.test(ua)) {
    result.device = 'tablet'
  } else if (/Mobile|Android|iPhone|iPod|Windows Phone|BlackBerry/.test(ua)) {
    result.device = 'mobile'
  } else {
    result.device = 'desktop'
  }

  // العلامة التجارية (محدّثة لتشمل المزيد)
  if (/iPhone/.test(ua)) { result.brand = 'Apple'; result.model = 'iPhone' }
  else if (/iPad/.test(ua)) { result.brand = 'Apple'; result.model = 'iPad' }
  else if (/Macintosh/.test(ua)) { result.brand = 'Apple'; result.model = 'Mac' }
  else if (/Samsung|SM-|Galaxy/.test(ua)) { result.brand = 'Samsung' }
  else if (/Huawei|HUAWEI|HW-/.test(ua)) { result.brand = 'Huawei' }
  else if (/Xiaomi|Redmi|MI\s/.test(ua)) { result.brand = 'Xiaomi' }
  else if (/Pixel/.test(ua)) { result.brand = 'Google' }
  else if (/Oppo/.test(ua)) { result.brand = 'Oppo' }
  else if (/vivo/.test(ua)) { result.brand = 'Vivo' }
  else if (/Realme/.test(ua)) { result.brand = 'Realme' }
  else if (/Nokia/.test(ua)) { result.brand = 'Nokia' }
  else if (/OnePlus/.test(ua)) { result.brand = 'OnePlus' }
  else if (/LG/.test(ua)) { result.brand = 'LG' }
  else if (/Sony/.test(ua)) { result.brand = 'Sony' }
  else if (/HTC/.test(ua)) { result.brand = 'HTC' }
  else if (/Lenovo/.test(ua)) { result.brand = 'Lenovo' }

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
