# Place of Treasure (pot-v2) — Architecture Reference

> Last updated: 2026-06-14. Update this file as the codebase changes.

---

## Quick Start

| Item | Value |
|------|-------|
| Stack | Next.js 16, React 19, TypeScript, Prisma 7, Tailwind v4, Zod v4 |
| Database | PostgreSQL via `@prisma/adapter-pg` |
| Cache | Upstash Redis (users, products, categories, reviews, orders, notifications) |
| Package manager | pnpm |
| Dev command | `pnpm dev` → `http://localhost:3000` |
| UI Components | shadcn/ui (Radix primitives + CVA) |
| Forms | react-hook-form + zod |
| State | Zustand (UI state only) + React Query (server state) |
| Email | Resend + React Email templates |
| Payments | Stripe (PaymentIntents) |
| Images | Cloudinary + next-cloudinary |
| Auth | JWT (jose) in HTTP-only cookie, OTP via Resend |

---

## Architecture: Three-Layer Pattern

```
Page / Client Component
    ↓ calls
Server Action  (src/lib/actions/*.actions.ts)
    ↓ calls
Service Layer  (src/lib/services/*.service.ts)  +  Cache (Redis)
    ↓ accesses
Database (Prisma)
```

**Rules:**
- Zero business logic in pages or server actions — services own it all.
- Server actions orchestrate: call service → invalidate cache → return typed result.
- No REST API routes (except Google OAuth callback + Stripe webhook).
- All inputs validated with Zod at service layer.
- Services return `{ success: true; data: T } | { success: false; error: string; code: string }` — never throw.
- Client uses React Query for server state and Zustand only for UI state (drawers, modals).

---

## File Structure

```
src/
  app/
    api/v1/
      auth/google/           Google OAuth callback routes
      webhooks/route.ts      Stripe webhook POST handler
    (ui-pages)/
      (admin)/admin/         Admin panel pages
      (user)/                Storefront pages (landing, auth, cart, checkout, orders…)
  components/
    admin/                   Admin-specific components + forms
    auth/                    Login, register, OTP forms
    cart/                    Cart drawer + items
    checkout/                Checkout form + address selector
    footer/                  DesktopFooter + MobileFooter
    header/                  Header + UserActions + Cart icon
    landing/                 Hero, BestSelling, Testimonial, Essentials, Inspiration
    orders/                  OrderCard, OrderTimeline, OrdersTabView
    product/                 ProductList, ProductCard
    ui/                      shadcn primitives (button, card, carousel, dialog…)
    providers/               QueryClientProvider, SessionProvider
  emails/
    auth/                    Welcome, OtpEmail, PasswordReset, AccountCreated…
    (missing: order emails)  ⚠ No order confirmation email template yet
  hooks/                     React Query hooks (use-cart, use-wishlist…)
  lib/
    actions/                 Server actions (auth, cart, order, product, category…)
    services/                Business logic (auth, cart, order, payment, product…)
    schema/                  Zod schemas shared between actions/services
    types/                   TypeScript type definitions
    constants/               footerLinks, testimonials, nav items
    hooks/                   lib-level hooks
    auth.ts                  JWT session management
    db.ts                    Prisma singleton
    email.ts                 Resend helper + sendEmail()
    redis.ts                 Upstash Redis client
    utils.ts                 cn() and misc helpers
  stores/                    Zustand stores (cart-store, ui-store)
prisma/
  schema.prisma              Single source of truth for data model
  migrations/                Auto-generated migration history
  seed.ts                    DB seed script
```

---

## Key Source Files

| Purpose | Path |
|---------|------|
| JWT session | `src/lib/auth.ts` |
| Prisma client | `src/lib/db.ts` |
| Redis client | `src/lib/redis.ts` |
| Email sender | `src/lib/email.ts` |
| Auth service | `src/lib/services/auth.service.ts` |
| Cart service | `src/lib/services/cart.service.ts` |
| Order service | `src/lib/services/order.service.ts` |
| Payment service | `src/lib/services/payment.service.ts` |
| Notification service | `src/lib/services/notification.service.ts` |
| Stripe webhook | `src/app/api/v1/webhooks/route.ts` |
| Checkout flow | `src/lib/actions/order.actions.ts` → `checkoutAction` |
| Admin order page | `src/app/(ui-pages)/(admin)/admin/orders/[orderId]/page.tsx` |
| Landing page | `src/app/(ui-pages)/(user)/(landing)/page.tsx` |

---

## Data Model Summary

```
User         → Cart, Wishlist, Orders, Addresses, Reviews, Otps, Notifications, Returns
Category     → subcategory tree (parentId), Products
Product      → images (Json[]), categories, reviews, cartItems, orderItems, wishlistItems
              → GiftBoxItem (for giftbox type products — self-referential junction)
Order        → OrderItem[], Payment, PromoCode, User(optional), guestSessionId(optional)
Cart         → CartItem[] — linked to userId OR sessionId (guest)
Wishlist     → WishlistItem[]
Payment      → linked to Order + Stripe paymentIntentId
PromoCode    → percent | fixed, usageLimit, expiresAt
Otp          → typed: email_verification | password_reset | change_password | change_email
Notification → typed: order_confirmed | order_shipped | payment_failed | admin_alert…
Return       → linked to Order + User
```

