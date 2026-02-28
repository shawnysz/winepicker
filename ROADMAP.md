# WinePicker — Future Development Roadmap

## Context

WinePicker is a Burgundy wine collection manager built with Next.js 16, SQLite/Drizzle, shadcn/ui, and Claude Vision API. It already has a solid feature set (search, cellar tracking, price history, label scanning, comparison, analytics, PWA). This roadmap addresses current technical debt, expands features, and charts a path from personal tool to community platform.

---

## Phase 1: Polish & Stability

_Goal: Fix fragile patterns, improve UX robustness, lay a quality foundation._

### 1.1 Fix N+1 Query Patterns — Medium
Every API route that returns wine data runs a separate price query per wine. Replace with batch fetching (single query for all wineIds, build a Map in JS).
- `src/app/api/wines/route.ts`
- `src/app/api/cellar/route.ts`
- `src/app/api/cellar/export/route.ts`
- `src/app/api/cellar/alerts/route.ts`
- `src/app/api/wines/similar/route.ts`

### 1.2 Add Database Indexes — Small
Add indexes on frequently queried columns. Biggest win: `price_snapshots(wine_id, vintage, fetched_at DESC)`.
- `src/lib/db/schema.ts` — add index definitions
- Run `drizzle-kit generate` for migration

### 1.3 Input Validation with Zod — Medium
The cellar PUT handler passes raw user input to `.set(updates)` — security risk. Add Zod schemas for all API inputs.
- New: `src/lib/validators.ts`
- Update all API route handlers to validate before DB operations
- Add client-side validation to dialog forms

### 1.4 Error Boundaries & Toast Notifications — Medium
No user feedback on success/failure. Delete actions have no confirmation.
- Install `sonner` for toasts, add `<Toaster />` to layout
- New: `src/components/error-boundary.tsx`
- Add confirmation dialog for destructive actions (delete in cellar-table)
- Replace all `console.error` with `toast.error()`

### 1.5 Pagination on Wine Search — Small
Search can return all 217+ wines with no limit. Add `page`/`pageSize` params to `/api/wines`, pagination controls to the results grid.
- `src/app/api/wines/route.ts` — add limit/offset
- `src/app/page.tsx` — add pagination UI

### 1.6 Client-Side Caching with SWR — Medium
Every navigation triggers fresh fetches. Install `swr`, create hooks (`use-cellar`, `use-wines`, `use-prices`), replace manual fetch/useEffect patterns.
- New: `src/lib/hooks/use-cellar.ts`, `use-wines.ts`, `use-prices.ts`
- Refactor cellar page, wine detail page, home page

### 1.7 Mobile-Responsive Tables — Small
Cellar table (9 columns) overflows on mobile. Use card layout on small screens, hide secondary columns with `hidden md:table-cell`.
- `src/components/cellar-table.tsx`
- `src/app/compare/page.tsx`

### 1.8 Harden Wine-Searcher Scraper — Medium
Current scraper scans all DOM elements for `$` patterns — fragile and slow. Target specific selectors, add rate limiting, retry with backoff, return stale cache on failure.
- `src/lib/scraper/wine-searcher.ts`

### 1.9 Test Foundation — Medium
No tests exist. Install Vitest, start with unit tests for pure functions (`getDrinkWindow`, Zod validators), then API route integration tests.
- New: `vitest.config.ts`
- New: `src/lib/__tests__/drink-window.test.ts`
- New: `src/app/api/__tests__/cellar.test.ts`
- Add `"test": "vitest"` to package.json

**Recommended order:** 1.2 + 1.3 + 1.4 first (quick wins, security fix), then 1.1, 1.7, 1.5, 1.6, 1.8, 1.9.

---

## Phase 2: Feature Expansion

_Goal: Add high-value features that make the app significantly more useful._

### 2.1 Wishlist — Medium
New `wishlist_items` table (wineId, vintage, targetPrice, priority, notes, status). Wishlist page with target price alerts. "Add to Wishlist" button alongside "Add to Cellar" on search results and wine detail.
- Schema change: new table
- New: `src/app/wishlist/page.tsx`, `src/app/api/wishlist/route.ts`
- New: `src/components/add-to-wishlist-dialog.tsx`, `wishlist-table.tsx`
- Update: header-nav, home page, wine detail page

### 2.2 AI Sommelier Chat — Large
Conversational wine assistant using Claude API with tool use. Claude can search wines, check prices, query cellar, calculate drink windows. Streaming responses.
- Schema change: `chat_messages` table
- New: `src/app/chat/page.tsx`, `src/app/api/chat/route.ts`
- New: `src/lib/chat/system-prompt.ts`, `src/lib/chat/tools.ts`
- New: `src/components/chat-interface.tsx`
- Uses existing `@anthropic-ai/sdk` dependency

