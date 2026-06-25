'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatFull, formatPercent, formatDuration } from '@/lib/format'

export interface KpiData {
  key: string
  label: string
  value: number
  change: number
  format?: 'number' | 'percent' | 'duration'
  icon: React.ReactNode
  accent?: 'primary' | 'gold' | 'blue' | 'purple' | 'pink' | 'emerald'
  sparkline?: number[]
}

const ACCENTS: Record<string, { bg: string; text: string; ring: string; gradient: string }> = {
  primary: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    ring: 'ring-primary/20',
    gradient: 'from-primary/5 to-transparent',
  },
  gold: {
    bg: 'bg-amber-100 dark:bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-500/20',
    gradient: 'from-amber-500/5 to-transparent',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-500/20',
    gradient: 'from-blue-500/5 to-transparent',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-500/15',
    text: 'text-purple-600 dark:text-purple-400',
    ring: 'ring-purple-500/20',
    gradient: 'from-purple-500/5 to-transparent',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-500/15',
    text: 'text-pink-600 dark:text-pink-400',
    ring: 'ring-pink-500/20',
    gradient: 'from-pink-500/5 to-transparent',
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-500/20',
    gradient: 'from-emerald-500/5 to-transparent',
  },
}

// رسم sparkline مصغّر كـ SVG
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 80
  const height = 24
  const step = width / (data.length - 1)

  const points = data
    .map((v, i) => {
      const x = i * step
      const y = height - ((v - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  const lastY = height - ((data[data.length - 1] - min) / range) * height

  return (
    <svg width={width} height={height} className="opacity-70" dir="ltr">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* نقطة النهاية */}
      <circle
        cx={width}
        cy={lastY}
        r="2"
        fill={color}
      />
    </svg>
  )
}

export function KpiCard({ data }: { data: KpiData }) {
  const accent = ACCENTS[data.accent || 'primary']
  const change = data.change || 0
  const isUp = change > 0.5
  const isDown = change < -0.5
  const ChangeIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus
  const changeColor = isUp ? 'text-emerald-600' : isDown ? 'text-red-500' : 'text-muted-foreground'

  const formatted =
    data.format === 'percent'
      ? formatPercent(data.value)
      : data.format === 'duration'
      ? formatDuration(data.value)
      : formatFull(data.value)

  return (
    <Card className={cn(
      'group relative overflow-hidden p-4 transition-all hover:shadow-lg hover:shadow-primary/5',
      'bg-gradient-to-br',
      accent.gradient
    )}>
      {/* خط علوي ملون خفيف */}
      <div className={cn('absolute top-0 right-0 left-0 h-0.5', accent.bg)} />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-muted-foreground sm:text-xs">
            {data.label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {formatted}
          </p>
        </div>
        <div className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform group-hover:scale-110',
          accent.bg,
          accent.ring
        )}>
          <span className={accent.text}>{data.icon}</span>
        </div>
      </div>

      {/* sparkline + تغيّر */}
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="flex items-center gap-1">
          <ChangeIcon className={cn('h-3 w-3', changeColor)} />
          <span className={cn('text-[11px] font-semibold', changeColor)}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        </div>
        {data.sparkline && data.sparkline.length > 1 && (
          <Sparkline data={data.sparkline} color={accent.text.includes('primary') ? '#0D7C66' : '#D4A853'} />
        )}
      </div>
    </Card>
  )
}
