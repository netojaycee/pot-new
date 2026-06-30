# Status Tracker — Place of Treasure (pot-v2)

> Track bugs, missing features, and optimisations here. Mark items **[FIXED]** with date when resolved.
> Priority: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low / Nice-to-have

---

## 🔴 Critical Bugs

### BUG-001 — Stripe webhook does not update order status
- **Status:** ✅ Fixed 2026-06-14
- The payment service handlers (`handlePaymentSucceeded`, `handlePaymentFailed`) now correctly update order status in DB. The webhook route already calls these via `paymentService.verifyWebhookSignature()` — the issue was purely that `handlePaymentSucceeded` existed and worked but was not wired to email sending. Both are now confirmed connected.

---

### BUG-002 — No order confirmation email sent to customer
- **Status:** ✅ Fixed 2026-06-14
- Created `src/emails/orders/OrderConfirmationEmail.tsx` (full branded template with items, totals, address, gift details).
- Wired into `payment.service.ts → handlePaymentSucceeded` — fires fire-and-forget after payment confirmed.
- Also created `OrderStatusUpdateEmail.tsx` for processing/shipped/delivered/cancelled/failed transitions.
- `order.service.ts → updateOrderStatus` now fires `sendOrderStatusEmail` for all meaningful status changes.

---

### BUG-003 — No admin email / notification on new order
- **Status:** ✅ Fixed 2026-06-14
- Created `src/emails/orders/AdminNewOrderEmail.tsx` — full order summary with customer info, items, totals, delivery address, gift details, and "View & Process Order" CTA.
- Wired into `payment.service.ts → handlePaymentSucceeded` alongside the customer confirmation email.
- Admin email address controlled by `ADMIN_EMAIL` env var (falls back to `admin@{RESEND_DOMAIN}`).

---

## 🟠 High Priority

### BUG-004 — Admin role not enforced server-side on order status update
- **Status:** ✅ Fixed 2026-06-14
- `updateOrderStatusAction` now fetches the user from DB and checks `role === "admin"`. Returns `FORBIDDEN` if not admin.

---

### BUG-005 — Wrong revalidatePath in updateOrderStatusAction
- **File:** `src/lib/actions/order.actions.ts:401-402`
- **Issue:** Was revalidating `/admin/admin/orders` but actual routes are `/admin/orders` (route group `(admin)` is not part of the URL).
- **Status:** ✅ Fixed 2026-06-14

---

### BUG-006 — markNotificationAsRead updates before ownership check
- **Status:** ✅ Fixed 2026-06-14
- Now does `findUnique` first, verifies ownership, then updates. Returns `UNAUTHORIZED` if userId doesn't match.

---

### BUG-007 — Cloudinary image domain not in next.config.ts
- **File:** `next.config.ts`
- **Issue:** `remotePatterns` only included `images.unsplash.com`. Cloudinary product images would fail.
- **Status:** ✅ Fixed 2026-06-14

---

### BUG-008 — `force-dynamic` on home page disables static generation
- **Status:** ✅ Fixed 2026-06-14
- Replaced with `export const revalidate = 300` (ISR, regenerates every 5 minutes).

---

## 🟡 Medium Priority

### OPT-001 — No SEO metadata on individual pages
- **Issue:** `src/app/layout.tsx` has a generic site-wide metadata. No per-page `metadata` exports on product pages, category pages, or the landing page. Hurts Google ranking.
- **Fix needed:** Add `export const metadata: Metadata = { title, description, openGraph }` to key pages. For dynamic pages (product, category) use `generateMetadata()`.
- **Status:** ⏳ Open

---

### OPT-002 — No Google Analytics / structured data
- **Issue:** No GA4 tag, no JSON-LD structured data (Product schema, BreadcrumbList, Organization). Required for rich snippets and Google Shopping.
- **Fix needed:** Add GA4 via `next/script` in root layout. Add JSON-LD `<script type="application/ld+json">` to product pages.
- **Status:** ⏳ Open

---

### OPT-003 — No sitemap.xml or robots.txt
- **Issue:** No `src/app/sitemap.ts` or `src/app/robots.ts`. Bots can't crawl/discover pages efficiently.
- **Fix needed:** Create `src/app/sitemap.ts` (Next.js 13+ app router sitemap) listing all product and category pages. Create `src/app/robots.ts`.
- **Status:** ⏳ Open

---

