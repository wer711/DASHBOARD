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
}

const ACCENTS: Record<string, { bg: string; text: string }> = {
  primary: { bg: 'bg-primary/10', text: 'text-primary' },
  gold: { bg: 'bg-amber-100 dark:bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-500/15', text: 'text-pink-600 dark:text-pink-400' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
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
    <Card className="overflow-hidden p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
            {data.label}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {formatted}
          </p>
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', accent.bg)}>
          <span className={accent.text}>{data.icon}</span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        <ChangeIcon className={cn('h-3.5 w-3.5', changeColor)} />
        <span className={cn('text-xs font-semibold', changeColor)}>
          {change > 0 ? '+' : ''}{change.toFixed(1)}%
        </span>
        <span className="text-xs text-muted-foreground">عن الفترة السابقة</span>
      </div>
    </Card>
  )
}
