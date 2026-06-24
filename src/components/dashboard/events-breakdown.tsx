'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  UserPlus, Sparkles, StickyNote, Share2, MousePointerClick,
  Target, Activity, Eye,
} from 'lucide-react'
import type { EventStat } from '@/hooks/use-analytics'
import { formatFull } from '@/lib/format'
import { eventMeta } from '@/lib/format'
import { cn } from '@/lib/utils'

const ICONS: Record<string, React.ReactNode> = {
  'user-plus': <UserPlus className="h-4 w-4" />,
  sparkles: <Sparkles className="h-4 w-4" />,
  'sticky-note': <StickyNote className="h-4 w-4" />,
  'share-2': <Share2 className="h-4 w-4" />,
  'mouse-pointer': <MousePointerClick className="h-4 w-4" />,
  target: <Target className="h-4 w-4" />,
  activity: <Activity className="h-4 w-4" />,
  eye: <Eye className="h-4 w-4" />,
}

export function EventsBreakdown({ events }: { events: EventStat[] }) {
  const max = events[0]?.count || 1

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Activity className="h-4 w-4 text-primary" />
          الأحداث المخصصة
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="py-8 text-center">
            <Activity className="mx-auto h-10 w-10 opacity-30" />
            <p className="mt-2 text-sm text-muted-foreground">لا توجد أحداث مخصصة بعد</p>
            <p className="mt-1 text-xs text-muted-foreground">
              استخدم <code className="rounded bg-muted px-1.5 py-0.5 text-[10px]">sada.track('signup')</code> في موقعك
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-1 custom-scroll">
            <div className="space-y-3">
              {events.map((e) => {
                const meta = eventMeta(e.name)
                return (
                  <div key={e.name} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg bg-muted', meta.color)}>
                          {ICONS[meta.icon] || ICONS.activity}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                          <p className="text-[10px] text-muted-foreground" dir="ltr">{e.name}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-foreground">{formatFull(e.count)}</p>
                        <p className="text-[10px] text-muted-foreground">{formatFull(e.visitors)} زائر</p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(e.count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
