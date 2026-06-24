'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Megaphone } from 'lucide-react'
import type { CampaignStat } from '@/hooks/use-analytics'
import { formatFull, formatPercent } from '@/lib/format'

type TabKey = 'campaigns' | 'sources' | 'mediums'

const TAB_LABELS: Record<TabKey, string> = {
  campaigns: 'الحملات',
  sources: 'المصادر',
  mediums: 'الوسائط',
}

export function Campaigns({
  campaigns, sources, mediums, trackedVisitors, totalVisitors,
}: {
  campaigns: CampaignStat[]
  sources: CampaignStat[]
  mediums: CampaignStat[]
  trackedVisitors: number
  totalVisitors: number
}) {
  const [tab, setTab] = useState<TabKey>('campaigns')
  const dataMap: Record<TabKey, CampaignStat[]> = { campaigns, sources, mediums }
  const data = dataMap[tab]
  const max = data[0]?.sessions || 1

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Megaphone className="h-4 w-4 text-amber-600" />
          الحملات الترويجية (UTM)
        </CardTitle>
        <div className="text-left">
          <p className="text-[10px] text-muted-foreground">زوار بمصدر مُتتبَّع</p>
          <p className="text-sm font-bold text-amber-600">
            {formatFull(trackedVisitors)} / {formatFull(totalVisitors)}
            <span className="mr-1 text-[10px] font-normal text-muted-foreground">
              ({formatPercent(totalVisitors > 0 ? (trackedVisitors / totalVisitors) * 100 : 0, 0)})
            </span>
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="mb-3">
          <TabsList>
            {(Object.keys(TAB_LABELS) as TabKey[]).map((k) => (
              <TabsTrigger key={k} value={k} className="text-xs">
                {TAB_LABELS[k]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {data.length === 0 ? (
          <div className="py-8 text-center">
            <Megaphone className="mx-auto h-10 w-10 opacity-30" />
            <p className="mt-2 text-sm text-muted-foreground">لا توجد حملات مُتتبَّعة بعد</p>
            <p className="mt-1 text-xs text-muted-foreground">
              استخدم روابط UTM لتتبع حملاتك الترويجية
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[260px] pr-1 custom-scroll">
            <div className="space-y-2.5">
              {data.map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground" dir="ltr">{c.name}</p>
                    <div className="shrink-0 text-left">
                      <span className="text-xs text-muted-foreground">{formatFull(c.visitors)} زائر</span>
                      <span className="mr-2 text-sm font-bold text-foreground">{formatFull(c.sessions)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all"
                      style={{ width: `${(c.sessions / max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
