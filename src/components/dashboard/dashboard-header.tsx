'use client'

import { Activity, RefreshCw, Calendar, ExternalLink, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTheme } from 'next-themes'
import type { Range } from '@/hooks/use-analytics'

const RANGE_LABELS: Record<Range, string> = {
  today: 'اليوم',
  '7d': 'آخر 7 أيام',
  '30d': 'آخر 30 يوم',
  all: 'كل الوقت',
}

export function DashboardHeader({
  range,
  onRangeChange,
  onRefresh,
  lastUpdated,
  liveCount,
  liveConnected,
}: {
  range: Range
  onRangeChange: (r: Range) => void
  onRefresh: () => void
  lastUpdated: Date | null
  liveCount: number
  liveConnected: boolean
}) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        {/* الشعار */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <svg viewBox="0 0 40 40" fill="none" className="h-6 w-6">
              <rect x="8" y="12" width="24" height="22" rx="2" fill="currentColor" />
              <rect x="12" y="16" width="4" height="4" rx="0.5" fill="var(--background)" />
              <rect x="18" y="16" width="4" height="4" rx="0.5" fill="var(--background)" />
              <rect x="24" y="16" width="4" height="4" rx="0.5" fill="var(--background)" />
              <rect x="12" y="23" width="4" height="4" rx="0.5" fill="var(--background)" />
              <rect x="24" y="23" width="4" height="4" rx="0.5" fill="var(--background)" />
              <rect x="17" y="27" width="6" height="7" rx="1" fill="#D4A853" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold leading-tight text-foreground">
              صدى العقار
            </h1>
            <p className="text-xs text-muted-foreground leading-tight">لوحة التحليلات اللحظية</p>
          </div>
        </div>

        {/* المؤشر المباشر */}
        <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5">
          <span className={`relative flex h-2.5 w-2.5 ${liveConnected ? 'live-dot' : ''}`}>
            <span className={`absolute inline-flex h-full w-full rounded-full ${liveConnected ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          </span>
          <span className="text-xs font-semibold text-foreground">
            {liveCount} زائر نشط
          </span>
        </div>

        {/* الأدوات */}
        <div className="flex items-center gap-2">
          {/* محدد الفترة */}
          <div className="relative">
            <Select value={range} onValueChange={(v) => onRangeChange(v as Range)}>
              <SelectTrigger className="h-9 w-[130px] sm:w-[150px]" size="sm">
                <Calendar className="ml-2 h-4 w-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    {RANGE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* زر التحديث */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={onRefresh}
            title={`آخر تحديث: ${lastUpdated ? lastUpdated.toLocaleTimeString('ar-EG') : '—'}`}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* زر الوضع الليلي */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="تبديل الوضع"
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:block" />
          </Button>

          {/* رابط الموقع */}
          <a
            href="https://sada-elaqar.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex"
          >
            <Button variant="outline" size="sm" className="h-9">
              <ExternalLink className="ml-2 h-4 w-4" />
              زيارة الموقع
            </Button>
          </a>
        </div>
      </div>
    </header>
  )
}
