'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Eye, UserPlus, Sparkles, StickyNote, Share2, MousePointerClick,
  Activity, Route, Clock, Globe, Smartphone, Monitor, Tablet,
} from 'lucide-react'
import { countryFlag, deviceLabel, browserLabel, osLabel, timeAgo, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

const ICONS: Record<string, React.ReactNode> = {
  eye: <Eye className="h-3.5 w-3.5" />,
  'user-plus': <UserPlus className="h-3.5 w-3.5" />,
  sparkles: <Sparkles className="h-3.5 w-3.5" />,
  'sticky-note': <StickyNote className="h-3.5 w-3.5" />,
  'share-2': <Share2 className="h-3.5 w-3.5" />,
  'mouse-pointer': <MousePointerClick className="h-3.5 w-3.5" />,
  activity: <Activity className="h-3.5 w-3.5" />,
}

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  desktop: <Monitor className="h-3 w-3" />,
  mobile: <Smartphone className="h-3 w-3" />,
  tablet: <Tablet className="h-3 w-3" />,
}

interface JourneyItem {
  id: string
  kind: 'pageview' | 'event'
  sessionId: string
  name?: string
  label?: string
  category?: string
  path?: string
  title?: string
  createdAt: string
}

interface SessionInfo {
  id: string
  startedAt: string
  lastActiveAt: string
  duration: number
  pageViews: number
  isBounce: boolean
  country: string | null
  countryCode: string | null
  city: string | null
  device: string | null
  browser: string | null
  os: string | null
  referrerDomain: string | null
  utmSource: string | null
  utmCampaign: string | null
  isActive: boolean
}

interface JourneyData {
  visitorId: string
  summary: {
    totalSessions: number
    totalPageViews: number
    totalEvents: number
    totalDuration: number
    firstVisit: string | null
    lastVisit: string | null
    countries: string[]
    devices: string[]
    browsers: string[]
  }
  sessions: SessionInfo[]
  journey: JourneyItem[]
}

const EVENT_META: Record<string, { label: string; color: string }> = {
  signup: { label: 'تسجيل', color: 'text-emerald-600' },
  generate: { label: 'توليد', color: 'text-amber-600' },
  note: { label: 'ملاحظة', color: 'text-blue-600' },
  referral: { label: 'إحالة', color: 'text-purple-600' },
  click: { label: 'نقرة', color: 'text-gray-600' },
  conversion: { label: 'تحويل', color: 'text-pink-600' },
}

export function VisitorJourney({ visitorId, trigger }: { visitorId: string; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<JourneyData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !visitorId) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/stats/visitor-journey?visitorId=${encodeURIComponent(visitorId)}&limit=100`)
        const d = await res.json()
        if (!cancelled) {
          setData(d)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setData(null)
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [open, visitorId])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button onClick={() => setOpen(true)} className="w-full text-right">
          {trigger}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden p-0">
        <DialogHeader className="border-b border-border p-4 pb-3">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Route className="h-4 w-4 text-primary" />
            مسار الزائر
            <span className="font-mono text-xs text-muted-foreground" dir="ltr">
              {visitorId.slice(0, 20)}...
            </span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex h-[400px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : data ? (
          <div className="flex flex-col h-[70vh]">
            {/* ملخص */}
            <div className="grid grid-cols-2 gap-2 border-b border-border p-4 sm:grid-cols-4">
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-[10px] text-muted-foreground">الجلسات</p>
                <p className="text-lg font-bold text-foreground">{data.summary.totalSessions}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-[10px] text-muted-foreground">المشاهدات</p>
                <p className="text-lg font-bold text-foreground">{data.summary.totalPageViews}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-[10px] text-muted-foreground">الأحداث</p>
                <p className="text-lg font-bold text-foreground">{data.summary.totalEvents}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-[10px] text-muted-foreground">إجمالي المدة</p>
                <p className="text-lg font-bold text-foreground">
                  {Math.floor(data.summary.totalDuration / 60)}د
                </p>
              </div>
            </div>

            {/* الخط الزمني */}
            <ScrollArea className="flex-1 p-4">
              <div className="relative space-y-3" dir="rtl">
                {/* خط زمني عمودي */}
                <div className="absolute right-[15px] top-2 bottom-2 w-0.5 bg-border" />

                {data.journey.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    لا توجد بيانات كافية لهذا الزائر
                  </p>
                ) : (
                  data.journey.map((item, idx) => {
                    const isPageview = item.kind === 'pageview'
                    const meta = !isPageview ? EVENT_META[item.name || ''] : null
                    return (
                      <div key={`${item.id}-${idx}`} className="relative flex gap-3">
                        {/* النقطة */}
                        <div className={cn(
                          'z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-background',
                          isPageview ? 'bg-primary' : 'bg-amber-500'
                        )}>
                          {isPageview ? (
                            <Eye className="h-3 w-3 text-white" />
                          ) : (
                            <Activity className="h-3 w-3 text-white" />
                          )}
                        </div>

                        {/* المحتوى */}
                        <div className="min-w-0 flex-1 rounded-lg border border-border/50 bg-card px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium text-foreground">
                              {isPageview ? (
                                item.title || item.path || '/'
                              ) : (
                                <span className={meta?.color}>
                                  {meta?.label || item.name}
                                  {item.label ? ` — ${item.label}` : ''}
                                </span>
                              )}
                            </p>
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              {timeAgo(item.createdAt)}
                            </span>
                          </div>
                          {item.path && (
                            <p className="mt-0.5 truncate text-[11px] text-muted-foreground" dir="ltr">
                              {item.path}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            تعذّر تحميل البيانات
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
