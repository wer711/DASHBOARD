# دليل نشر لوحة تحليلات صدى العقار على Vercel

دليل خطوة بخطوة لنشر اللوحة على Vercel وربطها بموقعك `sada-elaqar.vercel.app`.

---

## 📋 ما ستحتاجه

- حساب على [Vercel](https://vercel.com) (مجاني)
- حساب على [GitHub](https://github.com) (مجاني)
- الكود المصدري للوحة (هذا المشروع)

---

## المرحلة 1: رفع الكود إلى GitHub

### 1.1 إنشاء مستودع GitHub جديد

1. اذهب إلى https://github.com/new
2. اسم المستودع: `sada-analytics` (أو أي اسم تريده)
3. اختر **Private** (خاص — للحفاظ على أمان البيانات)
4. لا تفعّل "Add a README"
5. اضغط **Create repository**

### 1.2 رفع الكود

في جهازك (أو في بيئة التطوير)، افتح الطرفية في مجلد المشروع ونفّذ:

```bash
# تهيئة git (إن لم تكن مُهيأة)
git init

# إضافة كل الملفات
git add .

# أول commit
git commit -m "analytics dashboard for sada-elaqar"

# إضافة المستودع البعيد (استبدل USERNAME باسمك)
git remote add origin https://github.com/USERNAME/sada-analytics.git

# رفع الكود
git branch -M main
git push -u origin main
```

> 💡 إذا لم تكن متأكداً من خطوات git، استخدم تطبيق **GitHub Desktop** (أسهل بكثير).

---

## المرحلة 2: إنشاء قاعدة بيانات Postgres على Vercel

Vercel لا يدعم SQLite، لذا سنستخدم **Vercel Postgres** (مجاني حتى 256MB — يكفي لمئات الآلاف من الزوار).

### 2.1 إنشاء قاعدة البيانات

1. سجّل دخولك إلى https://vercel.com
2. من القائمة العلوية اختر **Storage** → **Create Database**
3. اختر **Postgres** (Neon)
4. اسم القاعدة: `sada-analytics-db`
5. المنطقة: اختر الأقرب (Frankfurt أو Bahrain إن توفّر)
6. اضغط **Create**

### 2.2 نسخ رابط الاتصال

1. بعد إنشاء القاعدة، اضغط عليها لفتحها
2. اذهب إلى تبويب **.env.local**
3. انسخ قيمة `POSTGRES_URL` (تبدأ بـ `postgres://...`)

> ⚠️ احتفظ بهذا الرابط — ستحتاجه في الخطوة التالية.

---

## المرحلة 3: نشر اللوحة على Vercel

### 3.1 استيراد المشروع

1. من لوحة تحكم Vercel، اضغط **Add New...** → **Project**
2. اختر مستودع `sada-analytics` من GitHub
3. إن لم يظهر، اضغط **Adjust GitHub App Permissions** وامنح Vercel صلاحية الوصول

### 3.2 إعدادات النشر

في صفحة **Configure Project**:

- **Framework Preset**: Next.js (سيُكتشف تلقائياً)
- **Root Directory**: `./` (الافتراضي)
- **Build Command**: `bash scripts/vercel-build.sh` (موجود في vercel.json تلقائياً)
- **Install Command**: `bun install` (موجود في vercel.json تلقائياً)

### 3.3 إضافة متغيرات البيئة

في نفس الصفحة، انزل إلى قسم **Environment Variables** وأضف:

| Name | Value | Environments |
|------|-------|--------------|
| `DATABASE_URL` | `postgres://...` (الذي نسخته في الخطوة 2.2) | Production, Preview, Development |

> 💡 لا تضف `LIVE_SERVICE_URL` و `NEXT_PUBLIC_LIVE_SERVICE_URL` الآن — ستعمل اللوحة بـ polling (شبه لحظي). يمكنك إضافتهما لاحقاً عند نشر خدمة WebSocket.

### 3.4 النشر

1. اضغط **Deploy**
2. انتظر 2-3 دقائق (البناء يشمل: تثبيت الحزم + تبديل المزوّد + دفع المخطط + بناء Next.js)
3. عند الانتهاء، ستحصل على رابط مثل: `https://sada-analytics-xxxx.vercel.app`

### 3.5 التحقق

1. افتح رابط اللوحة
2. سترى اللوحة تفتح فارغة (لا بيانات بعد) — هذا طبيعي
3. اضغط على زر **"توليد بيانات تجريبية"** في قسم "الإعداد والتثبيت" لاختبار اللوحة

> ✅ إذا رأيت البيانات التجريبية تظهر، فالنشر نجح بنجاح!

---

## المرحلة 4: ربط اللوحة بموقعك (sada-elaqar.vercel.app)

الآن سنضع سكربت التتبع في موقعك ليبدأ بإرسال البيانات للوحة.

### 4.1 احصل على رابط لوحتك

ستحتاجه في الخطوات التالية. مثال: `https://sada-analytics-xxxx.vercel.app`

### 4.2 تعديل ملف layout.tsx في موقعك

افتح مشروع موقعك `sada-elaqar` على Vercel أو محلياً، وافتح الملف:
```
app/layout.tsx
```

أضف هذا الكود داخل `<body>` (قبل إغلاقها مباشرة، بعد `{children}`):

```tsx
import Script from 'next/script'

// ... الكود الحالي ...

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}

        {/* === سكربت تتبع صدى العقار === */}
        <Script id="sada-config" strategy="beforeInteractive">{`
          window.sadaConfig = {
            endpoint: 'https://YOUR-DASHBOARD-URL.vercel.app/api/track',
            debug: false,
          };
        `}</Script>
        <Script
          src="https://YOUR-DASHBOARD-URL.vercel.app/track.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
```

> ⚠️ **استبدل** `YOUR-DASHBOARD-URL.vercel.app` برابط لوحتك الفعلي (في مكانين).

### 4.3 إعادة نشر موقعك

بعد حفظ الملف:
- إن كنت تستخدم Vercel مع GitHub: ادفع التغييرات وسيُعاد النشر تلقائياً
- أو يدوياً: من لوحة Vercel اضغط **Redeploy`

### 4.4 اختبار التتبع

1. افتح موقعك: https://sada-elaqar.vercel.app
2. تصفّح صفحاته (انتقل بين الأقسام)
3. ارجع للوحتك وافتحها — سترى نفسك في "الزوار النشطون الآن" خلال 10 ثوانٍ

> ✅ مبروك! البيانات تتدفّق الآن من موقعك إلى لوحتك.

---

## المرحلة 5: تتبع الأحداث المخصصة (تسجيلات، توليدات، إحالات)

المشاهدات تُتتبَّع تلقائياً، لكن لتتبع العمليات الفعلية تحتاج لإضافة استدعاءات بسيطة.

### 5.1 تتبع التسجيلات

في الكود الذي يعالج نموذج التسجيل بموقعك (في `app/page.tsx` أو الملف المعني):

```tsx
const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault()
  // ... كود التسجيل الحالي ...

  // بعد نجاح التسجيل:
  if (typeof window !== 'undefined' && window.sada) {
    window.sada.track('signup', {
      label: 'نموذج التسجيل الرئيسي',
      category: 'conversion',
    })
  }
}
```

### 5.2 تتبع عمليات توليد المحتوى

في الكود الذي يولّد المحتوى العقاري:

```tsx
const handleGenerate = async (propertyData: any) => {
  // ... كود التوليد الحالي (استدعاء API الذكاء الاصطناعي) ...

  // بعد نجاح التوليد:
  if (typeof window !== 'undefined' && window.sada) {
    window.sada.track('generate', {
      label: 'توليد محتوى عقاري',
      category: 'content',
      value: 1,
    })
  }
}
```

### 5.3 تتبع الملاحظات

```tsx
const handleSaveNote = () => {
  // ... كود حفظ الملاحظة ...

  if (typeof window !== 'undefined' && window.sada) {
    window.sada.track('note', {
      label: 'حفظ ملاحظة',
      category: 'engagement',
    })
  }
}
```

### 5.4 تتبع الإحالات

```tsx
const handleShareReferral = () => {
  // ... كود مشاركة رابط الإحالة ...

  if (typeof window !== 'undefined' && window.sada) {
    window.sada.track('referral', {
      label: 'مشاركة رابط إحالة',
      category: 'conversion',
    })
  }
}
```

### 5.5 تتبع النقرات التلقائي

لأي زر أو رابط تريد تتبع نقراته، أضف السمة `data-sada-track`:

```tsx
<button data-sada-track="cta-signup" data-sada-category="engagement">
  سجّل الآن
</button>

<a href="#demo" data-sada-track="try-now-click">جرّب الآن</a>

<button data-sada-track="generate-btn">توليد المحتوى</button>
```

ستظهر هذه النقرات تلقائياً في اللوحة تحت "الأحداث المخصصة".

---

## المرحلة 6: تتبع الحملات الترويجية (UTM)

عندما تبدأ بترويج موقعك بكثافة، استخدم معاملات UTM في كل رابط تحملة:

### 6.1 أمثلة روابط الحملات

```
✅ حملة انستغرام:
https://sada-elaqar.vercel.app/?utm_source=instagram&utm_medium=social&utm_campaign=reels_khaleej

✅ حملة جوجل الإعلانية:
https://sada-elaqar.vercel.app/?utm_source=google&utm_medium=cpc&utm_campaign=brand_q4

✅ حملة واتساب:
https://sada-elaqar.vercel.app/?utm_source=whatsapp&utm_medium=social&utm_campaign=friend_referral

✅ نشرة بريدية:
https://sada-elaqar.vercel.app/?utm_source=newsletter&utm_medium=email&utm_campaign=weekly
```

### 6.2 ما ستشاهده في اللوحة

- تبويب **"الحملات الترويجية (UTM)"** سيعرض:
  - كل حملة وعدد زوارها
  - المصادر (google, instagram, whatsapp...)
  - الوسائط (cpc, social, email...)
  - نسبة الزوار القادمين من حملات مُتتبَّعة

---

## المرحلة 7 (اختياري): تفعيل التحديث اللحظي الفوري عبر WebSocket

> 💡 **اللوحة تعمل بشكل ممتاز بدون هذه المرحلة** — تتحدّث كل 10 ثوانٍ. هذه المرحلة فقط لو أردت تحديثاً فورياً (أقل من ثانية).

### 7.1 نشر خدمة WebSocket على Render

1. اذهب إلى https://render.com وسجّل (مجاني)
2. اضغط **New +** → **Web Service**
3. اختر مستودع `sada-analytics` نفسه
4. الإعدادات:
   - **Name**: `sada-live`
   - **Root Directory**: `mini-services/live-service`
   - **Runtime**: `Bun`
   - **Build Command**: `bun install`
   - **Start Command**: `bun index.ts`
   - **Instance Type**: Free
5. اضغط **Create Web Service**
6. انتظر حتى يبدأ (1-2 دقيقة)
7. ستحصل على رابط مثل: `https://sada-live-xxxx.onrender.com`

### 7.2 تحديث متغيرات البيئة على Vercel

ارجع إلى مشروع اللوحة على Vercel → **Settings** → **Environment Variables** وأضف:

| Name | Value |
|------|-------|
| `LIVE_SERVICE_URL` | `https://sada-live-xxxx.onrender.com` |
| `NEXT_PUBLIC_LIVE_SERVICE_URL` | `https://sada-live-xxxx.onrender.com` |

### 7.3 إعادة النشر

من Vercel: **Deployments** → آخر نشر → **⋯** → **Redeploy**

### 7.4 التحقق

افتح اللوحة — يجب أن يظهر "متصل لحظياً" بدل "تحديث كل 10ث".

---

## 🎯 قائمة تحقق نهائية

- [ ] الكود مرفوع على GitHub
- [ ] قاعدة بيانات Postgres أُنشئت على Vercel
- [ ] `DATABASE_URL` مُضبوط كـ env var على Vercel
- [ ] النشر نجح واللوحة تفتح على رابط Vercel
- [ ] البيانات التجريبية تظهر عند الضغط على الزر
- [ ] سكربت التتبع مُضاف في `app/layout.tsx` بموقعك
- [ ] استبدلت `YOUR-DASHBOARD-URL.vercel.app` برابطك الفعلي
- [ ] موقعك أُعيد نشره
- [ ] فتحت موقعك ثم فتحت اللوحة — ظهرت كزائر نشط
- [ ] أضفت `sada.track('signup')` في كود التسجيل
- [ ] أضفت `sada.track('generate')` في كود التوليد
- [ ] بدأت باستخدام روابط UTM في حملاتك الترويجية

---

## 🆘 استكشاف الأخطاء

### المشكلة: اللوحة تفتح لكنها فارغة دائماً
**الحل**: تأكد أن `DATABASE_URL` مُضبوط على Vercel برابط Postgres صحيح. تحقق من سجلات النشر (Build Logs) — يجب أن ترى "Pushing schema to Postgres" بنجاح.

### المشكلة: الموقع لا يُرسل أحداثاً للوحة
**الحل**: افتح أدوات المطوّر (F12) → Console في موقعك. إذا رأيت خطأ CORS، أضف رابط موقعك إلى `ALLOWED_TRACKING_ORIGINS` كـ env var على Vercel.

### المشكلة: الزوار النشطون لا يظهرون رغم أنني أتصفّح الموقع
**الحل**: انتظر 10 ثوانٍ (فترة التحديث). تأكد أن `endpoint` في `window.sadaConfig` يشير للوحة الصحيحة.

### المشكلة: "متصل لحظياً" لا يظهر حتى بعد نشر خدمة WebSocket
**الحل**: تأكد أن `NEXT_PUBLIC_LIVE_SERVICE_URL` (وليس فقط `LIVE_SERVICE_URL`) مُضبوط على Vercel، وأن خدمة Render تعمل (افتح رابطها مباشرة — يجب أن ترى رسالة).

---

## 📞 الدعم

لأي مساعدة، راجع:
- ملف `INSTALL.md` في اللوحة (قسم "الإعداد والتثبيت")
- ملف `worklog.md` لتفاصيل البناء التقنية
- سجلات Vercel Build Logs للتشخيص
