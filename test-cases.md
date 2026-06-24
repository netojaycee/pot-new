# End-to-End Test Cases — Place of Treasure (pot-v2)

> Use this as a manual QA checklist before each release. Tick each item as PASS / FAIL.
> Stripe: use test cards from https://stripe.com/docs/testing

---

## Environment Setup

Before running tests, confirm:
- [ ] `pnpm dev` starts without errors
- [ ] `.env.local` has all required variables (see `architecture.md`)
- [ ] Database has been seeded: `pnpm exec tsx prisma/seed.ts`
- [ ] At least one admin user exists in the DB (role: `admin`)
- [ ] At least 3 products exist across at least 2 categories

---

## TC-01 — Admin Account Creation

**Objective:** Create an admin user and verify they can access the admin panel.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/auth/register` | Registration form renders |
| 2 | Fill in first name, last name, email, password (min 8 chars) | Form accepts valid input |
| 3 | Submit form | OTP sent to email; redirected to `/auth/otp-verification` |
| 4 | Enter OTP from email | Account verified; redirected to home or account page |
| 5 | In DB (via Prisma Studio or psql), update `role` to `admin` for this user | `role = "admin"` confirmed in DB |
| 6 | Log in at `/auth/login` | Logged in successfully; session cookie set |
| 7 | Navigate to `/admin` | Admin dashboard renders; sidebar shows all admin sections |
| 8 | Log out | Redirected to login page; session cookie cleared |

**Notes:** Currently, admin creation requires manual DB update of the `role` field. There is no admin invite flow yet.

---

## TC-02 — Regular User Account Creation

**Objective:** Full registration → verify → login → profile flow for a normal user.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/auth/register` | Registration form renders |
| 2 | Submit with valid data | OTP email sent; OTP page shown |
| 3 | Submit wrong OTP | Error: "Invalid or expired OTP" |
| 4 | Submit correct OTP | Email verified; session set; toast "Email verified" |
| 5 | Go to `/account-management/profile` | User profile page renders with correct name/email |
| 6 | Update display name / phone | Changes saved; toast success |
| 7 | Go to `/account-management/security` | Password change form renders |
| 8 | Change password with wrong current password | Error shown |
| 9 | Change password with correct current password | Success toast; re-login required |
| 10 | Try `/admin` as a regular user | Redirected away (403 or back to home) |

---

## TC-03 — Google OAuth Login

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/auth/login` | Google login button visible |
| 2 | Click Google login | Redirected to Google consent screen |
| 3 | Approve Google OAuth | Redirected back; session cookie set |
| 4 | Check profile page | Name and email from Google account shown |

**Notes:** Requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_APP_URL` env vars.

---

## TC-04 — Adding Products and Categories (Admin)

**Objective:** Admin can create categories and products via the admin panel.

### Categories

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/admin/categories` | Category list renders |
| 2 | Click "Create Category" → fill name, slug, type (item/food/giftbox) | Form submits; category appears in list |
| 3 | Create a subcategory (set parentId to an existing category) | Subcategory appears nested under parent |
| 4 | Edit a category | Changes saved; list updated |
| 5 | Delete a category with no products | Category removed |
| 6 | Delete a category with products | Should fail or warn (FK constraint) |

### Products

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/admin/products/create` | Product form renders |
| 2 | Fill in name, description, price, stock, type, category | Form accepts input |
| 3 | Upload at least one image via Cloudinary uploader | Image previewed |
| 4 | Submit form | Product created; appears in `/admin/products` |
| 5 | Visit `/products/{type}/{slug}` for the new product | Product detail page renders with correct data |
| 6 | Edit product price | Price updated; Redis cache invalidated; product page shows new price |
| 7 | Set stock to 0 | Product shows "Out of Stock" on storefront; cannot be added to cart |
| 8 | Delete product | Product removed; no longer visible on storefront |

---

## TC-05 — Promo Codes (Admin)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/admin/promo-codes/create` | Promo code form renders |
| 2 | Create a `percent` code (e.g. 10% off, code: "SAVE10") | Code created and listed |
| 3 | Create a `fixed` code (e.g. £5 off, code: "FLAT5") | Code created and listed |
| 4 | Apply "SAVE10" at checkout | 10% deducted from subtotal |
| 5 | Apply expired or invalid code | Error: "Invalid or expired promo code" |
| 6 | Apply code beyond usage limit | Error shown |

---

## TC-06 — Guest Shopping and Cart

