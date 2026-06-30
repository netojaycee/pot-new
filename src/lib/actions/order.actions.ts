"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { orderService, CreateOrderInput } from "@/lib/services/order.service";
import { cartService } from "@/lib/services/cart.service";
import { paymentService } from "@/lib/services/payment.service";
import { checkoutFormSchema, type CheckoutFormInput } from "@/lib/schema/checkout.schema";
import { sendOrderConfirmationEmail } from "@/lib/email";

// ============ HELPERS ============

/**
 * Detect currency code from country name
 */
function detectCurrencyFromCountry(country: string): string {
  const currencyMap: Record<string, string> = {
    "united kingdom": "gbp",
    uk: "gbp",
    "united states": "usd",
    us: "usd",
    usa: "usd",
    canada: "cad",
    australia: "aud",
    euro: "eur",
    europe: "eur",
  };

  const normalized = country.toLowerCase().trim();
  return currencyMap[normalized] || "gbp"; // Default to GBP
}

// ============ READ ACTIONS ============

/**
 * Get current user's orders
 */
export async function getUserOrdersAction(
  limit: number = 10,
  offset: number = 0,
) {
  try {
    const session = await getSession();

    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    const result = await orderService.getUserOrders(
      session.userId,
      limit,
      offset,
    );
    return result;
  } catch (error) {
    console.error("Get user orders error:", error);
    return {
      success: false,
      error: "Failed to fetch orders",
      code: "FETCH_ERROR",
    };
  }
}

/**
 * Get single order by ID
 */
export async function getOrderAction(orderId: string) {
  try {
    const result = await orderService.getOrder(orderId);
    return result;
  } catch (error) {
    console.error("Get order error:", error);
    return {
      success: false,
      error: "Failed to fetch order",
      code: "FETCH_ERROR",
    };
  }
}

/**
 * Get all orders (admin only)
 */
export async function getOrdersAction(
  limit: number = 50,
  offset: number = 0,
  search?: string,
  status?: string,
) {
  try {
    const session = await getSession();

    // Check admin authorization
    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    // Verify admin role (you can add this check if needed)
    // For now, we'll assume only admins can access this route

    const result = await orderService.getAllOrders(limit, offset, search, status);
    return result;
  } catch (error) {
    console.error("Get all orders error:", error);
    return {
      success: false,
      error: "Failed to fetch orders",
      code: "FETCH_ERROR",
    };
  }
}

// ============ CHECKOUT ACTION (Main checkout flow) ============

/**
 * Main checkout action - called from checkout form
 * Validates recipient info and address, creates order with cart items
 * Returns orderId and clientSecret for Stripe payment
 */
export async function checkoutAction(input: CheckoutFormInput) {
  try {
    // Validate input with checkout schema
    const validated = checkoutFormSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Validation failed",
        code: "VALIDATION_ERROR",
      };
    }

    const session = await getSession();
    let userId: string | undefined;
    let sessionId: string | undefined;
    // console.log(session)

    if (session && "userId" in session) {
      userId = session.userId;
    } else if (session && session.isGuest) {
      sessionId = session.sessionId;
    } else {
      return {
        success: false,
        error: "Invalid session - please refresh and try again",
        code: "INVALID_SESSION",
      };
    }

    // Get cart items
    const cart = userId
      ? await cartService.getCart(undefined, userId)
      : await cartService.getCart(sessionId, undefined);

    if (!cart || !cart.items || cart.items.length === 0) {
      return {
        success: false,
        error: "Your cart is empty",
        code: "EMPTY_CART",
      };
    }

    // Prepare cart items for order
    const cartItems = cart.items.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));

    // Use delivery address from form
    const deliveryAddress = validated.data.deliveryAddress;

    // Create order
    const orderResult = await orderService.createOrder(
      {
        cartItems,
        deliveryAddress,
        firstName: validated.data.firstName || "",
        lastName: validated.data.lastName || "",
        email: validated.data.email,
        occasion: validated.data.occasion || undefined,
        specialMessage: validated.data.specialMessage || undefined,
      },
      userId,
      sessionId,
    );

    if (!orderResult.success) {
      return {
        success: false,
        error: orderResult.error,
        code: orderResult.code,
      };
    }

    // Create Stripe PaymentIntent for the order
    // const currency = detectCurrencyFromCountry(deliveryAddress.county);
    const currency = "gbp"; // For simplicity, using GBP for all orders
    const paymentResult = await paymentService.createPaymentIntent({
      orderId: orderResult.data.id,
      amount: orderResult.data.total,
      email: validated.data.email,
      currency,
    });

    if (!paymentResult.success) {
      return {
        success: false,
        error: paymentResult.error,
        code: paymentResult.code,
      };
    }

    // Clear cart after successful order creation and payment intent creation
    await cartService.clearCart(userId, sessionId);
    revalidatePath("/checkout");
    revalidatePath("/cart");

    // Return order ID, client secret, and full order data for display
    return {
      success: true,
      data: {
        orderId: orderResult.data.id,
        clientSecret: paymentResult.data.clientSecret,
        order: orderResult.data,
      },
    };
  } catch (error) {
    console.error("Checkout action error:", error);
    return {
      success: false,
      error: "An error occurred during checkout",
      code: "CHECKOUT_ERROR",
    };
  }
}

