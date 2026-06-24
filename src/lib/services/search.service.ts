import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { z } from "zod";

// ============ TYPES ============

export type SearchServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

export interface SearchFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: "price_asc" | "price_desc" | "rating" | "newest" | "popular" | "relevance";
  limit?: number;
  offset?: number;
  type?: "item" | "food" | "giftbox";
}

export interface SearchResult {
  products: any[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  searchMode?: "fulltext" | "vector" | "basic";
}

// ============ VALIDATION ============

const searchFiltersSchema = z.object({
  categoryId: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().positive().optional(),
  minRating: z.number().min(0).max(5).optional(),
  sortBy: z
    .enum(["price_asc", "price_desc", "rating", "newest", "popular", "relevance"])
    .optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  type: z.enum(["item", "food", "giftbox"]).optional(),
});

// ============ HELPERS ============

function buildWhereClause(filters: z.infer<typeof searchFiltersSchema>) {
  const where: Record<string, any> = { isActive: true };
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
  }
  if (filters.minRating !== undefined) where.avgRating = { gte: filters.minRating };
  if (filters.type) where.type = filters.type;
  return where;
}

function buildOrderBy(sortBy: string | undefined) {
  switch (sortBy) {
    case "price_asc":    return { price: "asc" as const };
    case "price_desc":   return { price: "desc" as const };
    case "rating":       return { avgRating: "desc" as const };
    case "popular":      return { soldCount: "desc" as const };
    default:             return { createdAt: "desc" as const };
  }
}

// ============ FULL-TEXT SEARCH (PostgreSQL native tsvector) ============

/**
 * PostgreSQL full-text search using tsvector.
 * Supports natural language queries, stemming, and relevance ranking.
 * Uses parameterised $queryRaw — safe from SQL injection.
 */
async function fullTextSearch(
  query: string,
  filters: z.infer<typeof searchFiltersSchema>,
): Promise<{ products: any[]; total: number }> {
  const sanitisedQuery = query.trim().replace(/[^\w\s'-]/g, " ").slice(0, 200);

  // Build additional filter predicates
  const conditions: string[] = [`p."isActive" = true`];
  const params: any[] = [sanitisedQuery];
  let pIdx = 2;

  if (filters.categoryId) {
    conditions.push(`p."categoryId" = $${pIdx++}`);
    params.push(filters.categoryId);
  }
  if (filters.minPrice !== undefined) {
    conditions.push(`p.price >= $${pIdx++}`);
    params.push(filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(`p.price <= $${pIdx++}`);
    params.push(filters.maxPrice);
  }
  if (filters.minRating !== undefined) {
    conditions.push(`p."avgRating" >= $${pIdx++}`);
    params.push(filters.minRating);
  }
  if (filters.type) {
    conditions.push(`p.type = $${pIdx++}::"ProductType"`);
    params.push(filters.type);
  }

  const whereClause = conditions.join(" AND ");

  // Relevance sort if requested, otherwise use selected sort
  const orderClause =
    filters.sortBy === "relevance" || !filters.sortBy
      ? "rank DESC, p.\"soldCount\" DESC"
      : filters.sortBy === "price_asc" ? `p.price ASC`
      : filters.sortBy === "price_desc" ? `p.price DESC`
      : filters.sortBy === "rating" ? `p."avgRating" DESC`
      : filters.sortBy === "popular" ? `p."soldCount" DESC`
      : `p."createdAt" DESC`;

  const tsVector = `
    setweight(to_tsvector('english', coalesce(p.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(p.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(p.tags, ' '), '')), 'C')
  `;

  const searchQuery = `
    SELECT p.*,
      ts_rank(${tsVector}, plainto_tsquery('english', $1)) AS rank
    FROM "Product" p
    WHERE ${whereClause}
      AND (${tsVector}) @@ plainto_tsquery('english', $1)
    ORDER BY ${orderClause}
    LIMIT $${pIdx} OFFSET $${pIdx + 1}
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM "Product" p
    WHERE ${whereClause}
      AND (${tsVector}) @@ plainto_tsquery('english', $1)
  `;

  params.push(filters.limit, filters.offset);

  const [products, countResult] = await Promise.all([
    prisma.$queryRawUnsafe(searchQuery, ...params),
    prisma.$queryRawUnsafe(countQuery, ...params.slice(0, pIdx - 1)),
  ]);

  const total = Number((countResult as any[])[0]?.total ?? 0);

  // Attach category data via a second query (avoids complex JOIN in raw SQL)
  const productIds = (products as any[]).map((p) => p.id);
  const categories = productIds.length
    ? await prisma.category.findMany({
        where: { products: { some: { id: { in: productIds } } } },
        select: { id: true, name: true, slug: true, type: true },
      })
    : [];

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const hydrated = (products as any[]).map((p) => ({
    ...p,
    category: categoryMap.get(p.categoryId) ?? null,
  }));

  return { products: hydrated, total };
}

// ============ VECTOR SIMILARITY SEARCH (pgvector) ============
// Requires: OPENAI_API_KEY + pgvector extension enabled in Postgres
// Run the migration in prisma/migrations/add_pgvector to activate.

async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: text, model: "text-embedding-3-small" }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.data[0].embedding as number[];
  } catch {
    return null;
  }
}

