'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe, MapPin } from 'lucide-react'
import type { GeoStat } from '@/hooks/use-analytics'
import { countryFlag, formatFull } from '@/lib/format'
import { cn } from '@/lib/utils'

// إحداثيات تقريبية لدول العالم (خط الطول، دوائر العرض) للخريطة
// بناءً على موقع الدول في خريطة بكسلية بسيطة
const COUNTRY_COORDS: Record<string, { x: number; y: number }> = {
  // الخليج والشرق الأوسط
  SA: { x: 540, y: 230 }, AE: { x: 560, y: 235 }, KW: { x: 530, y: 215 }, QA: { x: 552, y: 230 },
  BH: { x: 548, y: 232 }, OM: { x: 565, y: 240 }, YE: { x: 545, y: 255 }, IQ: { x: 530, y: 200 },
  IR: { x: 560, y: 195 }, JO: { x: 525, y: 220 }, SY: { x: 520, y: 205 }, LB: { x: 518, y: 210 },
  PS: { x: 520, y: 218 }, IL: { x: 520, y: 218 },
  // شمال أفريقيا
  EG: { x: 510, y: 220 }, LY: { x: 480, y: 220 }, TN: { x: 470, y: 215 }, DZ: { x: 455, y: 220 },
  MA: { x: 440, y: 225 }, SD: { x: 500, y: 250 }, MR: { x: 420, y: 245 },
  // أفريقيا جنوب الصحراء
  ET: { x: 520, y: 280 }, KE: { x: 520, y: 305 }, NG: { x: 470, y: 275 }, GH: { x: 450, y: 280 },
  TZ: { x: 520, y: 320 }, UG: { x: 520, y: 295 }, ZA: { x: 510, y: 360 }, SN: { x: 430, y: 265 },
  // أوروبا
  GB: { x: 430, y: 160 }, FR: { x: 440, y: 180 }, DE: { x: 460, y: 165 }, ES: { x: 420, y: 195 },
  IT: { x: 460, y: 195 }, NL: { x: 450, y: 155 }, BE: { x: 445, y: 170 }, CH: { x: 455, y: 185 },
  SE: { x: 460, y: 130 }, NO: { x: 455, y: 115 }, DK: { x: 455, y: 145 }, FI: { x: 475, y: 125 },
  PL: { x: 470, y: 155 }, PT: { x: 410, y: 200 }, GR: { x: 480, y: 205 }, AT: { x: 465, y: 175 },
  IE: { x: 420, y: 155 }, CZ: { x: 465, y: 170 }, RO: { x: 485, y: 175 }, HU: { x: 475, y: 175 },
  TR: { x: 500, y: 200 }, UA: { x: 490, y: 160 }, RU: { x: 550, y: 110 },
  // آسيا
  CN: { x: 680, y: 190 }, JP: { x: 750, y: 195 }, KR: { x: 730, y: 195 },
  IN: { x: 620, y: 250 }, PK: { x: 600, y: 220 }, ID: { x: 690, y: 310 }, MY: { x: 670, y: 280 },
  SG: { x: 670, y: 285 }, TH: { x: 650, y: 260 }, VN: { x: 660, y: 255 }, PH: { x: 700, y: 270 },
  HK: { x: 710, y: 220 }, TW: { x: 720, y: 230 }, KZ: { x: 600, y: 160 }, AF: { x: 580, y: 215 },
  // الأمريكتان
  US: { x: 200, y: 190 }, CA: { x: 200, y: 140 }, MX: { x: 180, y: 230 },
  BR: { x: 280, y: 320 }, AR: { x: 270, y: 380 }, CL: { x: 260, y: 370 },
  CO: { x: 240, y: 280 }, PE: { x: 250, y: 310 }, VE: { x: 250, y: 260 },
  // أوقيانوسيا
  AU: { x: 700, y: 350 }, NZ: { x: 750, y: 380 },
}

interface WorldMapProps {
  countries: GeoStat[]
  activeVisitors?: number
}

export function WorldMap({ countries, activeVisitors = 0 }: WorldMapProps) {
  const totalSessions = countries.reduce((sum, c) => sum + (c.sessions || 0), 0) || 1
  const maxSessions = Math.max(...countries.map((c) => c.sessions || 0), 1)

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Globe className="h-4 w-4 text-primary" />
          خريطة الزوار العالمية
        </CardTitle>
        {activeVisitors > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <span className="live-dot flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {activeVisitors} نشط
          </span>
        )}
      </CardHeader>
      <CardContent>
        {countries.length === 0 || countries.every((c) => !c.code || c.code === '?') ? (
          <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Globe className="h-12 w-12 opacity-20" />
            <p className="text-sm">لا توجد بيانات جغرافية بعد</p>
            <p className="text-xs">ستظهر النقاط على الخريطة فور وصول زوار حقيقيين</p>
          </div>
        ) : (
          <>
            {/* الخريطة */}
            <div className="relative mx-auto mb-4 w-full max-w-[600px]" dir="ltr">
              <svg
                viewBox="0 0 800 420"
                className="w-full h-auto"
                style={{ background: 'var(--muted)' }}
              >
                {/* خلفية بسيطة للقارات */}
                <rect width="800" height="420" fill="var(--muted)" opacity="0.3" />

                {/* نقاط الزوار */}
                {countries.map((country, idx) => {
                  const coords = country.code ? COUNTRY_COORDS[country.code] : null
                  if (!coords) return null
                  const intensity = (country.sessions || 0) / maxSessions
                  const radius = 4 + intensity * 12
                  const isTop = idx < 3
                  return (
                    <g key={`${country.code}-${idx}`}>
                      {/* حلقة النبض للدول الأعلى */}
                      {isTop && (
                        <circle
                          cx={coords.x}
                          cy={coords.y}
                          r={radius + 6}
                          fill="var(--primary)"
                          opacity="0.15"
                          className="live-dot"
                        />
                      )}
                      {/* الدائرة الرئيسية */}
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r={radius}
                        fill="var(--primary)"
                        opacity={0.4 + intensity * 0.6}
                      />
                      {/* تسمية الدولة */}
                      {(isTop || intensity > 0.3) && (
                        <text
                          x={coords.x}
                          y={coords.y - radius - 4}
                          textAnchor="middle"
                          fontSize="10"
                          fill="var(--foreground)"
                          fontWeight="600"
                        >
                          {countryFlag(country.code)} {country.sessions}
                        </text>
                      )}
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* قائمة الدول */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                أعلى الدول ({countries.length})
              </p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {countries.slice(0, 8).map((c, i) => {
                  const pct = ((c.sessions || 0) / totalSessions) * 100
                  return (
                    <div
                      key={`${c.code}-${i}`}
                      className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/30 px-2 py-1.5"
                    >
                      <span className="text-base">{countryFlag(c.code)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">
                          {c.name}
                        </p>
                        <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-foreground">
                        {formatFull(c.sessions || 0)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
