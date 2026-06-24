'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Smartphone, Globe, Monitor, Layers } from 'lucide-react'
import type { DeviceStat } from '@/hooks/use-analytics'
import { formatFull, deviceLabel, osLabel, browserLabel } from '@/lib/format'
import { cn } from '@/lib/utils'

type TabKey = 'devices' | 'browsers' | 'os' | 'brands'

const TABS: { key: TabKey; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'devices', label: 'الأجهزة', icon: <Smartphone className="h-3.5 w-3.5" />, color: 'bg-primary' },
  { key: 'browsers', label: 'المتصفحات', icon: <Globe className="h-3.5 w-3.5" />, color: 'bg-amber-500' },
  { key: 'os', label: 'الأنظمة', icon: <Monitor className="h-3.5 w-3.5" />, color: 'bg-blue-500' },
  { key: 'brands', label: 'الماركات', icon: <Layers className="h-3.5 w-3.5" />, color: 'bg-purple-500' },
]

export function DevicesBreakdown({
  devices, browsers, os, brands,
}: {
  devices: DeviceStat[]
  browsers: DeviceStat[]
  os: DeviceStat[]
  brands: DeviceStat[]
}) {
  const [tab, setTab] = useState<TabKey>('devices')

  const dataMap: Record<TabKey, DeviceStat[]> = { devices, browsers, os, brands }
  const labelMap: Record<TabKey, (s: string) => string> = {
    devices: deviceLabel,
    browsers: browserLabel,
    os: osLabel,
    brands: (s) => s || 'غير معروف',
  }

  const data = dataMap[tab]
  const total = data.reduce((sum, d) => sum + d.sessions, 0) || 1
  const labelFn = labelMap[tab]
  const activeTab = TABS.find((t) => t.key === tab)!

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">توزيع الأجهزة</CardTitle>
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="mt-2">
          <TabsList className="grid grid-cols-4 h-auto">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.key}
                value={t.key}
                className="flex flex-col items-center gap-1 py-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">لا توجد بيانات</p>
        ) : (
          <div className="space-y-3">
            {data.map((d) => {
              const pct = (d.sessions / total) * 100
              return (
                <div key={d.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{labelFn(d.name)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{formatFull(d.visitors)} زائر</span>
                      <span className="font-bold text-foreground">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full transition-all', activeTab.color)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
