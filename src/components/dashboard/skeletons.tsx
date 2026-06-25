'use client'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// هيكل عظمي لبطاقة KPI
export function KpiSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-16" />
      </div>
    </Card>
  )
}

// هيكل عظمي لمخطط
export function ChartSkeleton() {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <div className="flex items-center justify-between p-6 pb-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="p-6 pt-2">
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </div>
    </Card>
  )
}

// هيكل عظمي لقائمة
export function ListSkeleton() {
  return (
    <Card className="h-full">
      <div className="p-6 pb-3">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="space-y-3 px-6 pb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </Card>
  )
}

// هيكل عظمي كامل للوحة
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* LiveTopBar skeleton */}
      <Skeleton className="h-16 w-full rounded-xl" />

      {/* KPIs skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>

      {/* Chart + LiveFeed skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartSkeleton />
        <ListSkeleton />
      </div>

      {/* Active + Funnel skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ListSkeleton />
        <ListSkeleton />
      </div>

      {/* Three lists skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ListSkeleton />
        <ListSkeleton />
        <ListSkeleton />
      </div>
    </div>
  )
}
