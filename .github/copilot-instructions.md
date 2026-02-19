# AI Agent Instructions for Pot-v2

## Quick Start
- **Stack**: Next.js 16, React 19, TypeScript, Prisma, TailwindCSS, Zod
- **Database**: PostgreSQL with Prisma (adapter: `@prisma/adapter-pg`)
- **Caching**: Upstash Redis (user details, products, categories, reviews)
- **Package Manager**: pnpm
- **Dev Command**: `pnpm dev` (runs on port 3000)
- **Architecture**: Server Actions + Services (NO API routes) + React Query + Zustand

---

## Architecture Overview

### Core Pattern: Server Actions + Services Only
The app uses a **three-layer architecture** (zero API routes):

```
UI Component (Form/Server or Client)
    ↓ calls
Server Action (auth.actions.ts, cart.actions.ts, etc.)
    ↓ calls
Service Layer (auth.service.ts, cart.service.ts, etc.) + Cache Layer (Redis)
    ↓ accesses
Database (Prisma)
```

**Why this pattern?**
- Single source of truth for business logic (services)
- Type-safe internal communication (no HTTP layer)
- Caching at service layer (Redis for frequently accessed data)
- Server-side by default (better security, less client-side logic)
- Performance optimized: cache user/products/categories/reviews
- Minimal resource overhead (no REST HTTP parsing)
- Immediate UI updates with React Query (client-side state) when needed

### Key Files to Know
- `src/lib/auth.ts`: JWT encryption/decryption, session management, guest auto-creation
- `src/lib/db.ts`: Prisma client singleton with PrismaPg adapter
- `src/lib/redis.ts`: Upstash Redis client for caching layer
- `src/services/auth.service.ts`: All auth business logic (register, login, OTP, merge guest orders)
- `src/services/cart.service.ts`: Cart logic (add/remove, guest→user merge)
- `src/app/actions/auth.actions.ts`: Server actions that orchestrate services + cache invalidation
- `src/app/actions/cart.actions.ts`: Cart operations as server actions
- `src/hooks/use-cart.ts`: React Query hooks for client-side optimistic updates (header badge)
- `src/stores/cart.store.ts`: Zustand for cart UI state (drawer open/close)
- `prisma/schema.prisma`: Single source of truth for data model

---

## Critical Data Flows

### User Authentication (Register → Verify → Login)
1. **RegisterForm** (client) → `registerAction` (server action)
2. Action calls `authService.register()` → creates user, generates OTP, sends email
3. Returns `{ success: true, userId }` to client
4. Client shows "Check email for OTP" toast
5. **OtpVerificationForm** → `verifyEmailOtpAction` → marks user as `verified: true`
   - **Guest order merge**: If guest placed orders with this email, auto-merge to user account
   - **Guest cart merge**: If guest sessionId exists, merge cart items (add new products, increase qty if exists)
6. **LoginForm** → `loginAction` → creates JWT session cookie + caches user details in Redis
7. All authenticated endpoints now have access via `getSession()`

### Guest → User Journey
- Guest sessionId created **on first meaningful action** (add to cart, checkout, etc.) — not on page load
- Guest can browse anonymously, then sessionId created when needed
- Guest can add to cart, place order (with email) — cart linked to sessionId
- On registration with same email:
  - Previous orders auto-associated with new user account
  - Guest cart merged: new products added, existing products increase quantity
  - Guest sessionId invalidated
- On login with existing account + guest sessionId:
  - Guest cart merged to user cart
  - Guest sessionId cleared

### Cart Management (Server Actions)
- **All cart operations via server actions** (no API routes)
- Cart stored in DB, linked to `userId` (authenticated) or `sessionId` (guest)
- Cart merge logic: `addItem(productId, qty)` → check if product exists, add new or increment qty
- Client-side header badge updates via React Query (optimistic updates) for immediate feedback
- Zustand cart store handles drawer open/close state only
- Cart persists across sessions (DB-backed, not localStorage)