**Enums:** `Role (user|admin)`, `OrderStatus (pending|paid|processing|shipped|delivered|cancelled|failed)`, `ProductType (item|food|giftbox)`

---

## Authentication Flow

1. **Register** → `authService.register()` creates user + OTP → sends OTP email via Resend
2. **OTP verify** → marks `verified: true` + merges guest cart/orders + creates JWT session cookie
3. **Login** → creates JWT session cookie + caches user in Redis (`user:{id}`)
4. **Google OAuth** → `/api/v1/auth/google` → callback → `googleOAuthService.handleCallback()`
5. **Session** → `getSession()` in `lib/auth.ts` → returns `{ userId }` (auth) or `{ sessionId, isGuest: true }` (guest)
6. **Guest** → sessionId created **on first meaningful action** (add to cart, checkout) — not on page load

---

## Order / Checkout Flow

```
1. User fills checkout form
2. checkoutAction() validates form, gets cart from DB
3. orderService.createOrder() creates Order (status: "pending") + OrderItems
4. paymentService.createPaymentIntent() creates Stripe PaymentIntent
5. cartService.clearCart() clears the cart
6. Client receives { orderId, clientSecret } → renders Stripe Elements
7. User submits payment → Stripe processes
8. Stripe sends webhook to /api/v1/webhooks → should update order status ⚠ (see status.md)
9. User lands on /order-confirmation
```

**Tax:** UK 20% VAT, US 0%, Canada 5%, Australia 10% (calculated in order.service.ts)
**Shipping:** Free over £50; UK £4.99, US $9.99, Canada $7.99, Australia $14.99

---

## Redis Cache Keys

| Key | Value | TTL |
|-----|-------|-----|
| `user:{id}` | User details | 1 hour |
| `product:{id}` | Product data | 1 hour |
| `categories` | All categories | 1 hour |
| `product:{id}:reviews` | Reviews for product | 1 hour |
| `orders:user:{id}` | User orders list | 30 min |
| `notifications:unread_count:{id}` | Unread badge count | 5 min |

Always use cache-aside: check Redis → miss → fetch DB → set Redis → return.

---

## Email System

- **Provider:** Resend (`src/lib/email.ts`)
- **Sender:** `Place of Treasure <pot-shop@{RESEND_DOMAIN}>`
- **Templates:** React Email components in `src/emails/`
- **Auth templates:** Welcome, OTP, PasswordReset, PasswordChangeConfirmation, AccountCreated, EmailChangeVerification
- **Order templates:** OrderConfirmationEmail (customer receipt), OrderStatusUpdateEmail (processing/shipped/delivered/cancelled/failed), AdminNewOrderEmail (admin alert on every paid order)
- Admin alert recipient: `ADMIN_EMAIL` env var

---

## Admin Panel

- Route prefix: `/admin/admin/*` (double `admin` — route group + segment)
- Auth: Sidebar only renders for authenticated users, but **admin role not enforced server-side** on all actions ⚠
- Features: Dashboard analytics, Products CRUD, Categories CRUD, Orders (view + status update), Customers, Inventory, Promo Codes, Returns
- Order fulfillment: Admin can view order details and change status via dropdown dialog

---

## Environment Variables

```env
# Auth
JWT_SECRET=
SESSION_COOKIE_NAME=pot_session

# Database
DATABASE_URL=postgresql://user:pass@host/dbname

# Cache
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Email
RESEND_API_KEY=re_xxx
RESEND_DOMAIN=placeoftreasure.co.uk       # domain part — sender: noreply@placeoftreasure.co.uk
ADMIN_EMAIL=orders@placeoftreasure.co.uk  # receives new-order alerts

# Stripe
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx     # from Stripe CLI / Dashboard

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Important Conventions

1. **No business logic in server actions** — they orchestrate services and handle side-effects only.
2. **Always use `getSession()`** before any auth-gated operation.
3. **Cache invalidation after every mutation** — call `redis.del(key)` immediately after DB write.
4. **Guest vs user** — always check `sessionId` fallback when `userId` is absent.
5. **Typed results** — services return `{ success, data }` or `{ success, error, code }`, never throw.
6. **Async email** — fire-and-forget, never block the main response on email delivery.
7. **OTPs** — 4-char alphanumeric, 10-minute expiry, stored in `Otp` table.
8. **Product images** — stored as JSON `{ url, pubId }` array in `Product.images`.

---

## Stripe Webhook Setup

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://yourdomain.com/api/v1/webhooks`
3. Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET` env var
5. Local testing: `stripe listen --forward-to localhost:3000/api/v1/webhooks`

---

## Known Issues / See status.md

See `status.md` for a tracked list of bugs, missing features, and optimisation items.
