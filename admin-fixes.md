# Admin Dashboard Fix Tracker
> Created: 2026-06-30. Update STATUS as each task is completed.
> STATUS options: ⏳ Pending · 🔄 In Progress · ✅ Done

---

## HOW TO RESUME
1. Read `architecture.md` and this file at the start of any new session.
2. Skip tasks marked ✅.
3. Work top-to-bottom within each section.
4. Run `pnpm tsc --noEmit` after each file group to catch errors early.

---

## SECTION A — Actions & Services (Backend)

### A1 — Fix `requireAdmin()` in `src/lib/actions/admin.actions.ts`
**Status:** ✅ Done  
**Problem:** `requireAdmin()` only checks if a session exists. It never verifies `role === "admin"` in the DB. Any authenticated user can create/edit/delete products and categories.  
**Fix:** After confirming session exists, do a DB lookup:
```typescript
async function requireAdmin() {
  const session = await getSession();
  if (!session || !("userId" in session)) return null;
  const { prisma } = await import("@/lib/db");
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (!user || user.role !== "admin") return null;
  return session.userId;
}
```

---

### A2 — Uncomment auth in `getAllCustomersAction` (`src/lib/actions/user.actions.ts`)
**Status:** ✅ Done  
**Problem:** The entire session/auth check is commented out (lines ~373-380). Customer data is publicly accessible with no auth.  
**Fix:** Uncomment the session check block:
```typescript
const session = await getSession();
if (!session || !("userId" in session)) {
  return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
}
```
Also remove the unused `GetAllCustomersParams` interface (around line 358-362) to fix the TS diagnostic.

---

### A3 — Fix commented role checks in `src/lib/actions/product.actions.ts`
**Status:** ✅ Done  
**Problem:** `createProductAction`, `updateProductAction`, `deleteProductAction`, `updateProductStockAction` all have TODO comments where the role check should be. Any authenticated user can mutate products.  
**Fix:** In each of those 4 functions, after the session check, add:
```typescript
const { prisma } = await import("@/lib/db");
const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } });
if (!user || user.role !== "admin") {
  return { success: false, error: "Forbidden: admin access required", code: "FORBIDDEN" };
}
```
Remove the TODO comments.

---

### A4 — Fix slug generation in `src/lib/actions/category.actions.ts`
**Status:** ✅ Done  
**Problem:** `categoryService.createCategorySchema` (in `category.service.ts`) requires a `slug` field (`z.string().min(1, "Slug required")`), but the `CategoryForm` and `createCategoryAction` never provide one. Every category creation fails with a validation error.  
**Fix:**
- Import `generateSlug` from `@/lib/utils` at top of `category.actions.ts`.
- In `createCategoryAction`, before calling `createCategorySchema.safeParse(input)`, create: `const enriched = { ...input, slug: generateSlug(input.name || "") };` and validate `enriched` instead of `input`.
- In `updateCategoryAction`, if `input.name` is present, also add `slug: generateSlug(input.name)` to the data passed to `categoryService.updateCategory`.

---

### A5 — Fix `updateCategory` field mapping in `src/lib/services/admin.service.ts`
**Status:** ✅ Done  
**Problem:** `updateCategorySchema` contains `parentCategoryId` (from `createCategorySchema`), but `prisma.category.update` expects `parentId`. Passing `validated` directly to Prisma would throw a runtime error.  
**Fix:** In the `updateCategory` function, before the Prisma call, remap:
```typescript
const updateData: any = { ...validated };
if ("parentCategoryId" in updateData) {
  updateData.parentId = updateData.parentCategoryId || null;
  delete updateData.parentCategoryId;
}
// then: data: updateData
```

---

### A6 — Fix `toggleProductStatus` in `src/lib/services/admin.service.ts`
**Status:** ✅ Done  
**Problem:** The entire implementation is commented out and returns `{ success: true, data: null }` without doing anything. Also `isActive` doesn't exist in the DB schema.  
**Fix:** Implement using `availableQuantity = 0` as "disabled" state (no `isActive` field in schema):
```typescript
if (!isActive) {
  const product = await prisma.product.update({
    where: { id: productId },
    data: { availableQuantity: 0 },
    include: { category: true },
  });
  await redis.del(`product:${productId}`);
  await redis.del("products");
  return { success: true, data: product };
}
const product = await prisma.product.findUnique({
  where: { id: productId },
  include: { category: true },
});
return { success: true, data: product };
```

---

