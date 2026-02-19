"use server";

import { z } from "zod";
import { paymentService } from "@/lib/services/payment.service";
import { orderService } from "@/lib/services/order.service";

// ============ CREATE PAYMENT INTENT ============

/**
 * Create Stripe PaymentIntent for checkout
 * Called when user proceeds to payment
 */
export async function createPaymentIntentAction(input: {
  orderId: string;
  amount: number;
  email: string;
  currency?: string;
}) {
  try {
    const validated = z
      .object({
        orderId: z.string().min(1),
        amount: z.number().positive(),
        email: z.string().email(),
        currency: z.string().optional(),
      })
      .safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0].message,
        code: "VALIDATION_ERROR",
      };
    }

    const result = await paymentService.createPaymentIntent(validated.data);
    return result;
  } catch (error) {
    console.error("Create payment intent error:", error);
    return {
      success: false,
      error: "Failed to create payment intent",
      code: "CREATE_ERROR",
    };
  }
}

// ============ GET PAYMENT STATUS ============

/**
 * Get current payment status from Stripe
 */
export async function getPaymentStatusAction(paymentIntentId: string) {
  try {
    const validated = z.string().min(1).safeParse(paymentIntentId);

    if (!validated.success) {
      return {
        success: false,
        error: "Invalid payment intent ID",
        code: "VALIDATION_ERROR",
      };
    }

    const result = await paymentService.getPaymentStatus(validated.data);
    return result;
  } catch (error) {
    console.error("Get payment status error:", error);
    return {
      success: false,
      error: "Failed to fetch payment status",
      code: "FETCH_ERROR",
    };
  }
}

// ============ WEBHOOK HANDLER ============

/**
 * Handle Stripe webhook
 * IMPORTANT: This must be in API route, not server action
 * See src/app/api/v1/webhooks/stripe.ts
 */
export async function handleStripeWebhookAction(rawBody: string, signature: string) {
  try {
    const result = await paymentService.verifyWebhookSignature(rawBody, signature);
    return result;
  } catch (error) {
    console.error("Webhook handler error:", error);
    return {
      success: false,
      error: "Failed to process webhook",
      code: "WEBHOOK_ERROR",
    };
  }
}

// ============ GET PAYMENT INFO ============

/**
 * Get payment info by order (for confirmation page)
 */
export async function getPaymentInfoAction(orderId: string) {
  try {
    const validated = z.string().min(1).safeParse(orderId);

    if (!validated.success) {
      return {
        success: false,
        error: "Invalid order ID",
        code: "VALIDATION_ERROR",
      };
    }

    // Get order and payment details
    const orderResult = await orderService.getOrder(validated.data);
    if (!orderResult.success) {
      return orderResult;
    }

    const paymentResult = await paymentService.getPaymentByOrderId(validated.data);
    if (!paymentResult.success) {
      return paymentResult;
    }

    return {
      success: true,
      data: {
        order: orderResult.data,
        payment: paymentResult.data,
      },
    };
  } catch (error) {
    console.error("Get payment info error:", error);
    return {
      success: false,
      error: "Failed to fetch payment info",
      code: "FETCH_ERROR",
    };
  }
}
