# Worklog — Analytics Dashboard for Sada Al-Aqar

## Project Context
Building a self-hosted real-time analytics dashboard for the website https://sada-elaqar.vercel.app
The dashboard tracks: visitors, page views, sessions, signups, content generations, notes, referrals, conversions, geo, devices, UTM campaigns.

## Architecture
- Next.js 16 + Prisma (SQLite) on port 3000 (the dashboard itself)
- WebSocket mini-service on port 3003 (live updates)
- Tracking script served from /track.js (embedded in the tracked site)
- Collection endpoint: POST /api/track
- Reporting endpoints under /api/stats/*

---
Task ID: 1
Agent: Main (orchestrator)
Task: Design Prisma schema + push to DB

Work Log:
- Wrote prisma/schema.prisma with models: Website, Session, PageView, Event, DailyStats
- Ran bun run db:push successfully

Stage Summary:
- Database ready at db/custom.db
- 5 models track website → sessions → page views / events with full visitor context (geo, device, UTM, referrer)

---
Task ID: 2
Agent: Main (orchestrator)
Task: Build all API endpoints (collection + reporting)

Work Log:
- Created /api/track (POST) — receives pageview/event/heartbeat/leave, parses UA, queries geo from ipapi.co, broadcasts to live service
- Created /api/stats/overview — KPIs with period-over-period change %
- Created /api/stats/realtime — active visitors in last 5 min + recent events feed
- Created /api/stats/timeseries — time bucketed visitor/pageview counts
- Created /api/stats/pages — top pages
- Created /api/stats/sources — referrer domains
- Created /api/stats/geo — countries + cities
- Created /api/stats/devices — device/browser/os/brand breakdown
- Created /api/stats/events — custom event counts
- Created /api/stats/funnel — visit → signup → generate → note → referral
- Created /api/stats/campaigns — UTM breakdown
- Created /api/stats/recent — unified activity feed
- Created /api/website — website info
- Created /api/seed-demo — generates demo data for testing

Stage Summary:
- All API endpoints implemented. Default website auto-created with domain 'sada-elaqar.vercel.app'
- CORS configured to allow the tracked site to POST events
- Live service notified via fetch to localhost:3003/internal/broadcast

---
Task ID: 3
Agent: full-stack-developer
Task: Build tracking script + install guide

Work Log:
- Reviewed existing /api/track endpoint (Task 2) to confirm exact payload contract (type, sessionId, visitorId, url, referrer, title, screenWidth, screenHeight, language + event fields name/category/label/value/metadata).
- Read /home/z/my-project/worklog.md to align with prior tasks (Prisma schema + all API routes already in place).
- Created /public/track.js — a single IIFE-wrapped vanilla-JS tracker (~9.4KB raw, ~3.0KB gzipped). Features:
  * Auto-generates persistent visitor_id (localStorage) and per-tab session_id (sessionStorage) with crypto.randomUUID + UUIDv4 fallback.
  * Auto-sends initial pageview including url, referrer, title, screen size, language.
  * Monkey-patches history.pushState/replaceState + listens on popstate to fire pageviews on Next.js client-side route changes.
  * 10s heartbeat interval + heartbeat on visibilitychange→visible (session stays active).
  * leave event sent on pagehide/beforeunload via navigator.sendBeacon (with Blob fallback).
  * Click tracking via [data-sada-track] (event name = attribute value, label = trimmed textContent, optional [data-sada-category]).
  * Public API: window.sada.track(name, props?), sada.page(path?), sada.setVisitor(props), plus sada.config(key,val).
  * Reads window.sadaConfig {endpoint, debug, autoPageviews, autoClicks, heartbeatIntervalMs, disabled} set BEFORE the script loads.
  * Auto-derives endpoint from the script's own src URL (new URL('./api/track', scriptSrc)) when no explicit endpoint is configured.
  * Replays any pre-queued window.sada.queue calls so users can call sada.track() before the script loads.
  * Every public method + network send wrapped in try/catch — the host page can never break.
  * fetch(..., {keepalive: true, credentials: 'include', mode: 'cors'}) for normal sends; sendBeacon for leaves.
- Created /public/INSTALL.md — comprehensive markdown guide covering:
  * Three install options (App Router layout.tsx, Pages Router _app.tsx, plain HTML) using next/script with afterInteractive strategy.
  * sadaConfig beforeInteractive setup with full options table.
  * Worked examples for signup / generate / note / referral / conversion custom events inside Next.js client components.
  * Manual pageview docs (sada.page('/path')).
  * data-sada-track click tracking markup example.
  * Queue-shim snippet for calling sada.track() before the script finishes loading.
  * UTM campaign link examples (Instagram launch, Google Ads, WhatsApp broadcast) + supported params table.
  * Auto-captured fields list + privacy/reliability notes + DevTools verification steps + quick-reference card.
- Ran `bun run lint` → no errors, no warnings. (Eslint output: "$ eslint ." with no diagnostics.)
- Verified track.js syntax with `node --check` → SYNTAX OK. Confirmed gzip size = 3,052 bytes.

Stage Summary:
- Files created: public/track.js (9,434 bytes raw / 3,052 bytes gzipped), public/INSTALL.md (12,589 bytes).
- No other files modified. No dev server started. No Next.js routes added (the dashboard's only visible route remains /).
- Key design decisions:
  * Endpoint auto-derivation uses document.currentScript.src so a single dashboard deployment can host track.js for many sites without per-site config.
  * Click events use the attribute VALUE as the event name (per spec) so dashboards/funnels see meaningful names like cta-signup rather than a generic 'click'.
  * Queue replay supports both the new object API (window.sada.queue = [[methodName, ...args]]) and continues to expose window.sada.track after init.
  * Heartbeat interval is configurable (window.sadaConfig.heartbeatIntervalMs) defaulting to 10s as specified.
- No issues encountered. Lint passes cleanly.

---
Task ID: 4
Agent: full-stack-developer
Task: Build WebSocket live-service mini-service on port 3003

Work Log:
- Read /home/z/my-project/worklog.md to align with Tasks 1-3 (Prisma schema, all API routes including /api/track → notifyLiveService, track.js + INSTALL.md already in place).
- Read /home/z/my-project/examples/websocket/server.ts to confirm the required socket.io pattern (path: '/', cors '*', pingTimeout 60000, pingInterval 25000, graceful SIGTERM/SIGINT shutdown).
- Read /home/z/my-project/src/app/api/track/route.ts to confirm the exact payload shape POSTed to http://localhost:3003/internal/broadcast (pageview + custom-event variants; heartbeat/leave don't currently broadcast but were typed defensively as a 4-arm union).
- Created /home/z/my-project/mini-services/live-service/package.json: name=live-service, private, type=module, scripts { dev: "bun --hot index.ts", start: "bun index.ts" }, deps { socket.io ^4.8.1 }, devDeps { @types/node ^22.10.5, bun-types ^1.2.0 }.
- Created /home/z/my-project/mini-services/live-service/tsconfig.json: ES2022 + Bundler resolution, types ["bun-types","node"], strict, noEmit, includes index.ts only.
- Created /home/z/my-project/mini-services/live-service/index.ts (~290 lines) implementing:
  * HTTP server bound to port 3003.
  * socket.io Server with path: '/' (REQUIRED for Caddy), cors origin '*', methods GET/POST, pingTimeout 60000, pingInterval 25000.
  * POST /internal/broadcast — streams request body, parses JSON (with 1MB cap), validates `type` field, broadcasts payload to ALL clients via io.emit('analytics:event', payload), pushes to a 100-entry ring buffer (newest first), increments totalBroadcasts counter, logs one summary line, returns {ok:true}. Bad JSON / missing type → 400.
  * GET /internal/stats → { connectedClients, totalBroadcasts, startedAt }.
  * GET /health → { ok:true, uptime } (uptime in seconds).
  * OPTIONS preflight handled for our 3 routes only (204 with CORS headers) — socket.io's own polling endpoint handles its own preflight.
  * socket.io 'connection' handler: increments counter, logs `[socket] client connected id=… clients=…`, emits 'welcome' {message:'connected to live analytics', time} to the new client only, then emits 'analytics:history' with the buffered events array (newest first, capped at 100) so a fresh dashboard gets immediate context. 'ping' (custom client event) → emits 'pong' {time}. 'disconnect' → decrements counter, logs reason. 'error' → logs.
  * In-memory ring buffer (eventHistory: AnalyticsEvent[], newest-first, capped at HISTORY_LIMIT=100) — pushHistory() truncates in place.
  * Graceful shutdown: SIGTERM + SIGINT handlers call io.close() then httpServer.close() then process.exit(0); 5s hard-exit fallback via unref'd timer.
  * uncaughtException + unhandledRejection handlers log to stderr without exiting (so a single bad payload can't kill the relay).
  * Strict TypeScript throughout: union type AnalyticsEvent = PageviewEvent | CustomEvent | HeartbeatEvent | LeaveEvent with explicit interfaces for every payload + WelcomePayload, PongPayload, StatsResponse, HealthResponse.
- KEY GOTCHA FIXED: socket.io v4 with `path: '/'` causes engine.io's path-check (`path === req.url.slice(0, path.length)`) to match EVERY URL (because every URL starts with '/'), so engine.io was intercepting /health, /internal/stats and /internal/broadcast and replying `{"code":0,"message":"Transport unknown"}` (HTTP 400). Fix: after `new Server(httpServer, …)` runs (which wraps the http server's `request` listeners), I pop the wrapped listener(s) off, install my own dispatcher that runs handleHttpRequest() first and only delegates to the wrapped listener for non-route URLs. This way /internal/broadcast, /internal/stats, /health are fully owned by us, and genuine socket.io connections (e.g. `GET /?EIO=4&transport=polling`) still reach engine.io. Verified working end-to-end.
- Ran `cd /home/z/my-project/mini-services/live-service && bun install` → 23 packages installed (socket.io 4.8.3, engine.io 6.6.2, @types/node 22.20.0, bun-types 1.3.14).
- Typecheck: `bunx tsc --noEmit -p tsconfig.json` → exit 0, no diagnostics.
- Smoke test: `timeout 3 bun index.ts` → startup log `[live-service] running on port 3003 (socket.io path=/, http endpoints: /internal/broadcast, /internal/stats, /health)`, then SIGTERM-driven graceful shutdown (`[shutdown] received SIGTERM, closing live-service...` → `[shutdown] http server closed`). Exit code 124 (from `timeout`) is expected.
- Smoke test: `timeout 2 bun --hot index.ts` → identical clean startup (auto-restart-on-file-change mode confirmed).
- Functional curl sweep against the live service:
  * GET /health → {"ok":true,"uptime":1}
  * GET /internal/stats (before) → {"connectedClients":0,"totalBroadcasts":0,"startedAt":"…"}
  * POST /internal/broadcast pageview → {"ok":true} + log [broadcast] type=pageview clients=0 total=1
  * POST /internal/broadcast event → {"ok":true} + log [broadcast] type=event clients=0 total=2
  * POST /internal/broadcast heartbeat → {"ok":true} + log [broadcast] type=heartbeat clients=0 total=3
  * POST /internal/broadcast leave → {"ok":true} + log [broadcast] type=leave clients=0 total=4
  * GET /internal/stats (after) → totalBroadcasts=4
  * POST bad JSON → HTTP 400 + log [broadcast] invalid JSON: JSON Parse error: …
  * GET /unknown → HTTP 400 (correctly left for socket.io; not our route)
  * OPTIONS /health → HTTP 204
- End-to-end socket.io test with socket.io-client 4.8.3 (installed ad-hoc in /tmp/live-svc-test):
  * Client emits connect → server logs `[socket] client connected id=WMRvzJH1EqdmhiXJAAAB clients=1`.
  * Client receives 'welcome' {message, time}, 'analytics:history' (count=0 on first connect), 'pong' {time} after emitting 'ping', and 'analytics:event' {type:pageview,…} after the test POSTed to /internal/broadcast.
  * Server logs `[broadcast] type=pageview clients=1 total=1` and on client.close() logs `[socket] client disconnected id=… reason=client namespace disconnect clients=0`.
- Cleaned up: killed all stale `bun index.ts` background processes; port 3003 left free.

Stage Summary:
- Files created (all under /home/z/my-project/mini-services/live-service/):
  * package.json
  * tsconfig.json
  * index.ts
  * node_modules/ + bun.lock (after `bun install`)
- How to start it (background): `cd /home/z/my-project/mini-services/live-service && bun --hot index.ts` (or `bun run dev` — same thing). For a one-shot foreground run: `bun index.ts`.
- Startup log line: `[live-service] running on port 3003 (socket.io path=/, http endpoints: /internal/broadcast, /internal/stats, /health)`
- HTTP endpoints exposed on port 3003:
  * POST /internal/broadcast — body = AnalyticsEvent JSON; fans out to all dashboard clients as 'analytics:event'; returns {ok:true}.
  * GET /internal/stats → {connectedClients, totalBroadcasts, startedAt}.
  * GET /health → {ok:true, uptime}.
- socket.io events:
  * Server → client: 'welcome' (on connect), 'analytics:history' (on connect, newest-first array ≤100), 'analytics:event' (on each broadcast), 'pong' (in reply to client 'ping').
  * Client → server: 'ping' (custom).
- Frontend (Next.js dashboard) connection string: `io("/?XTransformPort=3003", { path: "/" })` — goes through Caddy.
- No issues remaining. TypeScript clean, all endpoints verified, end-to-end socket.io round-trip verified.

---
Task ID: 5
Agent: Main (orchestrator)
Task: Build complete dashboard frontend

Work Log:
- Set up RTL Arabic layout with Tajawal font + brand colors (#0D7C66 teal, #D4A853 gold, #FBF8F2 cream)
- Built DashboardHeader with logo, live active-visitor indicator, date range selector, theme toggle, refresh button
- Built KpiCard component with trend indicators (8 KPIs: visitors, pageviews, sessions, bounce rate, signups, generations, notes, referrals)
- Built TimeSeriesChart (Recharts area chart for visitors/pageviews over time)
- Built LiveFeed component (real-time event stream via WebSocket, shows pageviews + custom events)
- Built ActiveVisitors component (currently active sessions with country flags, device, duration)
- Built TopPages + TopSources (ranked lists with progress bars)
- Built DevicesBreakdown (tabs: devices/browsers/os/brands)
- Built GeoList (countries with flags + cities)
- Built EventsBreakdown (custom events: signup, generate, note, referral with icons)
- Built FunnelChart (visit → signup → generate → note → referral with drop-off rates)
- Built Campaigns (UTM campaigns/sources/mediums tabs)
- Built RecentActivity (unified feed of pageviews + events)
- Built SetupGuide (5 tabs: install script, Next.js integration, custom events, click tracking, UTM links)
- Created useAnalytics hook (fetches all stats, auto-refreshes every 30s + realtime every 10s)
- Created useLiveSocket hook (socket.io client connecting via Caddy gateway with XTransformPort=3003)
- Created format.ts utilities (Arabic number formatting, country flags, device/browser labels, event metadata, time-ago)
- Generated demo data via /api/seed-demo (243 sessions, 733 pageviews, 212 events across 7 days)

Stage Summary:
- Dashboard fully functional at http://localhost:3000 (and via gateway at :81)
- All KPIs show real numbers with period-over-period change %
- Live feed shows "متصل" (connected) — WebSocket works end-to-end through Caddy gateway
- All tabs (devices, campaigns, setup) tested and working
- Date range selector (today/7d/30d/all) tested and updates data
- VLM visual analysis confirms: professional, organized, brand colors consistent, charts visible, no visual issues
- Server daemonized via `setsid --fork` survives across Bash tool invocations

---
Task ID: 6
Agent: Main (orchestrator)
Task: Agent Browser verification

Work Log:
- Opened dashboard via gateway (http://localhost:81/) for WebSocket to route correctly through Caddy
- Verified page title: "صدى العقار — لوحة التحليلات اللحظية"
- Verified no console errors, no page errors
- Verified HMR + Fast Refresh working
- Verified live feed shows "متصل" (connected) status
- Tested date range selector: opens, shows 4 options (اليوم/7 أيام/30 يوم/كل الوقت), selection updates combobox
- Tested devices tab switching: "المتصفحات" shows كروم/سفاري/فيرفوكس/إيدج
- Tested campaigns tab switching: "المصادر" shows instagram/twitter/etc.
- Captured screenshots at multiple scroll positions
- VLM analysis confirms professional appearance with correct brand colors

Stage Summary:
- Dashboard passes end-to-end verification
- All interactive elements functional
- Ready for user preview

---
Task ID: 7
Agent: Main (orchestrator)
Task: Prepare project for Vercel deployment

Work Log:
- Created scripts/vercel-build.sh — swaps Prisma provider from sqlite to postgresql at build time, runs prisma generate + db push + next build
- Created vercel.json — configures Vercel to use the custom build script + bun install
- Updated src/app/api/track/route.ts:
  - Made notifyLiveService conditional (skips silently if no LIVE_SERVICE_URL env set)
  - Added ALLOWED_TRACKING_ORIGINS env var support for flexible CORS
- Updated src/hooks/use-live-socket.ts:
  - Supports NEXT_PUBLIC_LIVE_SERVICE_URL for production WebSocket service
  - Falls back to Caddy gateway (XTransformPort=3003) for local dev
  - Reduced reconnection attempts from 10 to 5
- Rewrote src/components/dashboard/live-feed.tsx:
  - Accepts polledEvents prop (from useAnalytics realtime.recentEvents)
  - Merges WebSocket events with polled events
  - Shows "متصل لحظياً" when WS connected, "تحديث كل 10ث" when polling fallback
- Updated src/app/page.tsx — passes realtime.recentEvents to LiveFeed
- Created .env.example with documentation of all env vars
- Updated .gitignore — properly excludes .env files but keeps .env.example
- Excludes /db/*.db and /mini-services/*/node_modules
- Created DEPLOY.md — comprehensive step-by-step deployment guide with 7 phases:
  1. Upload to GitHub
  2. Create Vercel Postgres database
  3. Deploy dashboard to Vercel
  4. Connect dashboard to tracked site
  5. Add custom event tracking (signup, generate, note, referral)
  6. UTM campaign tracking
  7. (Optional) Deploy WebSocket service on Render for instant updates
- Includes troubleshooting section + final checklist

Stage Summary:
- Project is now Vercel-ready
- Local preview still works with SQLite (provider stays sqlite locally)
- Vercel build automatically switches to Postgres
- WebSocket is optional — dashboard works perfectly with polling fallback
- All changes verified via Agent Browser: "تحديث كل 10ث" appears without WS, "متصل لحظياً" with WS
- Lint passes cleanly
