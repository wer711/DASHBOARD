'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

export type Range = 'today' | '7d' | '30d' | 'all'

interface Overview {
  range: string
  visitors: number
  visitorsChange: number
  pageViews: number
  pageViewsChange: number
  sessions: number
  sessionsChange: number
  bounceRate: number
  bounceRateChange: number
  avgSessionDuration: number
  signups: number
  signupsChange: number
  generations: number
  generationsChange: number
  notes: number
  notesChange: number
  referrals: number
  referralsChange: number
  conversions: number
  conversionsChange: number
}

interface TimeSeriesPoint {
  label: string
  timestamp: string
  visitors: number
  pageViews: number
  sessions: number
  signups: number
  generations: number
}

interface PageStat { path: string; title: string | null; views: number; visitors: number; sessions: number }
interface SourceStat { source: string; visitors: number; sessions: number }
interface GeoStat { name?: string; code?: string; city?: string; country?: string; visitors: number; sessions: number }
interface DeviceStat { name: string; visitors: number; sessions: number }
interface EventStat { name: string; category: string | null; count: number; visitors: number }
interface FunnelStep { step: string; icon: string; count: number; rate: number }
interface CampaignStat { name: string; visitors: number; sessions: number }
interface RecentItem {
  id: string
  kind: 'pageview' | 'event'
  name?: string | null
  label?: string | null
  category?: string | null
  path?: string | null
  title?: string | null
  createdAt: string
  country: string | null
  countryCode: string | null
  city: string | null
  device: string | null
  browser: string | null
  os: string | null
  referrerDomain: string | null
  utmSource: string | null
  utmCampaign: string | null
  visitorId: string | null
}
interface ActiveSession {
  id: string
  visitorId: string
  country: string | null
  countryCode: string | null
  city: string | null
  device: string | null
  browser: string | null
  os: string | null
  referrerDomain: string | null
  utmSource: string | null
  utmCampaign: string | null
  startedAt: string
  lastActiveAt: string
  pageViews: number
}

interface RealtimeData {
  activeVisitors: number
  activeSessions: ActiveSession[]
  recentEvents: RecentItem[]
}

export interface AnalyticsData {
  overview: Overview | null
  timeseries: TimeSeriesPoint[]
  pages: PageStat[]
  sources: SourceStat[]
  geo: { countries: GeoStat[]; cities: GeoStat[] }
  devices: { devices: DeviceStat[]; browsers: DeviceStat[]; os: DeviceStat[]; brands: DeviceStat[] }
  events: EventStat[]
  funnel: { funnel: FunnelStep[]; conversionRate: number }
  campaigns: { campaigns: CampaignStat[]; sources: CampaignStat[]; mediums: CampaignStat[]; trackedVisitors: number; totalVisitors: number }
  recent: { items: RecentItem[] }
  realtime: RealtimeData | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  refresh: () => void
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

export function useAnalytics(range: Range): AnalyticsData {
  const [data, setData] = useState<AnalyticsData>({
    overview: null,
    timeseries: [],
    pages: [],
    sources: [],
    geo: { countries: [], cities: [] },
    devices: { devices: [], browsers: [], os: [], brands: [] },
    events: [],
    funnel: { funnel: [], conversionRate: 0 },
    campaigns: { campaigns: [], sources: [], mediums: [], trackedVisitors: 0, totalVisitors: 0 },
    recent: { items: [] },
    realtime: null,
    loading: true,
    error: null,
    lastUpdated: null,
    refresh: () => {},
  })
  const [refreshKey, setRefreshKey] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  // جلب البيانات الرئيسية + التحديث كل 30 ثانية
  useEffect(() => {
    let cancelled = false
    const rangeQ = `range=${range}`

    const loadAll = async () => {
      try {
        const [overview, timeseries, pages, sources, geo, devices, events, funnel, campaigns, recent] = await Promise.all([
          fetchJson(`/api/stats/overview?${rangeQ}`),
          fetchJson(`/api/stats/timeseries?${rangeQ}`),
          fetchJson(`/api/stats/pages?${rangeQ}`),
          fetchJson(`/api/stats/sources?${rangeQ}`),
          fetchJson(`/api/stats/geo?${rangeQ}`),
          fetchJson(`/api/stats/devices?${rangeQ}`),
          fetchJson(`/api/stats/events?${rangeQ}`),
          fetchJson(`/api/stats/funnel?${rangeQ}`),
          fetchJson(`/api/stats/campaigns?${rangeQ}`),
          fetchJson(`/api/stats/recent?limit=30`),
        ])
        if (cancelled) return
        setData((prev) => ({
          ...prev,
          overview,
          timeseries: timeseries.points || [],
          pages: pages.pages || [],
          sources: sources.sources || [],
          geo: { countries: geo.countries || [], cities: geo.cities || [] },
          devices,
          events: events.events || [],
          funnel,
          campaigns,
          recent,
          loading: false,
          error: null,
          lastUpdated: new Date(),
        }))
      } catch (err: any) {
        if (cancelled) return
        setData((prev) => ({ ...prev, loading: false, error: err?.message || 'fetch error' }))
      }
    }

    loadAll()
    // تحديث كل 15 ثانية (بدلاً من 30) — توازن بين اللحظية وأداء الخادم
    intervalRef.current = setInterval(loadAll, 15000)
    return () => {
      cancelled = true
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [range, refreshKey])

  // جلب البيانات اللحظية + التحديث كل 4 ثوانٍ (شبه لحظي)
  useEffect(() => {
    let cancelled = false
    const loadRealtime = async () => {
      try {
        const rt = await fetchJson('/api/stats/realtime')
        if (cancelled) return
        setData((prev) => ({ ...prev, realtime: rt }))
      } catch {
        // تجاهل
      }
    }
    loadRealtime()
    // تحديث كل 4 ثوانٍ للزوار النشطين + الأحداث اللحظية
    const iv = setInterval(loadRealtime, 4000)
    return () => {
      cancelled = true
      clearInterval(iv)
    }
  }, [refreshKey])

  return { ...data, refresh }
}