### A7 — Update product images schema in `src/lib/services/product.service.ts`
**Status:** ✅ Done  
**Problem:** `createProductSchema` expects `images: z.array(z.string().url())` (just URLs), but the DB stores `{ url, pubId }` JSON objects, and the display code accesses `product.images[0].url`. These are inconsistent. New products would display broken images.  
**Fix:** Change images field in `createProductSchema`:
```typescript
images: z.array(z.object({ url: z.string().url(), pubId: z.string() })).min(1, "At least one image required"),
```

---

### A8 — Add `uploadProductImageAction` and `deleteProductImageAction` to `src/lib/actions/product.actions.ts`
**Status:** ✅ Done  
**Problem:** There's no server action for uploading product images to Cloudinary. The ProductForm needs to call this.  
**Fix:** Add these two actions to `product.actions.ts`:
```typescript
import { cloudinaryService } from "@/lib/services/cloudinary.service";

export async function uploadProductImageAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || !("userId" in session)) return { success: false, error: "Unauthorized" };
    const { prisma } = await import("@/lib/db");
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } });
    if (!user || user.role !== "admin") return { success: false, error: "Forbidden" };
    const file = formData.get("file") as File;
    if (!file || !(file instanceof File)) return { success: false, error: "No file provided" };
    const result = await cloudinaryService.uploadImage(file, "pot/products");
    if (!result.success) return { success: false, error: result.error };
    return { success: true, data: { url: result.data.secureUrl, pubId: result.data.pubId } };
  } catch (error) {
    console.error("Upload product image error:", error);
    return { success: false, error: "Failed to upload image" };
  }
}

export async function deleteProductImageAction(pubId: string) {
  try {
    const session = await getSession();
    if (!session || !("userId" in session)) return { success: false, error: "Unauthorized" };
    const { prisma } = await import("@/lib/db");
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } });
    if (!user || user.role !== "admin") return { success: false, error: "Forbidden" };
    const result = await cloudinaryService.deleteImage(pubId);
    return result.success ? { success: true } : { success: false, error: result.error };
  } catch (error) {
    return { success: false, error: "Failed to delete image" };
  }
}
```

---

## SECTION B — UI Forms

### B1 — Rewrite `src/components/admin/forms/ProductForm.tsx`
**Status:** ✅ Done  
**Problem (multiple):**
- No image upload UI — the DB requires at least one image but the form has none.
- Has `sku` and `lowStockThreshold` fields that don't exist in the DB schema (silent data loss).
- `description` is optional in the form but required in the service schema.
- `onSubmit` callback doesn't include images.

**Fix:** Rewrite the file. Key changes:
- Remove `sku` and `lowStockThreshold` fields.
- Make `description` required (min 1 char), use `<textarea>` instead of `<Input>`.
- Add `images: Array<{ url: string; pubId: string }>` state, pre-populated from `initialData.images`.
- Add image upload UI: file input (hidden), clickable "Add Image" box, image preview grid with remove buttons.
- Image upload calls `uploadProductImageAction(formData)` (dynamically imported).
- Remove image calls `deleteProductImageAction(pubId)` (non-blocking, still removes from UI).
- Validate `images.length >= 1` before submit; show error if empty.
- `onSubmit` prop type: `(data: ProductFormData & { images: Array<{ url: string; pubId: string }> }) => Promise<void>`.
- `initialData` prop extended to include `images?: Array<{ url: string; pubId: string }>`.

---

### B2 — Fix "no parent" sentinel in `src/components/admin/forms/CategoryForm.tsx`
**Status:** ✅ Done  
**Problem:** `<SelectItem value="no parent">No Parent</SelectItem>` — when selected, `handleSelectChange` sets `parentId = "no parent"` (a string). This is truthy so `value || undefined` doesn't help. DB receives an invalid UUID string.  
**Fix:** In `handleSelectChange`:
```typescript
[name]: (value === "no parent" || value === "") ? undefined : value,
```

---

## SECTION C — Pages (stub handlers + data bugs)

### C1 — Wire up `src/app/(ui-pages)/(admin)/admin/products/create/page.tsx`
**Status:** ✅ Done  
**Problem:** `handleSubmit` only does `console.log("Creating product:", data)`. Nothing is saved.  
**Fix:** Replace stub with:
```typescript
const handleSubmit = async (data: any) => {
  const { createProductAction } = await import("@/lib/actions/product.actions");
  const result = await createProductAction({
    name: data.name,
    description: data.description,
    price: data.price,
    availableQuantity: data.availableQuantity,
    categoryId: data.categoryId,
    type: data.type,
    images: data.images,
    tags: [],
  });
  if (!result.success) throw new Error(result.error);
};
```

---

