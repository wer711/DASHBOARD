# Sada Analytics — Installation Guide

This guide explains how to embed the Sada Analytics tracker into your Next.js site
(https://sada-elaqar.vercel.app) so that visits, page views, sessions, signups, content
generations, notes, referrals, conversions, devices, geo and UTM campaigns are streamed
into the dashboard.

The tracker is a single **`track.js`** file (~6 KB, no dependencies, vanilla JS). It is
served from your dashboard deployment, e.g.:

```
https://YOUR-DASHBOARD-DOMAIN.vercel.app/track.js
```

> Replace `YOUR-DASHBOARD-DOMAIN` below with the actual URL where the analytics dashboard
> is deployed (e.g. `https://sada-dashboard.vercel.app`).

---

## 1. Embed the script tag

The script auto-initializes on load. Use **Next.js `Script`** with `afterInteractive`
strategy so it works with both App Router and client-side routing.

### Option A — Next.js App Router (`app/layout.tsx`)

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'صدى العقار',
  description: 'منصة العقارات الذكية',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
        {/* Sada Analytics */}
        <Script
          src="https://YOUR-DASHBOARD-DOMAIN.vercel.app/track.js"
          strategy="afterInteractive"
          async
        />
      </body>
    </html>
  )
}
```

### Option B — Pages Router (`pages/_app.tsx`)

```tsx
// pages/_app.tsx
import Script from 'next/script'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Script
        src="https://YOUR-DASHBOARD-DOMAIN.vercel.app/track.js"
        strategy="afterInteractive"
        async
      />
    </>
  )
}
```

### Option C — Plain HTML

```html
<script async src="https://YOUR-DASHBOARD-DOMAIN.vercel.app/track.js"></script>
```

> Place the tag in the `<head>` or just before `</body>`. Because it is `async` and
> framework-agnostic, it will not block your page render.

---

## 2. Configure (optional)

If you need to override the default behavior, define `window.sadaConfig` **before** the
script tag loads:

```tsx
// app/layout.tsx
<Script id="sada-config" strategy="beforeInteractive">
  {`
    window.sadaConfig = {
      endpoint: 'https://YOUR-DASHBOARD-DOMAIN.vercel.app/api/track',
      debug: false,
      autoPageviews: true,
      autoClicks: true,
      // heartbeatIntervalMs: 10000  // (optional, default 10s)
    };
  `}
</Script>
<Script
  src="https://YOUR-DASHBOARD-DOMAIN.vercel.app/track.js"
  strategy="afterInteractive"
  async
/>
```

### Configuration options

| Option                  | Type      | Default                              | Description                                                                 |
| ----------------------- | --------- | ------------------------------------ | --------------------------------------------------------------------------- |
| `endpoint`              | `string`  | Derived from `track.js` `src` URL    | Override the collection endpoint (e.g. self-hosted).                        |
| `debug`                 | `boolean` | `false`                              | Log every send to the browser console.                                     |
| `autoPageviews`         | `boolean` | `true`                               | Auto-send pageviews on load + SPA route changes.                           |
| `autoClicks`            | `boolean` | `true`                               | Auto-track clicks on `[data-sada-track]` elements.                         |
| `heartbeatIntervalMs`   | `number`  | `10000`                              | Heartbeat cadence (also fires on `visibilitychange → visible`).            |
| `disabled`              | `boolean` | `false`                              | Master kill switch — skip all tracking.                                    |

---

## 3. Track custom events

Use `window.sada.track(name, props?)` anywhere in your app code (after the script has
loaded). The tracker is resilient: if you call it before the script loads, queue the
calls with `window.sada.queue` (see §6 below).

### `signup` — when a user registers

```tsx
// app/(auth)/signup/page.tsx
'use client'

export default function SignupPage() {
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // ... your signup logic ...
    try {
      const res = await fetch('/api/auth/signup', { method: 'POST', body: new FormData(e.currentTarget) })
      if (res.ok) {
        window.sada?.track('signup', {
          label: 'form1',
          category: 'auth',
          metadata: { method: 'email' },
        })
      }
    } catch (err) {
      // handle
    }
  }
  return <form onSubmit={onSubmit}>{/* ... */}</form>
}
```

### `generate` — when the user generates a real-estate listing

```tsx
// app/dashboard/generate/page.tsx
'use client'

