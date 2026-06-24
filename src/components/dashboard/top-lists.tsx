'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText } from 'lucide-react'
import type { PageStat, SourceStat } from '@/hooks/use-analytics'
import { formatFull } from '@/lib/format'

export function TopPages({ pages }: { pages: PageStat[] }) {
  const max = pages[0]?.views || 1
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <FileText className="h-4 w-4 text-primary" />
          الصفحات الأكثر زيارة
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">لا توجد بيانات</p>
        ) : (
          <ScrollArea className="h-[300px] pr-1 custom-scroll">
            <div className="space-y-3">
              {pages.map((p) => (
                <div key={p.path} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground" title={p.title || p.path}>
                        {p.title || p.path}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground" dir="ltr">{p.path}</p>
                    </div>
                    <div className="shrink-0 text-left">
                      <p className="text-sm font-bold text-foreground">{formatFull(p.views)}</p>
                      <p className="text-[10px] text-muted-foreground">{formatFull(p.visitors)} زائر</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(p.views / max) * 100}%` }}
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

export function TopSources({ sources }: { sources: SourceStat[] }) {
  const max = sources[0]?.sessions || 1
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <FileText className="h-4 w-4 text-amber-600" />
          مصادر الزيارات
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sources.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">لا توجد بيانات</p>
        ) : (
          <ScrollArea className="h-[300px] pr-1 custom-scroll">
            <div className="space-y-3">
              {sources.map((s) => (
                <div key={s.source} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground" dir="ltr">
                      {s.source === 'مباشر' ? 'مباشر (Direct)' : s.source}
                    </p>
                    <div className="shrink-0 text-left">
                      <p className="text-sm font-bold text-foreground">{formatFull(s.sessions)}</p>
                      <p className="text-[10px] text-muted-foreground">{formatFull(s.visitors)} زائر</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all"
                      style={{ width: `${(s.sessions / max) * 100}%` }}
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
