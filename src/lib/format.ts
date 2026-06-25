/**
 * أدوات مساعدة لتنسيق الأرقام والتواريخ بالعربية
 */

export function formatNumber(n: number): string {
  if (n == null || isNaN(n)) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return new Intl.NumberFormat('ar-EG').format(n)
}

export function formatFull(n: number): string {
  return new Intl.NumberFormat('ar-EG').format(n || 0)
}

export function formatPercent(n: number, digits = 1): string {
  return `${(n || 0).toFixed(digits)}%`
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 1) return '0ث'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  if (m === 0) return `${s}ث`
  return `${m}د ${s}ث`
}

export function formatDurationShort(seconds: number): string {
  if (!seconds || seconds < 1) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 5) return 'الآن'
  if (sec < 60) return `قبل ${sec} ثانية`
  const min = Math.floor(sec / 60)
  if (min < 60) return `قبل ${min} دقيقة`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `قبل ${hr} ساعة`
  const day = Math.floor(hr / 24)
  return `قبل ${day} يوم`
}

export function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// أسماء الدول بالعربية + رمز العلم (emoji)
const COUNTRY_FLAGS: Record<string, string> = {
  SA: '🇸🇦', AE: '🇦🇪', EG: '🇪🇬', KW: '🇰🇼', QA: '🇶🇦', MA: '🇲🇦',
  JO: '🇯🇴', BH: '🇧🇭', OM: '🇴🇲', DZ: '🇩🇿', US: '🇺🇸', GB: '🇬🇧',
  FR: '🇫🇷', DE: '🇩🇪', TR: '🇹🇷', IN: '🇮🇳', PK: '🇵🇰', ID: '🇮🇩',
  MY: '🇲🇾', IQ: '🇮🇶', YE: '🇾🇪', SY: '🇸🇾', LB: '🇱🇧', PS: '🇵🇸',
  SD: '🇸🇩', LY: '🇱🇾', TN: '🇹🇳', MR: '🇲🇷', DJ: '🇩🇯', SO: '🇸🇴',
  KM: '🇰🇲', TD: '🇹🇩',
}

export function countryFlag(code: string | null | undefined): string {
  if (!code) return '🌍'
  return COUNTRY_FLAGS[code.toUpperCase()] || '🌍'
}

export function countryNameAr(name: string | null | undefined, code?: string | null): string {
  if (!name) return 'غير معروف'
  return name
}

// ترجمة أسماء الأجهزة/المتصفحات للعربية
const DEVICE_LABELS: Record<string, string> = {
  desktop: 'حاسوب',
  mobile: 'جوال',
  tablet: 'لوحي',
  Unknown: 'غير معروف',
}
const OS_LABELS: Record<string, string> = {
  Windows: 'ويندوز',
  macOS: 'ماك',
  iOS: 'iOS',
  Android: 'أندرويد',
  Linux: 'لينكس',
  ChromeOS: 'كروم',
  Unknown: 'غير معروف',
}
const BROWSER_LABELS: Record<string, string> = {
  Chrome: 'كروم',
  Safari: 'سفاري',
  Edge: 'إيدج',
  Firefox: 'فيرفوكس',
  Opera: 'أوبرا',
  Unknown: 'غير معروف',
}

export function deviceLabel(d: string | null | undefined): string {
  if (!d) return 'غير معروف'
  return DEVICE_LABELS[d] || d
}
export function osLabel(o: string | null | undefined): string {
  if (!o) return 'غير معروف'
  return OS_LABELS[o] || o
}
export function browserLabel(b: string | null | undefined): string {
  if (!b) return 'غير معروف'
  return BROWSER_LABELS[b] || b
}

// أيقونة الحدث
const EVENT_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  signup: { label: 'تسجيل جديد', icon: 'user-plus', color: 'text-emerald-600' },
  generate: { label: 'توليد محتوى', icon: 'sparkles', color: 'text-amber-600' },
  note: { label: 'حفظ ملاحظة', icon: 'sticky-note', color: 'text-blue-600' },
  referral: { label: 'إحالة', icon: 'share-2', color: 'text-purple-600' },
  conversion: { label: 'تحويل', icon: 'target', color: 'text-pink-600' },
  click: { label: 'نقرة', icon: 'mouse-pointer', color: 'text-gray-600' },
  pageview: { label: 'مشاهدة صفحة', icon: 'eye', color: 'text-teal-600' },
}

export function eventMeta(name: string): { label: string; icon: string; color: string } {
  return EVENT_LABELS[name] || { label: name, icon: 'activity', color: 'text-gray-600' }
}
