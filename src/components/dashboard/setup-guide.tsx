'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Code, Copy, Check, Download, Terminal, TestTube, Loader2, AlertCircle, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

const TRACKING_SCRIPT = `<!-- سكربت تتبع صدى العقار — أضفه في <head> موقعك -->
<script>
  window.sadaConfig = {
    endpoint: 'https://YOUR-DASHBOARD-URL.vercel.app/api/track',
    debug: false,
  };
</script>
<script async src="https://YOUR-DASHBOARD-URL.vercel.app/track.js"></script>`

const NEXTJS_LAYOUT = `// app/layout.tsx  (Next.js App Router)
import Script from 'next/script'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
        <Script id="sada-config" strategy="beforeInteractive">{\`
          window.sadaConfig = {
            endpoint: 'https://YOUR-DASHBOARD-URL.vercel.app/api/track',
            debug: false,
          };
        \`}</Script>
        <Script
          src="https://YOUR-DASHBOARD-URL.vercel.app/track.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}`

const CUSTOM_EVENTS = `// 1. تتبع التسجيل
const handleSubmit = async () => {
  // ... كود التسجيل ...
  window.sada?.track('signup', { label: 'نموذج التسجيل الرئيسي' })
}

// 2. تتبع توليد المحتوى
const handleGenerate = async (propertyData) => {
  // ... كود التوليد ...
  window.sada?.track('generate', {
    label: 'محتوى عقاري',
    value: 1,
  })
}

// 3. تتبع حفظ الملاحظات
const handleSaveNote = () => {
  window.sada?.track('note', { label: 'حفظ ملاحظة' })
}

// 4. تتبع الإحالات
const handleShareReferral = () => {
  window.sada?.track('referral', { label: 'مشاركة رابط إحالة' })
}

// 5. تتبع التحويل
const handleConversion = () => {
  window.sada?.track('conversion', { label: 'إتمام عملية', value: 1 })
}`

const CLICK_TRACKING = `<!-- أضف data-sada-track لأي عنصر لتتبع نقراته تلقائياً -->
<button data-sada-track="cta-signup" data-sada-category="engagement">
  سجّل الآن
</button>

<a href="#demo" data-sada-track="try-now-click">جرّب الآن</a>

<button data-sada-track="generate-btn">توليد المحتوى</button>`

const UTM_LINKS = `<!-- روابط حملاتك الترويجية مع معاملات UTM -->

<!-- حملة انستغرام -->
https://sada-elaqar.vercel.app/?utm_source=instagram&utm_medium=social&utm_campaign=reels_khaleej

<!-- حملة جوجل الإعلانية -->
https://sada-elaqar.vercel.app/?utm_source=google&utm_medium=cpc&utm_campaign=brand_q4

<!-- حملة واتساب -->
https://sada-elaqar.vercel.app/?utm_source=whatsapp&utm_medium=social&utm_campaign=friend_referral

<!-- نشرة بريدية -->
https://sada-elaqar.vercel.app/?utm_source=newsletter&utm_medium=email&utm_campaign=weekly`

function CodeBlock({ code, language = 'html' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('تم نسخ الكود')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('تعذّر النسخ')
    }
  }
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-muted/40" dir="ltr">
      <div className="absolute right-2 top-2 z-10">
        <Button
          variant="secondary"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={copy}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'نُسخ' : 'نسخ'}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 pt-10 text-xs leading-relaxed">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  )
}

export function SetupGuide({ scriptUrl }: { scriptUrl: string }) {
  const [tab, setTab] = useState('install')
  const [seeding, setSeeding] = useState(false)
  const [clearing, setClearing] = useState(false)

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/seed-demo', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        toast.success(`تم توليد ${data.created.sessions} جلسة و ${data.created.events} حدث تجريبي`)
        setTimeout(() => window.location.reload(), 1500)
      } else {
        toast.error('فشل توليد البيانات')
      }
    } catch {
      toast.error('خطأ في الطلب')
    } finally {
      setSeeding(false)
    }
  }

  const handleClearDemo = async () => {
    if (!confirm('سيتم حذف كل البيانات التجريبية (التي تحمل معرّف demo_). هل أنت متأكد؟')) return
    setClearing(true)
    try {
      const res = await fetch('/api/clear-demo', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        toast.success(`تم حذف ${data.deleted.sessions} جلسة تجريبية و ${data.deleted.pageViews} مشاهدة`)
        setTimeout(() => window.location.reload(), 1500)
      } else {
        toast.error('فشل الحذف')
      }
    } catch {
      toast.error('خطأ في الطلب')
    } finally {
      setClearing(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Code className="h-4 w-4 text-primary" />
            الإعداد والتثبيت
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={seeding}
            >
              {seeding ? <Loader2 className="ml-1.5 h-3.5 w-3.5 animate-spin" /> : <TestTube className="ml-1.5 h-3.5 w-3.5" />}
              توليد بيانات تجريبية
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearDemo}
              disabled={clearing}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {clearing ? <Loader2 className="ml-1.5 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="ml-1.5 h-3.5 w-3.5" />}
              حذف البيانات التجريبية
            </Button>
            <a href={scriptUrl} download>
              <Button variant="outline" size="sm">
                <Download className="ml-1.5 h-3.5 w-3.5" />
                تحميل track.js
              </Button>
            </a>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="install" className="text-xs">تثبيت السكربت</TabsTrigger>
            <TabsTrigger value="nextjs" className="text-xs">Next.js</TabsTrigger>
            <TabsTrigger value="events" className="text-xs">الأحداث المخصصة</TabsTrigger>
            <TabsTrigger value="clicks" className="text-xs">تتبع النقرات</TabsTrigger>
            <TabsTrigger value="utm" className="text-xs">روابط الحملات</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          {tab === 'install' && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">خطوة مهمة قبل النشر</p>
                  <p className="mt-1 text-xs">
                    بعد نشر لوحة التحكم على Vercel، استبدل <code className="rounded bg-amber-100 dark:bg-amber-500/20 px-1">YOUR-DASHBOARD-URL.vercel.app</code> برابطك الفعلي.
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                أضف هذا الكود في عنصر <code className="rounded bg-muted px-1.5 py-0.5 text-xs">&lt;head&gt;</code> في موقعك:
              </p>
              <CodeBlock code={TRACKING_SCRIPT} />
            </div>
          )}
          {tab === 'nextjs' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                لموقعك المبني بـ Next.js (App Router)، أضف هذا في <code className="rounded bg-muted px-1.5 py-0.5 text-xs">app/layout.tsx</code>:
              </p>
              <CodeBlock code={NEXTJS_LAYOUT} language="tsx" />
            </div>
          )}
          {tab === 'events' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                استخدم <code className="rounded bg-muted px-1.5 py-0.5 text-xs">window.sada.track()</code> لتتبع كل العمليات في موقعك:
              </p>
              <CodeBlock code={CUSTOM_EVENTS} language="javascript" />
            </div>
          )}
          {tab === 'clicks' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                أضف السمة <code className="rounded bg-muted px-1.5 py-0.5 text-xs">data-sada-track</code> لأي عنصر لتتبع نقراته تلقائياً:
              </p>
              <CodeBlock code={CLICK_TRACKING} />
            </div>
          )}
          {tab === 'utm' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                استخدم معاملات UTM في روابط حملاتك الترويجية لتتبع كل مصدر على حدة:
              </p>
              <CodeBlock code={UTM_LINKS} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