/**
 * Vector similarity search using pgvector cosine distance.
 * Automatically used when OPENAI_API_KEY is set and product embeddings exist.
 */
async function vectorSearch(
  query: string,
  filters: z.infer<typeof searchFiltersSchema>,
): Promise<{ products: any[]; total: number } | null> {
  const embedding = await generateEmbedding(query);
  if (!embedding) return null;

  const vector = `[${embedding.join(",")}]`;

  try {
    const conditions: string[] = [`p."isActive" = true`, `p.embedding IS NOT NULL`];
    const params: any[] = [vector];
    let pIdx = 2;

    if (filters.categoryId) { conditions.push(`p."categoryId" = $${pIdx++}`); params.push(filters.categoryId); }
    if (filters.minPrice !== undefined) { conditions.push(`p.price >= $${pIdx++}`); params.push(filters.minPrice); }
    if (filters.maxPrice !== undefined) { conditions.push(`p.price <= $${pIdx++}`); params.push(filters.maxPrice); }
    if (filters.type) { conditions.push(`p.type = $${pIdx++}::"ProductType"`); params.push(filters.type); }

    const whereClause = conditions.join(" AND ");
    params.push(filters.limit, filters.offset);

    const sql = `
      SELECT p.*, 1 - (p.embedding <=> $1::vector) AS similarity
      FROM "Product" p
      WHERE ${whereClause}
      ORDER BY p.embedding <=> $1::vector
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;

    const products = await prisma.$queryRawUnsafe(sql, ...params);
    return { products: products as any[], total: (products as any[]).length };
  } catch {
    return null;
  }
}

// ============ PUBLIC SEARCH FUNCTION ============

/**
 * Intelligent product search:
 * 1. Try vector similarity (if OPENAI_API_KEY is configured)
 * 2. Fall back to PostgreSQL full-text search (tsvector/tsquery)
 * 3. Fall back to basic Prisma LIKE search
 */
export async function searchProducts(
  query: string,
  filters?: SearchFilters,
): Promise<SearchServiceResult<SearchResult>> {
  try {
    const validated = searchFiltersSchema.parse(filters || {});
    const trimmed = query.trim();

    if (!trimmed) {
      // Empty query → return latest products
      const where = buildWhereClause(validated);
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy: buildOrderBy(validated.sortBy),
          take: validated.limit,
          skip: validated.offset,
          include: { category: true },
        }),
        prisma.product.count({ where }),
      ]);

      return {
        success: true,
        data: { products, total, limit: validated.limit, offset: validated.offset, hasMore: validated.offset + validated.limit < total, searchMode: "basic" },
      };
    }

    // 1. Try vector search
    const vectorResult = await vectorSearch(trimmed, validated);
    if (vectorResult && vectorResult.products.length > 0) {
      return {
        success: true,
        data: {
          products: vectorResult.products,
          total: vectorResult.total,
          limit: validated.limit,
          offset: validated.offset,
          hasMore: false,
          searchMode: "vector",
        },
      };
    }

    // 2. PostgreSQL full-text search
    try {
      const ftResult = await fullTextSearch(trimmed, validated);
      if (ftResult.total > 0) {
        return {
          success: true,
          data: {
            products: ftResult.products,
            total: ftResult.total,
            limit: validated.limit,
            offset: validated.offset,
            hasMore: validated.offset + validated.limit < ftResult.total,
            searchMode: "fulltext",
          },
        };
      }
    } catch (ftError) {
      console.warn("[Search] Full-text search failed, falling back to LIKE:", ftError);
    }

    // 3. Basic LIKE fallback
    const where: any = {
      ...buildWhereClause(validated),
      OR: [
        { name: { contains: trimmed, mode: "insensitive" } },
        { description: { contains: trimmed, mode: "insensitive" } },
        { tags: { hasSome: [trimmed] } },
      ],
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: buildOrderBy(validated.sortBy),
        take: validated.limit,
        skip: validated.offset,
        include: { category: true, reviews: { take: 1, select: { rating: true } } },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      success: true,
      data: { products, total, limit: validated.limit, offset: validated.offset, hasMore: validated.offset + validated.limit < total, searchMode: "basic" },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message, code: "VALIDATION_ERROR" };
    }
    console.error("Search products error:", error);
    return { success: false, error: "Failed to search products", code: "SEARCH_ERROR" };
  }
}

// ============ CATEGORY SEARCH ============

export async function getProductsByCategory(
  categoryId: string,
  filters?: Omit<SearchFilters, "categoryId">,
): Promise<SearchServiceResult<SearchResult>> {
  try {
    const validated = searchFiltersSchema.parse({ categoryId, ...filters });
    const where = buildWhereClause(validated);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: buildOrderBy(validated.sortBy),
        take: validated.limit,
        skip: validated.offset,
        include: { category: true, reviews: { take: 1, select: { rating: true } } },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      success: true,
      data: { products, total, limit: validated.limit, offset: validated.offset, hasMore: validated.offset + validated.limit < total },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message, code: "VALIDATION_ERROR" };
    }
    console.error("Get products by category error:", error);
    return { success: false, error: "Failed to fetch products", code: "FETCH_ERROR" };
  }
}

export async function getPriceRange(): Promise<SearchServiceResult<{ min: number; max: number }>> {
  try {
    const cacheKey = "price_range";
    const cached = await redis.get(cacheKey);
    if (cached && typeof cached === "string") {
      return { success: true, data: JSON.parse(cached) };
    }

    const [minProduct, maxProduct] = await Promise.all([
      prisma.product.findFirst({ where: { availableQuantity: { gt: 0 } }, orderBy: { price: "asc" }, select: { price: true } }),
      prisma.product.findFirst({ where: { availableQuantity: { gt: 0 } }, orderBy: { price: "desc" }, select: { price: true } }),
    ]);

    const priceRange = { min: minProduct?.price || 0, max: maxProduct?.price || 999999 };
    await redis.setex(cacheKey, 3600, JSON.stringify(priceRange));
    return { success: true, data: priceRange };
  } catch (error) {
    console.error("Get price range error:", error);
    return { success: false, error: "Failed to fetch price range", code: "FETCH_ERROR" };
  }
}

export async function getFilterCategories(): Promise<SearchServiceResult<any[]>> {
  try {
    const cacheKey = "filter_categories";
    const cached = await redis.get(cacheKey);
    if (cached && typeof cached === "string") {
      return { success: true, data: JSON.parse(cached) };
    }

    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: { children: true, _count: { select: { products: true } } },
    });

    await redis.setex(cacheKey, 3600, JSON.stringify(categories));
    return { success: true, data: categories };
  } catch (error) {
    console.error("Get filter categories error:", error);
    return { success: false, error: "Failed to fetch categories", code: "FETCH_ERROR" };
  }
}

// ============ EMBEDDING GENERATION (for admin use / CLI script) ============

/**
 * Generate and store product embeddings.
 * Run once after enabling pgvector: `pnpm exec tsx scripts/generate-embeddings.ts`
 */
export async function generateProductEmbeddings(): Promise<{ success: number; failed: number }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[Embeddings] OPENAI_API_KEY not set — skipping embedding generation");
    return { success: 0, failed: 0 };
  }

  const products = await prisma.product.findMany({
    select: { id: true, name: true, description: true, tags: true },
  });

  let success = 0;
  let failed = 0;

  for (const product of products) {
    const text = [product.name, product.description, ...(product.tags || [])].join(". ");
    const embedding = await generateEmbedding(text);

    if (!embedding) { failed++; continue; }

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "Product" SET embedding = $1::vector WHERE id = $2`,
        `[${embedding.join(",")}]`,
        product.id,
      );
      success++;
    } catch {
      failed++;
    }
  }

  return { success, failed };
}