### OPT-004 — Print and Send Email buttons commented out in admin order detail
- **File:** `src/app/(ui-pages)/(admin)/admin/orders/[orderId]/page.tsx`
- **Status:** ✅ Fixed 2026-06-30
- Print button calls `window.print()`. Send Email button calls `resendOrderConfirmationAction` (added to `order.actions.ts`) which fetches the order and fires `sendOrderConfirmationEmail`.

---

### OPT-005 — GiftForHerSection commented out on landing page
- **File:** `src/app/(ui-pages)/(user)/(landing)/page.tsx:27`
- **Issue:** `<GiftForHerSection />` is commented out.
- **Fix needed:** Implement or remove.
- **Status:** ⏳ Open

---

### OPT-006 — Footer contact info is placeholder data
- **File:** `src/lib/constants/footerLinks.ts`
- **Issue:** Address "123 Maple Lane London SE1 4TY", phone "+44 20 1234 5678", email "info@yourdomain.com" are all placeholder values.
- **Fix needed:** Update with real business address, phone (07832 813934), and email.
- **Status:** ✅ Fixed 2026-06-14 (phone updated; address/email still need real values)

---

### OPT-007 — Hero section is a static image, not a carousel
- **File:** `src/components/landing/HeroSection.tsx`
- **Issue:** Single static image with no autoplay carousel or advert strip.
- **Fix needed:** Replace with embla carousel (2+ slides) and yellow scrolling advert strip below.
- **Status:** ✅ Fixed 2026-06-14

---

### OPT-008 — Footer shows Twitter and LinkedIn (business only uses FB + IG)
- **Files:** `src/components/footer/DesktopFooter.tsx`, `src/components/footer/MobileFooter.tsx`
- **Issue:** Footer shows all four social icons including Twitter and LinkedIn which are not used.
- **Fix needed:** Remove Twitter and LinkedIn; update Facebook/Instagram to real URLs.
- **Status:** ✅ Fixed 2026-06-14

---

### OPT-009 — Newsletter subscription form is non-functional
- **Files:** `src/components/footer/DesktopFooter.tsx`, `src/components/footer/MobileFooter.tsx`
- **Issue:** `handleSubmit` only `console.log`s the email. No server action or email list integration.
- **Fix needed:** Create a server action to store subscriber email in DB or send to Resend audience/Mailchimp.
- **Status:** ⏳ Open

---

### OPT-010 — Stripe receipt email uses `receipt_email` but not custom template
- **File:** `src/lib/services/payment.service.ts:73`
- **Issue:** Stripe sends its own default receipt via `receipt_email`. This is separate from BUG-002. The two should be coordinated — either use Stripe receipts OR our own template, not both.
- **Status:** ⏳ Open (depends on BUG-002 fix)

---

## 🟢 Nice to Have

### NFT-001 — Add `framer-motion` for hero slide animations
- **Issue:** pot-v1 used framer-motion for slide-in text animations. Current hero uses CSS transitions only.
- **Fix:** `pnpm add framer-motion` and add motion variants to hero slide text.
- **Status:** ⏳ Open

---

### NFT-002 — Add `embla-carousel-autoplay` plugin
- **Issue:** Hero uses manual `setInterval` for autoplay. Official `embla-carousel-autoplay` is cleaner.
- **Fix:** `pnpm add embla-carousel-autoplay` and pass as plugin to `<Carousel plugins={[Autoplay({ delay: 5000 })]}>`.
- **Status:** ⏳ Open

---

### NFT-003 — Stripe webhook path comment inconsistency
- **File:** `src/lib/actions/payment.actions.ts:83` and `src/app/api/v1/webhooks/route.ts`
- **Issue:** Comment says endpoint is `/api/v1/webhooks/stripe` but the actual route is `/api/v1/webhooks`.
- **Fix:** Update comments to match actual path.
- **Status:** ⏳ Open

---

### NFT-004 — `console.log` in footer newsletter submit
- **File:** `src/components/footer/DesktopFooter.tsx:23`, `MobileFooter.tsx`
- **Fix:** Remove before production.
- **Status:** ⏳ Open

---

---

## 🟡 Security — Fixed 2026-06-14

### SEC-001 — No admin route protection server-side ✅ Fixed
- Created `src/middleware.ts` (Edge Runtime JWT check).
- `/admin/*` now requires valid session with `role === "admin"`. Unauthenticated → redirect to `/auth/login`. Non-admin → redirect to `/`.

### SEC-002 — No rate limiting on auth endpoints ✅ Fixed
- Created `src/lib/rate-limit.ts` (Redis sliding window).
- Applied to: `registerAction` (10/IP/hour), `loginAction` (5/email/15min).
- `otpRequestRateLimit` and `otpVerifyRateLimit` helpers available for wiring to OTP actions.

