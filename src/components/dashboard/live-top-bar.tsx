'use client'

import { useEffect, useState } from 'react'
import { Activity, Globe, Clock, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { countryFlag, deviceLabel, timeAgo } from '@/lib/format'

interface LiveBarData {
  activeVisitors: number
  lastEvent: {
    kind: 'pageview' | 'event'
    name?: string | null
    path?: string | null
    title?: string | null
    country?: string | null
    countryCode?: string | null
    city?: string | null
    device?: string | null
    createdAt: string
  } | null
  eventsPerMinute: number
}

/**
 * شريط النشاط اللحظي العلوي
 * يعرض: عدد الزوار النشطين الآن + آخر حدث + معدل الأحداث/دقيقة
 * يُحدَّث كل 4 ثوانٍ
 */
export function LiveTopBar({ realtime }: { realtime: any }) {
  const [pulse, setPulse] = useState(false)
  const [lastEventTime, setLastEventTime] = useState<string | null>(null)

  const activeVisitors = realtime?.activeVisitors || 0
  const recentEvents = realtime?.recentEvents || []
  const lastEvent = recentEvents[0] || null

  // نبض عند وصول حدث جديد
  useEffect(() => {
    if (lastEvent && lastEvent.createdAt !== lastEventTime) {
      setPulse(true)
      setLastEventTime(lastEvent.createdAt)
      const t = setTimeout(() => setPulse(false), 1000)
      return () => clearTimeout(t)
    }
  }, [lastEvent, lastEventTime])

  // حساب معدل الأحداث/دقيقة (آخر 60 ثانية)
  const now = Date.now()
  const eventsLastMinute = recentEvents.filter(
    (e: any) => new Date(e.createdAt).getTime() > now - 60 * 1000
  ).length

  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl border border-border bg-gradient-to-l from-primary/5 via-card to-card transition-all',
      pulse && 'ring-2 ring-primary/30'
    )}>
      {/* خط النبض العلوي */}
      <div className={cn(
        'absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-l from-transparent via-primary to-transparent transition-opacity',
        pulse ? 'opacity-100' : 'opacity-30'
      )} />

      <div className="flex flex-wrap items-center gap-3 p-3 sm:gap-4 sm:p-4">
        {/* عدد الزوار النشطين */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-2.5 w-2.5">
            <span className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75',
              activeVisitors > 0 ? 'bg-emerald-500 live-dot' : 'bg-gray-400'
            )} />
            <span className={cn(
              'relative inline-flex h-2.5 w-2.5 rounded-full',
              activeVisitors > 0 ? 'bg-emerald-500' : 'bg-gray-400'
            )} />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase text-muted-foreground">نشط الآن</p>
            <p className="text-lg font-bold leading-none text-foreground sm:text-xl">
              {activeVisitors}
              <span className="mr-1 text-xs font-normal text-muted-foreground">زائر</span>
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-border" />

        {/* معدل الأحداث/دقيقة */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/15">
            <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase text-muted-foreground">آخر دقيقة</p>
            <p className="text-lg font-bold leading-none text-foreground sm:text-xl">
              {eventsLastMinute}
              <span className="mr-1 text-xs font-normal text-muted-foreground">حدث</span>
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-border hidden sm:block" />

        {/* آخر حدث */}
        <div className={cn(
          'min-w-0 flex-1 transition-all',
          pulse ? 'bg-primary/5 -mx-2 -my-1 p-1 rounded-lg' : ''
        )}>
          <p className="mb-0.5 flex items-center gap-1 text-[10px] font-medium uppercase text-muted-foreground">
            <Activity className="h-3 w-3" />
            آخر نشاط
          </p>
          {lastEvent ? (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="text-base">
                {lastEvent.countryCode ? (
                  countryFlag(lastEvent.countryCode)
                ) : (
                  <Globe className="inline h-3.5 w-3.5 text-muted-foreground" />
                )}
              </span>
              <span className="truncate font-medium text-foreground">
                {lastEvent.kind === 'pageview' ? (
                  lastEvent.title || lastEvent.path || '/'
                ) : (
                  lastEvent.name || 'حدث'
                )}
              </span>
              <span className="hidden shrink-0 text-muted-foreground sm:inline">
                {lastEvent.city && `${lastEvent.city} · `}
                {lastEvent.device && deviceLabel(lastEvent.device)}
              </span>
              <span className="mr-auto shrink-0 text-[10px] text-muted-foreground">
                {timeAgo(lastEvent.createdAt)}
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">بانتظار وصول زوار...</p>
          )}
        </div>
      </div>
    </div>
  )
}
