'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Eye, UserPlus, Sparkles, StickyNote, Share2, MousePointerClick,
  Activity, Wifi, WifiOff, Clock,
} from 'lucide-react'
import { useLiveSocket, type LiveEvent } from '@/hooks/use-live-socket'
import { timeAgo, countryFlag, deviceLabel, eventMeta } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { RecentItem } from '@/hooks/use-analytics'

const ICONS: Record<string, React.ReactNode> = {
  eye: <Eye className="h-3.5 w-3.5" />,
  'user-plus': <UserPlus className="h-3.5 w-3.5" />,
  sparkles: <Sparkles className="h-3.5 w-3.5" />,
  'sticky-note': <StickyNote className="h-3.5 w-3.5" />,
  'share-2': <Share2 className="h-3.5 w-3.5" />,
  'mouse-pointer': <MousePointerClick className="h-3.5 w-3.5" />,
  activity: <Activity className="h-3.5 w-3.5" />,
}

// تحويل RecentItem (من polling) إلى LiveEvent
function recentItemToLiveEvent(item: RecentItem): LiveEvent {
  return {
    type: item.kind,
    name: item.name || undefined,
    label: item.label,
    category: item.category,
    path: item.path || undefined,
    title: item.title,
    country: item.country,
    countryCode: item.countryCode,
    city: item.city,
    device: item.device,
    browser: item.browser,
    referrerDomain: item.referrerDomain,
    utmSource: item.utmSource,
    utmCampaign: item.utmCampaign,
    timestamp: item.createdAt,
  }
}

function LiveEventRow({ event }: { event: LiveEvent }) {
  const meta = event.type === 'pageview'
    ? eventMeta('pageview')
    : eventMeta(event.name || 'activity')

  return (
    <div className="animate-slide-up flex items-start gap-3 rounded-lg border border-border/50 bg-card/50 px-3 py-2">
      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted', meta.color)}>
        {ICONS[meta.icon] || ICONS.activity}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-semibold text-foreground">
            {event.type === 'pageview' ? (
              <>مشاهدة: <span className="text-primary">{event.path || event.title || '/'}</span></>
            ) : (
              <>{meta.label}{event.label ? ` — ${event.label}` : ''}</>
            )}
          </p>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {timeAgo(event.timestamp)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          {event.countryCode && (
            <span className="flex items-center gap-1">
              <span>{countryFlag(event.countryCode)}</span>
              <span>{event.city || event.country}</span>
            </span>
          )}
          {event.device && (
            <>
              <span>·</span>
              <span>{deviceLabel(event.device)}</span>
            </>
          )}
          {event.utmSource && (
            <>
              <span>·</span>
              <span className="text-primary">via {event.utmSource}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface LiveFeedProps {
  // الأحداث المُستطلعة من API (fallback عند عدم وجود WebSocket)
  polledEvents?: RecentItem[]
}

export function LiveFeed({ polledEvents = [] }: LiveFeedProps) {
  const { connected, recentEvents } = useLiveSocket()

  // دمج الأحداث: WebSocket أولاً (إن متصل)، وإلا استخدم polledEvents
  const displayEvents: LiveEvent[] = connected && recentEvents.length > 0
    ? recentEvents
    : polledEvents.map(recentItemToLiveEvent)

  const isPolling = !connected

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <span className={cn('flex h-2 w-2 rounded-full', connected ? 'bg-emerald-500 live-dot' : 'bg-amber-500')} />
          البث المباشر
        </CardTitle>
        <span className={cn(
          'flex items-center gap-1 text-xs',
          connected ? 'text-emerald-600' : 'text-amber-600'
        )}>
          {connected ? <Wifi className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
          {connected ? 'متصل لحظياً' : 'تحديث كل 10ث'}
        </span>
      </CardHeader>
      <CardContent>
        {displayEvents.length === 0 ? (
          <div className="flex h-[320px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Activity className="h-10 w-10 opacity-30" />
            <p className="text-sm">بانتظار وصول أحداث...</p>
            <p className="text-xs">ستظهر هنا فور دخول أي زائر لموقعك</p>
          </div>
        ) : (
          <ScrollArea className="h-[380px] pr-2 custom-scroll">
            <div className="space-y-2">
              {displayEvents.map((event, i) => (
                <LiveEventRow key={`${event.timestamp}-${i}-${event.sessionId || i}`} event={event} />
              ))}
            </div>
            {isPolling && displayEvents.length > 0 && (
              <p className="mt-3 text-center text-[10px] text-muted-foreground">
                يُحدّث كل 10 ثوانٍ · لتغييرات لحظية فورية، فعّل خدمة WebSocket
              </p>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