export default function GeneratePage() {
  async function onGenerate() {
    const listing = await fetch('/api/listings/generate', { method: 'POST' }).then((r) => r.json())
    window.sada?.track('generate', {
      label: listing.propertyType ?? 'unknown',
      value: listing.price ?? null,
      category: 'ai',
      metadata: { listingId: listing.id, beds: listing.beds, baths: listing.baths },
    })
  }
  return <button onClick={onGenerate}>Generate Listing</button>
}
```

### `note` — when the user adds a note to a listing

```tsx
await fetch(`/api/listings/${listingId}/notes`, { method: 'POST', body: JSON.stringify({ text }) })
window.sada?.track('note', { label: listingId, category: 'engagement' })
```

### `referral` — when a user shares a referral link

```tsx
function onShareClick(refCode: string) {
  window.sada?.track('referral', {
    label: refCode,
    category: 'growth',
    metadata: { channel: 'whatsapp' },
  })
  // ... actual share logic ...
}
```

### `conversion` — when a visitor becomes a paying customer

```tsx
window.sada?.track('conversion', {
  label: 'pro_plan',
  value: 99,
  category: 'revenue',
  metadata: { plan: 'pro', cycle: 'monthly' },
})
```

### Props reference

| Prop        | Type                | Description                                                          |
| ----------- | ------------------- | -------------------------------------------------------------------- |
| `category`  | `string \| null`    | Grouping bucket (e.g. `'auth'`, `'ai'`, `'growth'`).                 |
| `label`     | `string \| null`    | Free-form label (e.g. form id, listing id).                          |
| `value`     | `number \| null`    | Numeric value (e.g. price, count).                                   |
| `metadata`  | `object \| null`    | Arbitrary JSON object (stored as string, surfaced in live feed).     |

Any other props you pass become `metadata` automatically.

---

## 4. Manual pageviews

Auto-pageviews cover Next.js client-side routing automatically (App Router + Pages
Router). If you ever need to fire one manually — for example, after a virtual route
inside a modal — use:

```tsx
window.sada?.page('/listings/123/edit')
```

Pass a full URL or a path. The tracker resolves it relative to the current page.

---

## 5. Click tracking with `data-sada-track`

Any element annotated with `data-sada-track="<event-name>"` will automatically fire a
custom event on click — no JS required.

```tsx
export function HeroCTA() {
  return (
    <div className="hero">
      <button data-sada-track="cta-signup" data-sada-category="hero">
        ابدأ مجاناً
      </button>
      <a href="/pricing" data-sada-track="nav-pricing" className="link">
        الأسعار
      </a>
    </div>
  )
}
```

- Event name = the `data-sada-track` value (`cta-signup`, `nav-pricing`, ...).
- `label` = the element's trimmed text (max 200 chars).
- Optional `data-sada-category` overrides the category.

This is the fastest way to track CTAs, nav clicks, social links, etc. without touching
your handler code.

---

## 6. Calling the API before the script loads

For components that render before `track.js` finishes loading, queue calls like this
(anywhere, in a `<Script strategy="beforeInteractive">` or in your app shell):

```html
<script>
  window.sada = window.sada || function () {
    (window.sada.q = window.sada.q || []).push(arguments)
  }
</script>
```

> Note: the modern `window.sada.track(...)` object API is the preferred interface.
> The queue shim above is only needed if you must call `.track()` synchronously during
> first render. Once `track.js` loads, the real API replays any queued calls and
> replaces the shim.

---

## 7. UTM campaign tracking

The tracker reads UTMs automatically from the page URL on every pageview and forwards
them to the backend, where they are parsed and stored on the session. No extra code
required — just craft links with UTM params:

### Instagram launch promo

```
https://sada-elaqar.vercel.app/?utm_source=instagram&utm_medium=social&utm_campaign=launch_promo&utm_content=story_1
```

### Google Ads

```
https://sada-elaqar.vercel.app/?utm_source=google&utm_medium=cpc&utm_campaign=brand_keywords&utm_term=sada+aqar
```

### WhatsApp broadcast

```
https://sada-elaqar.vercel.app/?utm_source=whatsapp&utm_medium=messaging&utm_campaign=ramadan_offers
```

### Supported UTM parameters

| Param          | Stored as      | Example                              |
| -------------- | -------------- | ------------------------------------ |
| `utm_source`   | `utmSource`    | `instagram`, `google`, `whatsapp`    |
| `utm_medium`   | `utmMedium`    | `social`, `cpc`, `messaging`         |
| `utm_campaign` | `utmCampaign`  | `launch_promo`, `ramadan_offers`     |
| `utm_term`     | `utmTerm`      | `sada+aqar`                          |
| `utm_content`  | `utmContent`   | `story_1`, `hero_button`             |

The first-touch UTM values are captured on the visitor's session. They appear in the
dashboard under **Campaigns**, and they're cross-referenced with signups and
conversions in the funnel view.

---

## 8. What the script captures automatically

You don't need to wire up anything beyond the script tag for:

- **Page views** — initial load + every SPA route change (`pushState`/`replaceState`/`popstate`).
- **Sessions** — per-tab `sessionStorage` id; auto-renews when the tab closes.
- **Visitors** — persistent `localStorage` id (survives across sessions).
- **Screen size & language** — captured on every pageview.
- **Referrer** — `document.referrer`, parsed into referrer domain on the backend.
- **Geo, device, browser, OS** — derived from IP + User-Agent on the backend.
- **Heartbeats** — every 10 s (and on tab refocus) keep the session marked active.
- **Leave** — `pagehide` / `beforeunload` end the session via `navigator.sendBeacon`.

---

## 9. Privacy & reliability

- The tracker never reads cookies set by other services.
- All network calls use `fetch(..., { keepalive: true })`; `leave` events use
  `navigator.sendBeacon` for reliability during tab close.
- Everything is wrapped in `try/catch` — the script can never break the host page.
- No PII is collected automatically. Use `sada.setVisitor({ ... })` only if you have
  consent to attach user-identifying properties to events.

---

## 10. Verifying the installation

1. Open your site in a browser.
2. Open DevTools → Network tab and filter for `track`.
3. You should see a `POST /api/track` request with `type: "pageview"` within
   milliseconds of page load.
4. Click around — each Next.js route change should fire another `pageview`.
5. Every 10 s you should see a `heartbeat` request.
6. Set `window.sadaConfig = { debug: true }` and reload — every send is logged to the
   console with the `[sada]` prefix.

Once events appear in the Network tab, they will appear in the dashboard's **Realtime**
panel and the historical charts within seconds.

---

## 11. Quick reference

```html
<!-- Minimal install — paste this once in app/layout.tsx (or _app.tsx) -->
<Script
  src="https://YOUR-DASHBOARD-DOMAIN.vercel.app/track.js"
  strategy="afterInteractive"
  async
/>

<!-- Track a CTA click -->
<button data-sada-track="cta-signup">ابدأ مجاناً</button>

<!-- Track a custom event -->
<script>
  window.sada.track('signup', { label: 'form1', category: 'auth' })
</script>
```

That's it. You're tracking.