**Objective:** A visitor without an account can browse, add to cart, and checkout as a guest.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Visit site without logging in | No session cookie yet |
| 2 | Add a product to cart | Guest sessionId cookie created; cart badge updates |
| 3 | Go to `/cart` | Cart shows the added item |
| 4 | Increase/decrease quantity | Quantities update; totals recalculate |
| 5 | Remove item | Item removed; empty cart state shown if no items |
| 6 | Proceed to checkout with items in cart | Checkout form rendered; guest email field visible |

---

## TC-07 — Making an Order (Full Checkout Flow)

**Objective:** End-to-end order placement with Stripe test payment.

**Stripe test card:** `4242 4242 4242 4242` · any future date · any CVC

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add 2+ products to cart (logged in or guest) | Cart shows items with correct totals |
| 2 | Go to `/checkout` | Checkout form renders; order summary visible |
| 3 | Fill in recipient name, email, delivery address | Form validates; no errors |
| 4 | Apply promo code "SAVE10" (if created) | Discount line shown; total reduced |
| 5 | Add special message / occasion | Fields accepted |
| 6 | Submit checkout form | Order created in DB (status: `pending`); Stripe PaymentIntent created; Stripe Elements appear |
| 7 | Enter Stripe test card details | Card fields accept input |
| 8 | Confirm payment | Payment processed; redirected to `/order-confirmation` |
| 9 | Check `/orders` for logged-in user | Order appears with status `paid` ⚠ (depends on BUG-001 fix) |
| 10 | Check admin `/admin/orders` | Order appears in list |
| 11 | Check customer email inbox | Order confirmation email received ⚠ (depends on BUG-002 fix) |
| 12 | Repeat with failing card `4000 0000 0000 9995` | Payment declined; error shown; order remains `pending` |

---

## TC-08 — Order Fulfilment (Admin)

**Objective:** Admin processes an order through all statuses.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in as admin; go to `/admin/orders` | All orders listed; search and filter work |
| 2 | Open a `paid` order | Order detail page renders with items, address, customer info |
| 3 | Click "Update Status" → select "processing" | Status updated to `processing`; toast success |
| 4 | Update to "shipped" | Status updated; customer notification created |
| 5 | Update to "delivered" | Status updated |
| 6 | Try to update a `cancelled` order | Should either block or warn |
| 7 | Check that customer's order list reflects new status | `/orders` shows updated status |

---

## TC-09 — Returns Flow

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User navigates to a delivered order | Return option available |
| 2 | Submit return request with reason | Return created in DB |
| 3 | Admin goes to `/admin/returns` | Return request visible |
| 4 | Admin processes return | Status updated; customer notified |

---

## TC-10 — Account Management

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/account-management/delivery-addresses` | Saved address list renders |
| 2 | Add a new delivery address | Address saved; appears in list |
| 3 | Set as default | Default badge applied |
| 4 | Delete address | Address removed |
| 5 | At checkout, select saved address | Address pre-filled in checkout form |

---

## TC-11 — Password Reset Flow

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Go to `/auth/code-request` | Email form renders |
| 2 | Enter registered email | OTP sent to email |
| 3 | Go to `/auth/reset-password` | Reset form renders (requires OTP) |
| 4 | Enter OTP + new password | Password updated; redirected to login |
| 5 | Log in with new password | Login successful |

---

## TC-12 — Reviews

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Logged-in user goes to a product page | Review form visible |
| 2 | Submit a review with rating and text | Review created; shown on product page |
| 3 | Submit a second review for the same product | Prevented (one review per user per product) |
| 4 | Admin views reviews | Reviews listed in admin (if admin reviews page exists) |

---

## TC-13 — Wishlist

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Logged-in user clicks wishlist icon on product | Product added to wishlist |
| 2 | Go to wishlist page | Product appears |
| 3 | Remove from wishlist | Product removed |
| 4 | Add from wishlist to cart | Product in cart; wishlist item remains (or is removed per UX decision) |

---

## TC-14 — Search

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Use search bar in header | Search input opens |
| 2 | Type a product name | Results appear |
| 3 | Click a result | Navigate to product page |
| 4 | Search for non-existent term | Empty state shown |

---

## Stripe Payment Setup (Required Before Going Live)

| Item | Status |
|------|--------|
| `STRIPE_SECRET_KEY` set in production env | ⏳ |
| `STRIPE_WEBHOOK_SECRET` set in production env | ⏳ |
| Webhook endpoint registered in Stripe Dashboard | ⏳ |
| Events subscribed: `payment_intent.succeeded`, `payment_intent.payment_failed` | ⏳ |
| BUG-001 webhook → order status update implemented | ⏳ |
| BUG-002 order confirmation email implemented | ⏳ |
| Stripe test mode end-to-end verified (all TC-07 steps pass) | ⏳ |
| Switched to live Stripe keys | ⏳ |