### C2 — Wire up `src/app/(ui-pages)/(admin)/admin/products/[productId]/edit/page.tsx`
**Status:** ✅ Done  
**Problem:** `handleSubmit` only does `console.log("Updating product:", ...)`. Nothing is saved.  
**Fix:**
- Add `images?: Array<{ url: string; pubId: string }>` to the `Product` interface in that file.
- Replace stub with:
```typescript
const handleSubmit = async (data: any) => {
  const { updateProductAction } = await import("@/lib/actions/product.actions");
  const result = await updateProductAction(productId, {
    name: data.name,
    description: data.description,
    price: data.price,
    availableQuantity: data.availableQuantity,
    categoryId: data.categoryId,
    type: data.type,
    images: data.images,
  });
  if (!result.success) throw new Error(result.error);
};
```

---

### C3 — Wire up `src/app/(ui-pages)/(admin)/admin/categories/create/page.tsx`
**Status:** ✅ Done  
**Problem (two issues):**
1. `fetchCategories` uses hardcoded mock data (`[{ id: "1", name: "Electronics" }, ...]`) instead of calling the real action.
2. `handleSubmit` only does `console.log`. Nothing is saved.

**Fix:**
Replace mock fetch with:
```typescript
const { getCategoriesAction } = await import("@/lib/actions/category.actions");
const result = await getCategoriesAction();
if (result.success) setCategories(result.data || []);
else toast.error("Failed to load categories");
```
Replace stub submit with:
```typescript
const handleSubmit = async (data: any) => {
  const { createCategoryAction } = await import("@/lib/actions/category.actions");
  const result = await createCategoryAction(data);
  if (!result.success) throw new Error(result.error);
};
```

---

### C4 — Wire up `src/app/(ui-pages)/(admin)/admin/categories/[categoryId]/edit/page.tsx`
**Status:** ✅ Done  
**Problem:** `handleSubmit` only does `console.log("Updating category:", ...)`. Nothing is saved.  
**Fix:**
```typescript
const handleSubmit = async (data: any) => {
  const { updateCategoryAction } = await import("@/lib/actions/category.actions");
  const result = await updateCategoryAction(categoryId, data);
  if (!result.success) throw new Error(result.error);
};
```

---

### C5 — Fix NaN in `src/app/(ui-pages)/(admin)/admin/categories/page.tsx`
**Status:** ✅ Done  
**Problem:** The `Category` interface has `productCount: number`, but `categoryService.getAllCategories` returns `_count: { products: number }` (Prisma's count syntax). All references to `c.productCount` or `category.productCount` return `undefined`, causing NaN in cards and table.  
**Fix:**
1. Update the `Category` interface:
```typescript
interface Category {
  id: string;
  name: string;
  description?: string;
  type: "item" | "food" | "giftbox";
  _count: { products: number };
  parent?: { name: string };
  createdAt: string;
}
```
2. Replace every `c.productCount` / `category.productCount` with `(c._count?.products ?? 0)` / `(category._count?.products ?? 0)`.
   Affected lines: stat cards (×2) and the table badge.

---

### C6 — Fix unused imports in `src/app/(ui-pages)/(admin)/admin/customers/page.tsx`
**Status:** ✅ Done  
**Problem:** TypeScript diagnostics show `Link` and `Eye` are imported but not used (after a linter ran and modified the file).  
**Fix:** Remove `Link` from the import on line 4 and `Eye` from the lucide import on line 9, OR verify they are still needed and the diagnostic is stale. If the customer detail page route `/admin/customers/[id]` doesn't exist, remove the `<Link href={...}><Button><Eye /></Button></Link>` row action entirely.

---

## SECTION D — Already Fixed (reference)

| ID | Fix | Date |
|----|-----|------|
| OPT-004 | Print + Send Email buttons in order detail | 2026-06-30 |
| ADMIN-001 | Wrong `/admin/admin/orders` back links | 2026-06-30 |
| ADMIN-002 | Promo codes page: wired fetch, delete, toggle | 2026-06-30 |
| ADMIN-003 | Customers promote-to-admin wired up | 2026-06-30 |
| ADMIN-004 | Inventory Low Stock filter applied to list | 2026-06-30 |
| ADMIN-005 | `failed` status added to order detail | 2026-06-30 |

---

## SECTION E — Analytics Page Notes

The analytics page (`/admin/analytics`) calls `getSalesAnalyticsAction` which works correctly. No NaN bugs found. The daily revenue chart only shows data when there are orders in the selected date range — this is expected behaviour, not a bug.

The main dashboard (`/admin/page.tsx`) calls `getComprehensiveAnalytics()` — this function is fully implemented and returns the correct `DashboardStats` shape. No changes needed there.

---

## HOW TO RUN TYPE CHECK
```bash
pnpm tsc --noEmit
```
Should show zero errors when all tasks above are complete.
