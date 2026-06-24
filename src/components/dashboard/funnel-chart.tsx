'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, UserPlus, Sparkles, StickyNote, Share2, Target } from 'lucide-react'
import type { FunnelStep } from '@/hooks/use-analytics'
import { formatFull, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'

const ICONS: Record<string, React.ReactNode> = {
  eye: <Eye className="h-4 w-4" />,
  'user-plus': <UserPlus className="h-4 w-4" />,
  sparkles: <Sparkles className="h-4 w-4" />,
  'sticky-note': <StickyNote className="h-4 w-4" />,
  share: <Share2 className="h-4 w-4" />,
  target: <Target className="h-4 w-4" />,
}

const COLORS = ['bg-primary', 'bg-amber-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500']

export function FunnelChart({ funnel, conversionRate }: { funnel: FunnelStep[]; conversionRate: number }) {
  const max = funnel[0]?.count || 1

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Target className="h-4 w-4 text-primary" />
          مسار التحويل
        </CardTitle>
        <div className="text-left">
          <p className="text-xs text-muted-foreground">معدل التحويل الإجمالي</p>
          <p className="text-lg font-bold text-primary">{formatPercent(conversionRate)}</p>
        </div>
      </CardHeader>
      <CardContent>
        {funnel.length === 0 || funnel.every((f) => f.count === 0) ? (
          <p className="py-8 text-center text-sm text-muted-foreground">لا توجد بيانات تحويل بعد</p>
        ) : (
          <div className="space-y-3">
            {funnel.map((step, i) => {
              const pct = (step.count / max) * 100
              const dropoff = i > 0 && funnel[i - 1].count > 0
                ? ((funnel[i - 1].count - step.count) / funnel[i - 1].count) * 100
                : 0
              return (
                <div key={step.step} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg text-white', COLORS[i])}>
                        {ICONS[step.icon] || ICONS.target}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{step.step}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatFull(step.count)} جلسة · {formatPercent(step.rate)} من الإجمالي
                        </p>
                      </div>
                    </div>
                    {i > 0 && step.count < funnel[i - 1].count && (
                      <div className="text-left">
                        <p className="text-[10px] text-muted-foreground">تسرب</p>
                        <p className="text-xs font-semibold text-red-500">-{dropoff.toFixed(1)}%</p>
                      </div>
                    )}
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', COLORS[i])}
                      style={{ width: `${Math.max(pct, 2)}%` }}
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