### Product/Category/Review Operations (Server Actions)
- Admin CRUD (create, update, delete) → server actions only
- User read operations cached in Redis: products, categories, reviews
- Cache invalidation: When admin updates price/stock/details → invalidate product cache
- Client fetch with React Query: `useProducts()`, `useCategories()`, `useReviews()`

### Order Flow
1. Checkout form collects shipping address, applies promo codes
2. `checkoutAction` creates Order with status "pending"
3. Stripe integration creates PaymentIntent
4. Webhook updates order status → "paid" or "failed"
5. Order confirmation email sent via Resend
6. User order cache invalidated (if cached)

---

## Project-Specific Patterns

### Session Handling (User vs Guest)
```typescript
// Get existing session (returns null if no session yet)
const session = await getSession();

if (session && "userId" in session) {
  // Authenticated user
  const user = await getUser(session.userId); // Fetches from Redis cache
} else if (session && session.isGuest) {
  // Guest session exists - use sessionId for cart/wishlist
  const cart = await cartService.getCart(session.sessionId);
} else if (!session) {
  // No session yet - guest browsing anonymously
  // sessionId created only on first action (add to cart, etc.)
}
```
- Sessions use HTTP-only JWT cookies (7-day expiry)
- Guests create sessionId only on **first major action** (add to cart, checkout, etc.)
- Cart/wishlist/orders work with both `userId` and `sessionId`
- Keeps cookie overhead low for browsers that never convert

### Redis Caching Strategy
**Cached Objects:**
- User details (firstName, lastName, email, verified status, role)
- Products (name, price, stock, images, ratings)
- Categories (name, hierarchy, type)
- Reviews (rating, message, user info)

**Cache TTL:** 1 hour (reasonable for ecommerce, balance between freshness and performance)

**Cache Invalidation:**
```typescript
// When admin updates price or product details
await adminService.updateProduct(productId, updates);
await invalidateCache(`product:${productId}`); // Immediate invalidation

// On user logout
await deleteUserCache(userId);

// On cart operations (to keep user's order history fresh)
await invalidateCache(`user:${userId}:orders`);
```

**Caching Implementation:**
- User cache key: `user:{userId}` 
- Product cache key: `product:{productId}`
- Category cache key: `categories`
- Reviews cache key: `product:{productId}:reviews`
- Always cache-aside pattern: check Redis → miss → fetch from DB → set Redis

### Service Layer Pattern
All services follow this structure:
```typescript
export type AuthResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code: string };

// Usage in service:
const result = await authService.register(input);
if (!result.success) return { success: false, error: result.error };
return { success: true, data: result.data };
```

### OTP Types
Project uses typed OTPs: `"email_verification" | "password_reset" | "change_password" | "change_email"`
- Always 4 alphanumeric characters, 10-minute expiry
- Sent via Resend using React Email templates (`src/emails/`)
- Stored in `Otp` table (not ephemeral)

### Product Types
Enum: `ProductType = "item" | "food" | "giftbox"`
- `giftbox` products use `GiftBoxItem` junction table (self-referential)
- Categories also have `type` field + parent/child hierarchy

---

## Common Tasks & Workflows

### Adding a New Server Action
1. Create service method in `src/services/{feature}.service.ts`
2. Create server action in `src/app/actions/{feature}.actions.ts`
3. Inside action:
   - Call service layer
   - If modifying data that's cached, use `invalidateCache()` immediately
   - If auth-required, call `getSession()` first
   - If action needs guest tracking (cart, orders), call `getOrCreateGuestSession()` to ensure sessionId exists
   - Set cookies if needed (see `setSessionCookie` in auth.actions.ts)
4. Return typed result: `{ success: boolean; error?: string; data?: T }`