### 2.3 Enhanced Analytics Dashboard — Medium
Dedicated analytics page with: top performers (% gain), vintage distribution histogram, red vs white allocation, drink window alerts (wines approaching peak), purchase timeline, price volatility.
- New: `src/app/analytics/page.tsx`
- Extend: `src/app/api/cellar/stats/route.ts`
- New: `src/components/analytics-cards.tsx`

### 2.4 Tasting Journal — Small
Structured tasting notes (appearance, nose, palate, finish, score, occasion, food pairing). Multiple entries per wine over time. Timeline view.
- Schema change: `tasting_journal` table
- New: `src/app/journal/page.tsx`, `src/app/api/journal/route.ts`
- New: `src/components/tasting-note-form.tsx`, `tasting-note-card.tsx`

### 2.5 Improved Label Scanner — Medium
After Claude Vision extracts label data, fuzzy-match against the wines DB. Present top matches with confidence. One-tap "add to cellar" with pre-filled vintage.
- Update: `src/lib/vision/label-reader.ts`, `src/app/api/scan/route.ts`, `src/app/scan/page.tsx`

---

## Phase 3: Scale & Grow

_Goal: Remove limitations, add auth, prepare for real deployment._

### 3.1 Multi-Region Wine Support — Large
Expand beyond Burgundy. Add `country`, `wineRegion`, `grapeVarieties` columns to wines. New `wine_regions` reference table. Generalize drink window logic (currently Burgundy-specific classifications). Start with Bordeaux and Champagne seed data.
- Schema change: new columns + table
- New: `src/data/bordeaux-wines.json`, `src/data/champagne-wines.json`
- Update: search filters, wine cards, drink-window logic, similar wines matching

### 3.2 Authentication (NextAuth.js) — Large
Add `users` and `sessions` tables. Google OAuth + email/password. Add `userId` FK to cellar_items, wishlist_items, chat_messages, tasting_journal. Auth middleware on all personal data routes. Migration path for existing data.
- Schema change: users, sessions tables + userId columns
- New: `src/lib/auth.ts`, `src/app/login/page.tsx`, `src/components/user-menu.tsx`
- Update: all API routes with auth checks

### 3.3 Migrate to Hosted DB (Turso/LibSQL) — Medium
Swap `better-sqlite3` (local file) for `@libsql/client` (hosted SQLite-compatible). Mostly a driver swap — Drizzle ORM supports both. Add `await` to all query calls.
- Update: `src/lib/db/index.ts`, `drizzle.config.ts`, `package.json`
- Add: `.env.local` with DATABASE_URL

### 3.4 Price API Integration — Medium
Abstract pricing behind a provider interface. Add Wine-Searcher API (paid), Vivino as secondary source, fallback chain (API -> scraper -> cache).
- New: `src/lib/pricing/provider.ts`, `wine-searcher-api.ts`, `vivino.ts`, `fallback-chain.ts`
- Refactor: existing scraper becomes one implementation

### 3.5 Deploy to Vercel — Medium
With hosted DB and auth in place, deploy to production. Configure env vars, verify PWA on production domain, set up Vercel Cron for scheduled price refreshes.

**Order:** 3.1 -> 3.2 -> 3.3 -> 3.4/3.5

---

## Phase 4: Social & Community

_Goal: Transform from personal tool to community platform._

### 4.1 Public Profiles & Collection Sharing — Medium
Users can make cellars public or generate share links. Read-only collection view for visitors.
- Schema change: username/bio on users, `collection_shares` table
- New: `src/app/u/[username]/page.tsx`, `src/app/share/[token]/page.tsx`

### 4.2 Community Reviews & Ratings — Large
User reviews per wine/vintage with ratings (1-100), likes. Aggregate community score displayed on wine cards.
- Schema change: `reviews`, `review_likes` tables
- New: review form, review list, community score badge on wine detail pages

### 4.3 Wine Marketplace — Large
Peer-to-peer listings from cellar items. Browse/filter listings, make offers. No payment processing — just facilitates connection between buyers and sellers.
- Schema change: `listings`, `offers` tables
- New: marketplace page, listing cards, offer flow

### 4.4 Notifications System — Medium
Unified notifications for price alerts, wishlist matches, marketplace offers, drink window reminders. Bell icon with unread count in header.
- Schema change: `notifications` table
- New: notification bell component, notifications dropdown
- Background job for generating notifications

---

## Dependency Graph

```
Phase 1 items are mostly independent — start anywhere
Phase 2 items are independent of each other, depend on Phase 1 foundation
Phase 3 is sequential: 3.1 -> 3.2 -> 3.3 -> 3.5 (3.4 independent after 1.8)
Phase 4 all requires 3.2 (auth): 4.1 -> 4.2, 4.3 -> 4.4
```

## Verification

After each phase:
- `npm run build` — no build errors
- `npm run lint` — no lint errors
- `npm run dev` — manual smoke test of all pages
- `npm run test` — all tests pass (after 1.9)
- Test on mobile viewport (after 1.7)
- Test dark/light mode on all new pages
