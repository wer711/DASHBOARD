'use client'

import { useState, useEffect, useRef } from 'react'
import { RefreshCw, Calendar, Moon, Sun, ChevronDown } from 'lucide-react'
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
import { cn } from '@/lib/utils'

const RANGE_LABELS: Record<Range, string> = {
  today: 'اليوم',
  '7d': 'آخر 7 أيام',
  '30d': 'آخر 30 يوم',
  all: 'كل الوقت',
}

interface TopBarProps {
  range: Range
  onRangeChange: (r: Range) => void
  onRefresh: () => void
  lastUpdated: Date | null
}

export function TopBar({ range, onRangeChange, onRefresh, lastUpdated }: TopBarProps) {
  const { theme, setTheme } = useTheme()
  const [refreshing, setRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true)
    }
  }, [])

  const handleRefresh = () => {
    if (refreshing) return
    setRefreshing(true)
    onRefresh()
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-14 items-center justify-between gap-2 px-4 pr-14 sm:px-6 sm:pr-6">
        {/* عنوان القسم الحالي + آخر تحديث */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <p className="text-xs text-muted-foreground">
              آخر تحديث: {lastUpdated ? lastUpdated.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
            </p>
          </div>
        </div>

        {/* الأدوات */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* محدد الفترة — أكثر وضوحاً */}
          <div className="relative">
            <Select value={range} onValueChange={(v) => onRangeChange(v as Range)}>
              <SelectTrigger className="h-9 w-[130px] sm:w-[150px] gap-1.5" size="sm">
                <Calendar className="h-4 w-4 text-primary" />
                <SelectValue />
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </SelectTrigger>
              <SelectContent align="end">
                {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
                  <SelectItem key={r} value={r} className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 opacity-50" />
                      {RANGE_LABELS[r]}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* زر التحديث — يدور فعلياً */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={handleRefresh}
            disabled={refreshing}
            title="تحديث البيانات"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </Button>

          {/* زر الوضع الليلي */}
          {mounted && (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="تبديل الوضع"
            >
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="hidden h-4 w-4 dark:block" />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