### SEC-003 — Missing security headers ✅ Fixed
- `next.config.ts` now sets CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS (production only).
- Middleware also sets the same headers on every response.

### SEC-004 — `checkoutAction(input: any)` — unsafe type ✅ Fixed
- Changed to `checkoutAction(input: CheckoutFormInput)` using the Zod schema type.

---

## 🟡 Admin Dashboard Fixes — 2026-06-30

### ADMIN-001 — Wrong back links in order detail page ✅ Fixed
- `href="/admin/admin/orders"` → `href="/admin/orders"` (route group `(admin)` is not part of the URL).

### ADMIN-002 — Promo codes page not fetching data ✅ Fixed
- `fetchPromoCodes` was a stub with a TODO comment. Now calls `getPromoCodesAction`.
- `handleDelete` now calls `deletePromoCodeAction` and removes item from local state.
- `handleToggleActive` now calls `updatePromoCodeAction({ active: !current })` and updates local state.
- Added toggle Power button to the actions column in the table.

### ADMIN-003 — Customers page promote-to-admin was a stub ✅ Fixed
- Added `promoteToAdminAction` to `user.actions.ts` (verifies requester is admin, then updates role).
- `handlePromoteToAdmin` now calls the action and updates local state on success.

### ADMIN-004 — Inventory page Low Stock filter not applied ✅ Fixed
- `filterLowStock` state was toggled but the rendered list was not filtered.
- Added `displayedItems` derived variable; table now renders `displayedItems` instead of `items`.

### ADMIN-005 — `failed` order status missing from order detail page ✅ Fixed
- Added `failed` to the `OrderDetails.status` type and `statusConfig` map.
- Added `failed` option to the status update dropdown.

---

## 🟡 Features — Added 2026-06-14

### FEAT-001 — Semantic / full-text product search ✅ Done
- `search.service.ts` upgraded to three-tier search:
  1. **Vector similarity** (pgvector + OpenAI embeddings) — activated when `OPENAI_API_KEY` is set
  2. **PostgreSQL full-text search** (tsvector, stemming, relevance ranking) — always available, huge improvement over LIKE
  3. **Basic LIKE fallback** — last resort
- Migration at `prisma/migrations/20260614_add_pgvector/migration.sql` — run on DB to enable pgvector + FTS index.
- `generateProductEmbeddings()` function ready for when `OPENAI_API_KEY` is configured.
- New env var: `OPENAI_API_KEY` (optional — only needed for vector search tier)

### FEAT-002 — Reviews restricted to verified purchasers ✅ Done
- `reviewService.createReview()` now checks `OrderItem` for the user + product with status in `[paid, processing, shipped, delivered]`.
- Returns `NOT_PURCHASED` error if user hasn't ordered the product.

### FEAT-003 — Review reminder modal ✅ Done
- `ReviewReminderModal` in `src/components/product/ReviewReminderModal.tsx`.
- Shows 2.5s after page load if logged-in user has unreviewed ordered products.
- 24-hour LocalStorage cooldown after dismiss.
- Wired into user layout (`src/app/(ui-pages)/(user)/layout.tsx`).

### FEAT-004 — Returns UI disabled (kept in code, not accessible) ✅ Done
- Admin returns page replaced with "not yet active" placeholder.
- All return service/actions/schema preserved for future use.
- Re-enable by restoring the full admin component from git history.

---

## Stripe Checklist (Before Production)

- [ ] Switch from Stripe test keys to live keys
- [ ] Register webhook endpoint with live Stripe dashboard
- [ ] Confirm `STRIPE_WEBHOOK_SECRET` matches live endpoint secret
- [ ] Test full payment flow end-to-end in test mode first
- [ ] Enable Stripe Radar for fraud detection
- [ ] Set up Stripe Tax if needed (currently manual VAT calc)

---

## SEO / Performance Checklist (Before Launch)

- [ ] Fix BUG-008 (`force-dynamic` on home page)
- [ ] Add per-page metadata (OPT-001)
- [ ] Add Google Analytics GA4 (OPT-002)
- [ ] Add JSON-LD structured data on product pages (OPT-002)
- [ ] Create sitemap.xml and robots.txt (OPT-003)
- [ ] Audit Core Web Vitals with Lighthouse
- [ ] Ensure all images have explicit `width`/`height` or `fill` + proper `sizes` prop
- [ ] Remove `console.log` statements throughout codebase
- [ ] Add `<html lang="en">` (already present in layout.tsx ✅)
- [ ] Semantic HTML audit (h1 per page, proper landmarks)
