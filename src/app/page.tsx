'use client'

import { useState, useMemo } from 'react'
import {
  Users, Eye, MousePointerClick, UserPlus, Sparkles, StickyNote,
  Share2, Target, TrendingUp,
} from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { KpiCard, type KpiData } from '@/components/dashboard/kpi-card'
import { TimeSeriesChart } from '@/components/dashboard/timeseries-chart'
import { LiveFeed } from '@/components/dashboard/live-feed'
import { ActiveVisitors } from '@/components/dashboard/active-visitors'
import { TopPages, TopSources } from '@/components/dashboard/top-lists'
import { DevicesBreakdown } from '@/components/dashboard/devices-breakdown'
import { GeoList } from '@/components/dashboard/geo-list'
import { EventsBreakdown } from '@/components/dashboard/events-breakdown'
import { FunnelChart } from '@/components/dashboard/funnel-chart'
import { Campaigns } from '@/components/dashboard/campaigns'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { SetupGuide } from '@/components/dashboard/setup-guide'
import { LiveTopBar } from '@/components/dashboard/live-top-bar'
import { WorldMap } from '@/components/dashboard/world-map'
import { DashboardSkeleton } from '@/components/dashboard/skeletons'
import { useAnalytics, type Range } from '@/hooks/use-analytics'
import { useLiveSocket } from '@/hooks/use-live-socket'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function Home() {
  const [range, setRange] = useState<Range>('7d')
  const analytics = useAnalytics(range)
  const { connected: liveConnected } = useLiveSocket()
  const liveCount = analytics.realtime?.activeVisitors || 0

  const overview = analytics.overview

  // حساب sparklines من بيانات السلاسل الزمنية
  const sparklines = useMemo(() => {
    const ts = analytics.timeseries
    if (!ts || ts.length < 2) return {}
    return {
      visitors: ts.map((p) => p.visitors),
      pageViews: ts.map((p) => p.pageViews),
      sessions: ts.map((p) => p.sessions),
      signups: ts.map((p) => p.signups),
      generations: ts.map((p) => p.generations),
    }
  }, [analytics.timeseries])

  const kpis: KpiData[] = overview ? [
    {
      key: 'visitors', label: 'الزوار الفريدون', value: overview.visitors,
      change: overview.visitorsChange, icon: <Users className="h-5 w-5" />, accent: 'primary',
      sparkline: sparklines.visitors,
    },
    {
      key: 'pageViews', label: 'إجمالي المشاهدات', value: overview.pageViews,
      change: overview.pageViewsChange, icon: <Eye className="h-5 w-5" />, accent: 'gold',
      sparkline: sparklines.pageViews,
    },
    {
      key: 'sessions', label: 'الجلسات', value: overview.sessions,
      change: overview.sessionsChange, icon: <TrendingUp className="h-5 w-5" />, accent: 'blue',
      sparkline: sparklines.sessions,
    },
    {
      key: 'bounceRate', label: 'معدل الارتداد', value: overview.bounceRate,
      change: overview.bounceRateChange, format: 'percent', icon: <TrendingUp className="h-5 w-5" />, accent: 'pink',
    },
    {
      key: 'signups', label: 'التسجيلات', value: overview.signups,
      change: overview.signupsChange, icon: <UserPlus className="h-5 w-5" />, accent: 'emerald',
      sparkline: sparklines.signups,
    },
    {
      key: 'generations', label: 'عمليات التوليد', value: overview.generations,
      change: overview.generationsChange, icon: <Sparkles className="h-5 w-5" />, accent: 'gold',
      sparkline: sparklines.generations,
    },
    {
      key: 'notes', label: 'الملاحظات', value: overview.notes,
      change: overview.notesChange, icon: <StickyNote className="h-5 w-5" />, accent: 'blue',
    },
    {
      key: 'referrals', label: 'الإحالات', value: overview.referrals,
      change: overview.referralsChange, icon: <Share2 className="h-5 w-5" />, accent: 'purple',
    },
  ] : []

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader
        range={range}
        onRangeChange={setRange}
        onRefresh={analytics.refresh}
        lastUpdated={analytics.lastUpdated}
        liveCount={liveCount}
        liveConnected={liveConnected}
      />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-4 sm:px-6 sm:py-6">
        {/* Loading state */}
        {analytics.loading && !overview && <DashboardSkeleton />}

        {/* Error state */}
        {analytics.error && !overview && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-center gap-3 p-6">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">تعذّر تحميل البيانات</p>
                <p className="text-sm text-muted-foreground">{analytics.error}</p>
              </div>
              <Button variant="outline" size="sm" className="mr-auto" onClick={analytics.refresh}>
                إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        )}

        {overview && (
          <div className="space-y-4 sm:space-y-6">
            {/* شريط النشاط اللحظي */}
            <LiveTopBar realtime={analytics.realtime} />

            {/* بطاقات KPI */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4 xl:grid-cols-4">
              {kpis.map((kpi) => (
                <KpiCard key={kpi.key} data={kpi} />
              ))}
            </div>

            {/* الإحصائيات الإضافية */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
              <Card className="p-3 sm:p-4">
                <p className="text-[10px] text-muted-foreground sm:text-xs">معدل التحويل</p>
                <p className="mt-1 text-xl font-bold text-primary sm:text-2xl">
                  {(overview.conversions / Math.max(overview.sessions, 1) * 100).toFixed(1)}%
                </p>
                <p className="text-[10px] text-muted-foreground sm:text-[11px]">
                  {overview.conversions} تحويل
                </p>
              </Card>
              <Card className="p-3 sm:p-4">
                <p className="text-[10px] text-muted-foreground sm:text-xs">متوسط مدة الجلسة</p>
                <p className="mt-1 text-xl font-bold text-foreground sm:text-2xl" dir="ltr">
                  {formatDurationShort(overview.avgSessionDuration)}
                </p>
                <p className="text-[10px] text-muted-foreground sm:text-[11px]">دقائق:ثواني</p>
              </Card>
              <Card className="p-3 sm:p-4">
                <p className="text-[10px] text-muted-foreground sm:text-xs">زائر نشط الآن</p>
                <p className="mt-1 text-xl font-bold text-emerald-600 sm:text-2xl">
                  {liveCount}
                </p>
                <p className="text-[10px] text-muted-foreground sm:text-[11px]">
                  {liveConnected ? 'متصل لحظياً' : 'تحديث كل 4ث'}
                </p>
              </Card>
              <Card className="p-3 sm:p-4">
                <p className="text-[10px] text-muted-foreground sm:text-xs">آخر تحديث</p>
                <p className="mt-1 text-xl font-bold text-foreground sm:text-2xl" dir="ltr">
                  {analytics.lastUpdated
                    ? analytics.lastUpdated.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </p>
                <p className="text-[10px] text-muted-foreground sm:text-[11px]">يُحدّث تلقائياً</p>
              </Card>
            </div>

            {/* المخطط الزمني + البث المباشر */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
              <TimeSeriesChart data={analytics.timeseries} granularity="day" />
              <LiveFeed polledEvents={analytics.realtime?.recentEvents || []} />
            </div>

            {/* خريطة العالم + مسار التحويل */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
              <WorldMap
                countries={analytics.geo.countries}
                activeVisitors={liveCount}
              />
              <FunnelChart funnel={analytics.funnel.funnel} conversionRate={analytics.funnel.conversionRate} />
            </div>

            {/* الزوار النشطون + الأحداث المخصصة */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
              <ActiveVisitors sessions={analytics.realtime?.activeSessions || []} />
              <EventsBreakdown events={analytics.events} />
            </div>

            {/* الصفحات + المصادر + الأجهزة */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
              <TopPages pages={analytics.pages} />
              <TopSources sources={analytics.sources} />
              <DevicesBreakdown
                devices={analytics.devices.devices}
                browsers={analytics.devices.browsers}
                os={analytics.devices.os}
                brands={analytics.devices.brands}
              />
            </div>

            {/* الجغرافيا + الحملات */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
              <GeoList countries={analytics.geo.countries} cities={analytics.geo.cities} />
              <Campaigns
                campaigns={analytics.campaigns.campaigns}
                sources={analytics.campaigns.sources}
                mediums={analytics.campaigns.mediums}
                trackedVisitors={analytics.campaigns.trackedVisitors}
                totalVisitors={analytics.campaigns.totalVisitors}
              />
            </div>

            {/* آخر النشاطات */}
            <RecentActivity items={analytics.recent.items} />

            {/* الإعداد */}
            <SetupGuide scriptUrl="/track.js" />

            {/* التذييل */}
            <footer className="border-t border-border pt-6 pb-4 text-center">
              <p className="text-xs text-muted-foreground">
                لوحة تحليلات <span className="font-semibold text-primary">صدى العقار</span> ·
                تتبّع لحظي كامل لكل زيارة وتسجيل وتوليد وإحالة
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                البيانات تُخزَّن في قاعدة بياناتك الخاصة على Vercel Postgres — لا تُشارَك مع أي طرف خارجي
              </p>
            </footer>
          </div>
        )}
      </main>
    </div>
  )
}

function formatDurationShort(seconds: number): string {
  if (!seconds || seconds < 1) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
