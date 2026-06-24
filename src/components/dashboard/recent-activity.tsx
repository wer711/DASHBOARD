'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Eye, UserPlus, Sparkles, StickyNote, Share2, MousePointerClick, Activity,
} from 'lucide-react'
import type { RecentItem } from '@/hooks/use-analytics'
import { formatDateTime, countryFlag, deviceLabel, eventMeta, timeAgo } from '@/lib/format'
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

export function RecentActivity({ items }: { items: RecentItem[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Activity className="h-4 w-4 text-primary" />
          آخر النشاطات
          <span className="text-xs font-normal text-muted-foreground">({items.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">لا توجد نشاطات بعد</p>
        ) : (
          <ScrollArea className="h-[400px] pr-1 custom-scroll">
            <div className="space-y-1">
              {items.map((item) => {
                const meta = item.kind === 'pageview'
                  ? eventMeta('pageview')
                  : eventMeta(item.name || 'activity')
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-muted/40"
                  >
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted', meta.color)}>
                      {ICONS[meta.icon] || ICONS.activity}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.kind === 'pageview' ? (
                          <>{item.title || item.path}</>
                        ) : (
                          <>{meta.label}{item.label ? ` — ${item.label}` : ''}</>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        {item.countryCode && (
                          <span className="flex items-center gap-1">
                            <span>{countryFlag(item.countryCode)}</span>
                            <span>{item.city || item.country}</span>
                          </span>
                        )}
                        {item.device && (
                          <>
                            <span>·</span>
                            <span>{deviceLabel(item.device)}</span>
                          </>
                        )}
                        {item.utmSource && (
                          <>
                            <span>·</span>
                            <span className="text-primary">{item.utmSource}</span>
                          </>
                        )}
                        {item.path && item.kind === 'event' && (
                          <>
                            <span>·</span>
                            <span className="truncate" dir="ltr">{item.path}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span
                      className="shrink-0 text-[11px] text-muted-foreground"
                      title={formatDateTime(item.createdAt)}
                    >
                      {timeAgo(item.createdAt)}
                    </span>
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