// ============ CREATE ORDER ============

/**
 * Create order from cart
 * Cart items will be passed from client
 */
export async function createOrderAction(input: CreateOrderInput) {
  try {
    // Validate input
    const validated = z
      .object({
        cartItems: z
          .array(
            z.object({
              productId: z.string().min(1),
              quantity: z.number().int().positive(),
              price: z.number().positive(),
            }),
          )
          .min(1),
        shippingAddressId: z.string().optional(),
        shippingAddress: z
          .object({
            street: z.string().min(1),
            city: z.string().min(1),
            state: z.string().min(1),
            zip: z.string().min(1),
            country: z.string().min(1),
          })
          .optional(),
        promoCodeId: z.string().optional(),
        email: z.string().email().optional(),
      })
      .safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0].message,
        code: "VALIDATION_ERROR",
      };
    }

    const session = await getSession();
    let userId: string | undefined;
    let sessionId: string | undefined;

    if (session && "userId" in session) {
      userId = session.userId;
    } else if (session && session.isGuest) {
      sessionId = session.sessionId;
    } else {
      return {
        success: false,
        error: "Invalid session",
        code: "INVALID_SESSION",
      };
    }

    // Create order
    const result = await orderService.createOrder(
      validated.data,
      userId,
      sessionId,
    );

    if (result.success) {
      // Clear cart after order creation
      await cartService.clearCart(userId, sessionId);
      revalidatePath("/orders");
      revalidatePath("/checkout");
    }

    return result;
  } catch (error) {
    console.error("Create order error:", error);
    return {
      success: false,
      error: "Failed to create order",
      code: "CREATE_ERROR",
    };
  }
}

// ============ CANCEL ORDER ============

/**
 * Cancel order (user must own the order)
 */
export async function cancelOrderAction(orderId: string) {
  try {
    const session = await getSession();

    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    const result = await orderService.cancelOrder(orderId, session.userId);

    if (result.success) {
      revalidatePath("/orders");
      revalidatePath(`/orders/${orderId}`);
    }

    return result;
  } catch (error) {
    console.error("Cancel order error:", error);
    return {
      success: false,
      error: "Failed to cancel order",
      code: "CANCEL_ERROR",
    };
  }
}

/**
 * Update order status (admin only)
 */
export async function updateOrderStatusAction(
  orderId: string,
  newStatus: string,
) {
  try {
    const session = await getSession();

    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    // Enforce admin role
    const { prisma } = await import("@/lib/db");
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!user || user.role !== "admin") {
      return {
        success: false,
        error: "Forbidden: admin access required",
        code: "FORBIDDEN",
      };
    }

    const validStatuses = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "failed"];
    if (!validStatuses.includes(newStatus)) {
      return {
        success: false,
        error: "Invalid status",
        code: "INVALID_STATUS",
      };
    }

    const result = await orderService.updateOrderStatus(
      orderId,
      newStatus as any
    );

    if (result.success) {
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${orderId}`);
    }

    return result;
  } catch (error) {
    console.error("Update order status error:", error);
    return {
      success: false,
      error: "Failed to update order status",
      code: "UPDATE_ERROR",
    };
  }
}

/**
 * Resend order confirmation email (admin only)
 */
export async function resendOrderConfirmationAction(orderId: string) {
  try {
    const session = await getSession();
    if (!session || !("userId" in session)) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }

    const { prisma } = await import("@/lib/db");
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });
    if (!user || user.role !== "admin") {
      return { success: false, error: "Forbidden: admin access required", code: "FORBIDDEN" };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: { select: { name: true } } } },
        promoCode: { select: { code: true } },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found", code: "NOT_FOUND" };
    }

    if (!order.email) {
      return { success: false, error: "Order has no email address", code: "NO_EMAIL" };
    }

    await sendOrderConfirmationEmail(order.email, {
      firstName: order.firstName ?? "",
      orderNumber: order.orderNumber,
      orderId: order.id,
      items: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: order.subtotal ?? 0,
      discountAmount: order.discountAmount ?? 0,
      tax: order.tax ?? 0,
      shippingFee: order.shippingFee ?? 0,
      total: order.total,
      deliveryAddress: order.deliveryAddress as any,
      occasion: order.occasion ?? undefined,
      specialMessage: order.specialMessage ?? undefined,
      promoCode: order.promoCode?.code,
    });

    return { success: true };
  } catch (error) {
    console.error("Resend order confirmation error:", error);
    return { success: false, error: "Failed to resend email", code: "EMAIL_ERROR" };
  }
}