### Adding a New Read Operation (with Caching)
1. In service, check Redis cache first:
```typescript
// In service layer
const cached = await redis.get(`product:${productId}`);
if (cached) return JSON.parse(cached);

// Cache miss - fetch from DB
const product = await prisma.product.findUnique({ where: { id: productId } });
await redis.setex(`product:${productId}`, 3600, JSON.stringify(product)); // 1 hour TTL
return product;
```
2. Create server action that calls service
3. If client needs optimistic updates, use React Query with `useQuery`

### Client-Side Updates (Cart Badge Example)
```typescript
// Header component with React Query for immediate feedback
export function CartBadge() {
  const { data: cart } = useCart(); // React Query caches this
  
  return <span className="badge">{cart?.items.length}</span>;
}

// Add to cart triggers mutation + optimistic update
export function AddToCartButton() {
  const mutation = useAddToCart();
  
  const handleAdd = async () => {
    // React Query automatically invalidates useCart() query
    await mutation.mutateAsync({ productId, quantity: 1 });
  };
}
```

### Modifying Database Schema
1. Edit `prisma/schema.prisma`
2. Run `pnpm exec prisma migrate dev --name {description}`
3. Prisma auto-generates client in `prisma/generated/`
4. Restart dev server

### Styling & Components
- Tailwind v4 with custom animations (`tw-animate-css`)
- UI components in `src/components/ui/` (Radix UI primitives with CVA variants)
- Use `clsx` for conditional classes, `tailwind-merge` for conflicts
- Forms use `react-hook-form` + `zod` validation

### Error Handling
- Service layer returns typed `AuthResult<T>` (never throws)
- Action layer catches and converts to user-friendly messages
- Client uses Sonner for toasts: `toast.error()`, `toast.success()`

---

## Environment Variables Required
```env
# Auth
JWT_SECRET=                    # Generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
SESSION_COOKIE_NAME=pot_session

# Database
DATABASE_URL=postgresql://user:pass@host/dbname

# Email (Resend)
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@pot-shop.com

# Optional: Stripe, Cloudinary, Google OAuth (see docs/ENV_SETUP.md)
```

---

## Important Conventions

1. **No API routes at all** - All operations are server actions + services (no `/api/*` routes)
2. **Always use Prisma types** - Import from `@prisma/client`
3. **Session ID as fallback** - When no user, use `sessionId` for cart/wishlist
4. **Cache invalidation** - After mutations, call `invalidateCache()` to ensure freshness
5. **Type safety first** - Use Zod schemas for all inputs (see `auth.service.ts`)
6. **Async email** - OTP emails are fire-and-forget; don't block on send
7. **Server by default, client when needed** - Optimize for performance (fast page loads, minimal JS)
8. **Cart merge logic** - Add products that don't exist, increase qty if product exists
9. **Logout clears cache** - Always call `deleteUserCache(userId)` on logout

---

## Debugging Tips

- **Session issues?** Check `lib/auth.ts` - guest sessions auto-created
- **Cache stale?** Call `invalidateCache(key)` or manually expire in Redis
- **Password hashing?** Uses `bcryptjs` v3 with salt rounds 10
- **OTP not sent?** Check `RESEND_API_KEY` and `RESEND_FROM_EMAIL`
- **Prisma errors?** Ensure `DATABASE_URL` is set and DB exists
- **Type errors?** Regenerate Prisma types: `pnpm exec prisma generate`
- **Cart not syncing?** Check React Query cache keys in `endpoints.ts`
- **Redis connection?** Verify `REDIS_URL` env var is set correctly

---

## File Organization Quick Reference

```
src/
  lib/           # Low-level utilities (auth, db, api client)
  services/      # Business logic (auth, product, order, etc.)
  app/actions/   # Server actions (orchestrate services + side effects)
  app/api/v1/    # API routes (for stateless endpoints like cart)
  components/    # React components (UI + form components)
  stores/        # Zustand stores (client-side state)
  hooks/         # React hooks (React Query hooks)
prisma/
  schema.prisma  # Single source of truth for data model
  migrations/    # Auto-generated migration history
docs/            # Architecture docs (ARCHITECTURE.md, ENV_SETUP.md, etc.)
```
