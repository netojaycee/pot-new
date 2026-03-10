import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { z } from "zod";

const CACHE_TTL = 3600; // 1 hour

// Types
export type PromoCodeResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

// Validation Schemas
export const createPromoCodeSchema = z.object({
  code: z.string().min(1, "Code required").max(50),
  type: z.enum(["percent", "fixed"]),
  value: z.number().positive("Value must be positive"),
  minOrder: z.number().optional(),
  maxUses: z.number().optional(),
  expiryDate: z.string().optional(),
  active: z.boolean().default(true),
});

export const updatePromoCodeSchema = createPromoCodeSchema.partial();

export type CreatePromoCodeInput = z.infer<typeof createPromoCodeSchema>;
export type UpdatePromoCodeInput = z.infer<typeof updatePromoCodeSchema>;

// Helper: Invalidate promo code cache
async function invalidatePromoCodeCache(codeId?: string) {
  try {
    if (codeId) {
      await redis.del(`promo-code:${codeId}`);
    }
    // Invalidate all promo code list caches
    const keys = await redis.keys("promo-codes:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error("Redis cache invalidation error:", error);
  }
}

export const promoCodeService = {
  // ============ READ OPERATIONS ============

  /**
   * Get all promo codes with optional filters
   */
  async getAllPromoCodes(filters?: {
    search?: string;
    activeOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const { search, activeOnly = false, limit = 50, offset = 0 } = filters || {};
    const cacheKey = `promo-codes:all:${search || "all"}:${activeOnly}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached as any[];
    } catch (error) {
      console.error("Redis get error:", error);
    }

    const where: any = {};
    if (activeOnly) where.active = true;
    if (search) {
      where.code = { contains: search, mode: "insensitive" };
    }

    const promoCodes = await prisma.promoCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    try {
      await redis.set(cacheKey, promoCodes, { ex: CACHE_TTL });
    } catch (error) {
      console.error("Redis set error:", error);
    }

    return promoCodes;
  },

  /**
   * Get single promo code by ID
   */
  async getPromoCodeById(id: string): Promise<any | null> {
    const cacheKey = `promo-code:${id}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached;
    } catch (error) {
      console.error("Redis get error:", error);
    }

    const promoCode = await prisma.promoCode.findUnique({
      where: { id },
    });

    if (promoCode) {
      try {
        await redis.set(cacheKey, promoCode, { ex: CACHE_TTL });
      } catch (error) {
        console.error("Redis set error:", error);
      }
    }

    return promoCode;
  },

  /**
   * Get promo code by code
   */
  async getPromoCodeByCode(code: string): Promise<any | null> {
    const cacheKey = `promo-code:code:${code}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached;
    } catch (error) {
      console.error("Redis get error:", error);
    }

    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (promoCode) {
      try {
        await redis.set(cacheKey, promoCode, { ex: CACHE_TTL });
      } catch (error) {
        console.error("Redis set error:", error);
      }
    }

    return promoCode;
  },

  // ============ ADMIN WRITE OPERATIONS ============

  /**
   * Create a new promo code
   */
  async createPromoCode(data: CreatePromoCodeInput): Promise<PromoCodeResult<any>> {
    try {
      const validated = createPromoCodeSchema.parse(data);

      // Check if code already exists
      const existing = await prisma.promoCode.findUnique({
        where: { code: validated.code.toUpperCase() },
      });
      if (existing) {
        return {
          success: false,
          error: "Promo code already exists",
          code: "CODE_EXISTS",
        };
      }

      const promoCode = await prisma.promoCode.create({
        data: {
          ...validated,
          code: validated.code.toUpperCase(),
          expiry: validated.expiryDate ? new Date(validated.expiryDate) : null,
        },
      });

      await invalidatePromoCodeCache();

      return { success: true, data: promoCode };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
          code: "VALIDATION_ERROR",
        };
      }
      console.error("Create promo code error:", error);
      return {
        success: false,
        error: "Failed to create promo code",
        code: "CREATE_ERROR",
      };
    }
  },

  /**
   * Update an existing promo code
   */
  async updatePromoCode(
    id: string,
    data: UpdatePromoCodeInput
  ): Promise<PromoCodeResult<any>> {
    try {
      const validated = updatePromoCodeSchema.parse(data);

      const promoCode = await prisma.promoCode.update({
        where: { id },
        data: {
          ...validated,
          code: validated.code ? validated.code.toUpperCase() : undefined,
          expiry: validated.expiryDate ? new Date(validated.expiryDate) : undefined,
        },
      });

      await invalidatePromoCodeCache(id);

      return { success: true, data: promoCode };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
          code: "VALIDATION_ERROR",
        };
      }
      console.error("Update promo code error:", error);
      return {
        success: false,
        error: "Failed to update promo code",
        code: "UPDATE_ERROR",
      };
    }
  },

  /**
   * Delete a promo code
   */
  async deletePromoCode(id: string): Promise<PromoCodeResult<any>> {
    try {
      const promoCode = await prisma.promoCode.delete({
        where: { id },
      });

      await invalidatePromoCodeCache(id);

      return { success: true, data: promoCode };
    } catch (error) {
      console.error("Delete promo code error:", error);
      return {
        success: false,
        error: "Failed to delete promo code",
        code: "DELETE_ERROR",
      };
    }
  },

  /**
   * Validate and apply promo code
   */
  async validatePromoCode(
    code: string,
    orderTotal: number
  ): Promise<PromoCodeResult<any>> {
    try {
      const promoCode = await this.getPromoCodeByCode(code);

      if (!promoCode) {
        return {
          success: false,
          error: "Promo code not found",
          code: "NOT_FOUND",
        };
      }

      if (!promoCode.active) {
        return {
          success: false,
          error: "Promo code is not active",
          code: "INACTIVE",
        };
      }

      if (promoCode.expiry && new Date() > new Date(promoCode.expiry)) {
        return {
          success: false,
          error: "Promo code has expired",
          code: "EXPIRED",
        };
      }

      if (
        promoCode.maxUses &&
        promoCode.usedCount >= promoCode.maxUses
      ) {
        return {
          success: false,
          error: "Promo code usage limit reached",
          code: "LIMIT_REACHED",
        };
      }

      if (promoCode.minOrder && orderTotal < promoCode.minOrder) {
        return {
          success: false,
          error: `Minimum order amount is £${promoCode.minOrder}`,
          code: "MIN_ORDER_NOT_MET",
        };
      }

      return { success: true, data: promoCode };
    } catch (error) {
      console.error("Validate promo code error:", error);
      return {
        success: false,
        error: "Failed to validate promo code",
        code: "VALIDATION_ERROR",
      };
    }
  },
};
