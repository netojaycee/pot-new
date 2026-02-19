import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { z } from "zod";

const CACHE_TTL = 1800; // 30 minutes for orders

// Types
export type OrderResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

// Validation Schemas
// TODO: If we need to support saved addresses from Address model, revert shippingAddressId and adjust logic accordingly
export const createOrderSchema = z.object({
  cartItems: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
        price: z.number().positive(),
      }),
    )
    .min(1, "Cart cannot be empty"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  shippingAddressId: z.string().optional(), // TODO: For future use with saved addresses
  shippingAddress: z
    .object({
      street: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      zip: z.string().min(1),
      country: z.string().min(1),
    })
    .optional(), // TODO: For future use with saved addresses
  deliveryAddress: z
    .object({
      street: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      zip: z.string().min(1),
      country: z.string().min(1),
    })
    .optional(), // Address collected from checkout form
  promoCodeId: z.string().optional(),
  email: z.string().email().optional(), // For guest orders
  occasion: z.string().optional(), // Gift occasion
  specialMessage: z.string().optional(), // Gift message
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// Helper: Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// Helper: Invalidate order cache
async function invalidateOrderCache(userId?: string) {
  try {
    if (userId) {
      await redis.del(`orders:user:${userId}`);
    }
  } catch (error) {
    console.error("Redis cache invalidation error:", error);
  }
}

// Helper: Calculate tax based on delivery address country
function calculateTax(subtotal: number, country: string): number {
  const taxRates: Record<string, number> = {
    "united kingdom": 0.2, // UK VAT 20%
    uk: 0.2,
    "united states": 0.0, // US: varies by state, for now 0 (apply state tax separately if needed)
    us: 0.0,
    usa: 0.0,
    canada: 0.05, // Canada: GST 5% (provinces add PST)
    australia: 0.1, // Australia: GST 10%
  };

  const normalized = country.toLowerCase().trim();
  const taxRate = taxRates[normalized] || 0;

  return Math.round(subtotal * taxRate * 100) / 100;
}

// Helper: Calculate shipping fee based on subtotal and country
function calculateShipping(subtotal: number, country: string): number {
  const normalized = country.toLowerCase().trim();

  // Free shipping on orders over £50
  if (subtotal >= 50) {
    return 0;
  }

  // Shipping rates by region
  const shippingRates: Record<string, number> = {
    "united kingdom": 4.99,
    uk: 4.99,
    "united states": 9.99,
    us: 9.99,
    usa: 9.99,
    canada: 7.99,
    australia: 14.99,
  };

  return shippingRates[normalized] || 4.99; // Default
}

export const orderService = {
  // ============ READ OPERATIONS ============

  /**
   * Get user's orders (paginated)
   */
  async getUserOrders(
    userId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<OrderResult<{ orders: any[]; total: number }>> {
    try {
      // Try cache first
      const cacheKey = `orders:user:${userId}`;
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return { success: true, data: cached as any };
      } catch (error) {
        console.error("Redis get error:", error);
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: { userId },
          include: {
            items: {
              include: { product: { select: { name: true, images: true } } },
            },
            promoCode: true,
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        }),
        prisma.order.count({ where: { userId } }),
      ]);

      const result = { orders, total };

      try {
        await redis.set(cacheKey, result, { ex: CACHE_TTL });
      } catch (error) {
        console.error("Redis set error:", error);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("Get user orders error:", error);
      return {
        success: false,
        error: "Failed to fetch orders",
        code: "FETCH_ERROR",
      };
    }
  },

  /**
   * Get single order by ID
   */
  async getOrder(orderId: string): Promise<OrderResult<any>> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { product: true } },
          promoCode: true,
          payment: true,
        },
      });

      if (!order) {
        return {
          success: false,
          error: "Order not found",
          code: "NOT_FOUND",
        };
      }

      return { success: true, data: order };
    } catch (error) {
      console.error("Get order error:", error);
      return {
        success: false,
        error: "Failed to fetch order",
        code: "FETCH_ERROR",
      };
    }
  },

  /**
   * Get order by payment intent ID (for webhook verification)
   */
  async getOrderByPaymentIntentId(
    stripePaymentIntentId: string,
  ): Promise<OrderResult<any>> {
    try {
      const order = await prisma.order.findFirst({
        where: { stripePaymentIntentId },
        include: {
          items: { include: { product: true } },
          payment: true,
        },
      });

      if (!order) {
        return {
          success: false,
          error: "Order not found",
          code: "NOT_FOUND",
        };
      }

      return { success: true, data: order };
    } catch (error) {
      console.error("Get order by payment intent error:", error);
      return {
        success: false,
        error: "Failed to fetch order",
        code: "FETCH_ERROR",
      };
    }
  },

  // ============ CREATE ORDER ============

  /**
   * Create order from cart items
   */
  async createOrder(
    data: CreateOrderInput,
    userId?: string,
    sessionId?: string,
  ): Promise<OrderResult<any>> {
    try {
      const validated = createOrderSchema.parse(data);

      // Calculate subtotal
      const subtotal = validated.cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      // Calculate discount
      let discountAmount = 0;
      if (validated.promoCodeId) {
        const promoCode = await prisma.promoCode.findUnique({
          where: { id: validated.promoCodeId },
        });

        if (promoCode) {
          discountAmount =
            promoCode.type === "percent"
              ? (subtotal * promoCode.value) / 100
              : promoCode.value;
        }
      }

      // Calculate tax and shipping based on delivery address
      const country = validated.deliveryAddress?.country || "United Kingdom";
      const tax = calculateTax(subtotal - discountAmount, country);
      const shippingFee = calculateShipping(subtotal - discountAmount, country);

      // Calculate final total: subtotal - discount + tax + shipping
      const total = subtotal - discountAmount + tax + shippingFee;

      // Create order with items in transaction
      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          firstName: validated.firstName || "",
          lastName: validated.lastName || "",
          email: validated.email,
          guestSessionId: sessionId,
          status: "pending",
          subtotal,
          tax,
          shippingFee,
          discountAmount,
          total,
          promoCodeId: validated.promoCodeId,
          deliveryAddress: validated.deliveryAddress,
          occasion: validated.occasion || null,
          specialMessage: validated.specialMessage || null,
          items: {
            create: validated.cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          promoCode: true,
        },
      });

      // Invalidate user cache
      if (userId) {
        await invalidateOrderCache(userId);
      }

      return { success: true, data: order };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
          code: "VALIDATION_ERROR",
        };
      }
      console.error("Create order error:", error);
      return {
        success: false,
        error: "Failed to create order",
        code: "CREATE_ERROR",
      };
    }
  },

  // ============ UPDATE ORDER STATUS ============

  /**
   * Update order status (used by payment webhook)
   */
  async updateOrderStatus(
    orderId: string,
    status:
      | "pending"
      | "paid"
      | "processing"
      | "shipped"
      | "delivered"
      // | "completed"
      | "cancelled"
      | "failed",
  ): Promise<OrderResult<any>> {
    try {
      const order = await prisma.order.findUnique({ where: { id: orderId } });

      if (!order) {
        return {
          success: false,
          error: "Order not found",
          code: "NOT_FOUND",
        };
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status },
        include: {
          items: { include: { product: true } },
          payment: true,
        },
      });

      // Invalidate cache
      if (order.userId) {
        await invalidateOrderCache(order.userId);
      }

      return { success: true, data: updated };
    } catch (error) {
      console.error("Update order status error:", error);
      return {
        success: false,
        error: "Failed to update order",
        code: "UPDATE_ERROR",
      };
    }
  },

  /**
   * Set Stripe payment intent ID on order
   */
  async setStripePaymentIntent(
    orderId: string,
    stripePaymentIntentId: string,
  ): Promise<OrderResult<any>> {
    try {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { stripePaymentIntentId },
        include: { items: { include: { product: true } } },
      });

      return { success: true, data: order };
    } catch (error) {
      console.error("Set Stripe payment intent error:", error);
      return {
        success: false,
        error: "Failed to set payment intent",
        code: "UPDATE_ERROR",
      };
    }
  },

  // ============ CANCEL ORDER ============

  /**
   * Cancel order (only if pending)
   */
  async cancelOrder(
    orderId: string,
    userId?: string,
  ): Promise<OrderResult<any>> {
    try {
      const order = await prisma.order.findUnique({ where: { id: orderId } });

      if (!order) {
        return {
          success: false,
          error: "Order not found",
          code: "NOT_FOUND",
        };
      }

      // Verify ownership
      if (userId && order.userId !== userId) {
        return {
          success: false,
          error: "Unauthorized",
          code: "FORBIDDEN",
        };
      }

      // Can only cancel pending orders
      if (order.status !== "pending") {
        return {
          success: false,
          error: "Can only cancel pending orders",
          code: "INVALID_STATUS",
        };
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: "cancelled" },
        include: { items: { include: { product: true } } },
      });

      if (userId) {
        await invalidateOrderCache(userId);
      }

      return { success: true, data: updated };
    } catch (error) {
      console.error("Cancel order error:", error);
      return {
        success: false,
        error: "Failed to cancel order",
        code: "CANCEL_ERROR",
      };
    }
  },
};
