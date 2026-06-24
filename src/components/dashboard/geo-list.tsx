'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MapPin } from 'lucide-react'
import type { GeoStat } from '@/hooks/use-analytics'
import { formatFull, countryFlag } from '@/lib/format'

export function GeoList({ countries, cities }: { countries: GeoStat[]; cities: GeoStat[] }) {
  const totalCountries = countries.reduce((sum, c) => sum + (c.sessions || 0), 0) || 1

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <MapPin className="h-4 w-4 text-primary" />
          التوزيع الجغرافي
        </CardTitle>
      </CardHeader>
      <CardContent>
        {countries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">لا توجد بيانات جغرافية بعد</p>
        ) : (
          <Tabs>
            <ScrollArea className="h-[300px] pr-1 custom-scroll">
              <div className="space-y-2.5">
                {countries.map((c, i) => {
                  const pct = ((c.sessions || 0) / totalCountries) * 100
                  return (
                    <div key={`${c.code}-${i}`} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="text-lg">{countryFlag(c.code)}</span>
                          <span className="truncate text-sm font-medium text-foreground">
                            {c.name}
                          </span>
                        </div>
                        <div className="shrink-0 text-left">
                          <span className="text-xs text-muted-foreground">{formatFull(c.visitors || 0)} زائر</span>
                          <span className="mr-2 text-sm font-bold text-foreground">{pct.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {cities.length > 0 && (
                <div className="mt-5 border-t border-border pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    المدن الأعلى زيارة
                  </p>
                  <div className="space-y-1.5">
                    {cities.slice(0, 8).map((c, i) => (
                      <div key={`${c.city}-${i}`} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span>{countryFlag(c.code)}</span>
                          <span className="text-foreground">{c.city}</span>
                        </span>
                        <span className="font-semibold text-foreground">{formatFull(c.sessions || 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

function Tabs({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
