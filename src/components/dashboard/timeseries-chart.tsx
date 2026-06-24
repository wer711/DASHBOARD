'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Users, Eye } from 'lucide-react'
import { formatFull } from '@/lib/format'

interface TimeSeriesPoint {
  label: string
  timestamp: string
  visitors: number
  pageViews: number
  sessions: number
  signups: number
  generations: number
}

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>
  label?: string
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const labels: Record<string, string> = {
    visitors: 'الزوار الفريدون',
    pageViews: 'المشاهدات',
    sessions: 'الجلسات',
    signups: 'التسجيلات',
    generations: 'التوليدات',
  }
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-semibold text-foreground">{label}</p>
      <div className="space-y-0.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-muted-foreground">{labels[p.dataKey] || p.name}:</span>
            <span className="font-semibold text-foreground">{formatFull(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TimeSeriesChart({ data, granularity }: { data: TimeSeriesPoint[]; granularity: 'hour' | 'day' }) {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">حركة الزوار عبر الزمن</CardTitle>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="text-muted-foreground">الزوار</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">المشاهدات</span>
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="visitorsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D7C66" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0D7C66" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pageViewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A853" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#D4A853" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="var(--muted-foreground)"
                tick={{ fontSize: 11, fontFamily: 'inherit' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="var(--muted-foreground)"
                tick={{ fontSize: 11, fontFamily: 'inherit' }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="pageViews"
                stroke="#D4A853"
                strokeWidth={2}
                fill="url(#pageViewsGrad)"
                name="المشاهدات"
              />
              <Area
                type="monotone"
                dataKey="visitors"
                stroke="#0D7C66"
                strokeWidth={2}
                fill="url(#visitorsGrad)"
                name="الزوار"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
