'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, Clock } from 'lucide-react'
import type { ActiveSession } from '@/hooks/use-analytics'
import { countryFlag, deviceLabel, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'

export function ActiveVisitors({ sessions }: { sessions: ActiveSession[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Users className="h-4 w-4 text-primary" />
          الزوار النشطون الآن
        </CardTitle>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
          <span className="live-dot flex h-2 w-2 rounded-full bg-emerald-500" />
          {sessions.length} متصل
        </span>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Users className="h-10 w-10 opacity-30" />
            <p className="text-sm">لا يوجد زوار نشطون حالياً</p>
            <p className="text-xs">سيظهرون هنا فور دخولهم الموقع</p>
          </div>
        ) : (
          <ScrollArea className="h-[340px] pr-2 custom-scroll">
            <div className="space-y-2">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="animate-slide-up flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-3 py-2"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg">
                    {countryFlag(s.countryCode)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {s.city || s.country || 'زائر'}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{deviceLabel(s.device)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {timeAgo(s.lastActiveAt)}
                      </span>
                      {s.pageViews > 0 && (
                        <>
                          <span>·</span>
                          <span>{s.pageViews} صفحة</span>
                        </>
                      )}
                    </div>
                  </div>
                  {s.utmSource && (
                    <span className="shrink-0 rounded-md bg-amber-100 dark:bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                      {s.utmSource}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
