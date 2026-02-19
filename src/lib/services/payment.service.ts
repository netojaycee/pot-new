import { prisma } from "@/lib/db";
import Stripe from "stripe";
import { z } from "zod";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Types
export type PaymentResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

// Validation Schemas
export const createPaymentIntentSchema = z.object({
  orderId: z.string().min(1, "Order ID required"),
  amount: z.number().positive("Amount must be positive"),
  email: z.string().email("Invalid email"),
  currency: z.string().default("gbp").optional(), // Support different currencies (gbp for UK, usd for US, etc.)
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;

export const paymentWebhookSchema = z.object({
  type: z.enum([
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "charge.refunded",
  ]),
  data: z.object({
    object: z.object({
      id: z.string(),
      status: z.string(),
      amount: z.number(),
      amount_received: z.number(),
      client_secret: z.string(),
      customer_email: z.string().optional(),
      metadata: z.record(z.string(), z.string()).optional(),
    }),
  }),
});

export type PaymentWebhookInput = z.infer<typeof paymentWebhookSchema>;

export const paymentService = {
  // ============ CREATE PAYMENT INTENT ============

  /**
   * Create Stripe PaymentIntent for order
   */
  async createPaymentIntent(data: CreatePaymentIntentInput): Promise<PaymentResult<any>> {
    try {
      const validated = createPaymentIntentSchema.parse(data);

      // Find order to verify it exists
      const order = await prisma.order.findUnique({
        where: { id: validated.orderId },
      });

      if (!order) {
        return {
          success: false,
          error: "Order not found",
          code: "ORDER_NOT_FOUND",
        };
      }

      // Convert amount to cents (Stripe expects cents)
      const amountInCents = Math.round(validated.amount * 100);

      // Use provided currency or detect from delivery address country, default to gbp
      const currency = validated.currency || "gbp";

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        receipt_email: validated.email,
        // email: validated.email, we used email originally
        metadata: {
          orderId: validated.orderId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Create or update Payment record
      await prisma.payment.upsert({
        where: { orderId: validated.orderId },
        create: {
          orderId: validated.orderId,
          stripePaymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: validated.amount,
          currency: currency.toLowerCase(),
        },
        update: {
          stripePaymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
        },
      });

      // Update order with payment intent ID
      await prisma.order.update({
        where: { id: validated.orderId },
        data: { stripePaymentIntentId: paymentIntent.id },
      });

      return {
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
          code: "VALIDATION_ERROR",
        };
      }

      if (error instanceof Stripe.errors.StripeError) {
        return {
          success: false,
          error: error.message,
          code: "STRIPE_ERROR",
        };
      }

      console.error("Create payment intent error:", error);
      return {
        success: false,
        error: "Failed to create payment intent",
        code: "CREATE_ERROR",
      };
    }
  },

  // ============ VERIFY WEBHOOK ============

  /**
   * Verify and process webhook from Stripe
   * CRITICAL: Must verify webhook signature using raw body, not parsed JSON
   */
  async verifyWebhookSignature(rawBody: string, signature: string): Promise<PaymentResult<any>> {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

      let event;

      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return {
          success: false,
          error: "Invalid webhook signature",
          code: "INVALID_SIGNATURE",
        };
      }

      // Process event based on type
      switch (event.type) {
        case "payment_intent.succeeded":
          return await paymentService.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);

        case "payment_intent.payment_failed":
          return await paymentService.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);

        case "charge.refunded":
          return await paymentService.handleRefund(event.data.object as Stripe.Charge);

        default:
          return { success: true, data: { message: "Event type not processed" } };
      }
    } catch (error) {
      console.error("Webhook verification error:", error);
      return {
        success: false,
        error: "Webhook processing failed",
        code: "WEBHOOK_ERROR",
      };
    }
  },

  // ============ PAYMENT HANDLERS ============

  /**
   * Handle successful payment
   */
  async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<PaymentResult<any>> {
    try {
      const orderId = paymentIntent.metadata?.orderId;

      if (!orderId) {
        return {
          success: false,
          error: "Order ID not found in metadata",
          code: "MISSING_METADATA",
        };
      }

      // Update payment record
      const payment = await prisma.payment.update({
        where: { orderId },
        data: {
          status: "succeeded",
          details: paymentIntent as any,
        },
      });

      // Update order status
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: "paid" },
        include: { items: { include: { product: true } }, payment: true },
      });

      return { success: true, data: { order, payment } };
    } catch (error) {
      console.error("Handle payment succeeded error:", error);
      return {
        success: false,
        error: "Failed to process successful payment",
        code: "PROCESS_ERROR",
      };
    }
  },

  /**
   * Handle failed payment
   */
  async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<PaymentResult<any>> {
    try {
      const orderId = paymentIntent.metadata?.orderId;

      if (!orderId) {
        return {
          success: false,
          error: "Order ID not found in metadata",
          code: "MISSING_METADATA",
        };
      }

      // Update payment record
      const payment = await prisma.payment.update({
        where: { orderId },
        data: {
          status: "failed",
          details: paymentIntent as any,
        },
        include: { order: true },
      });

      // Update order status
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: "failed" },
        include: { items: { include: { product: true } }, payment: true },
      });

      return { success: true, data: { payment, order } };
    } catch (error) {
      console.error("Handle payment failed error:", error);
      return {
        success: false,
        error: "Failed to process failed payment",
        code: "PROCESS_ERROR",
      };
    }
  },

  /**
   * Handle refund
   */
  async handleRefund(charge: Stripe.Charge): Promise<PaymentResult<any>> {
    try {
      // Find payment by Stripe charge ID
      const payment = await prisma.payment.findFirst({
        where: { stripePaymentIntentId: charge.payment_intent as string },
      });

      if (!payment) {
        return {
          success: false,
          error: "Payment not found",
          code: "PAYMENT_NOT_FOUND",
        };
      }

      // Update payment with refund info
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "refunded",
          details: charge as any,
        },
      });

      // Optionally update order status
      const order = await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "cancelled" },
      });

      return { success: true, data: { payment: updatedPayment, order } };
    } catch (error) {
      console.error("Handle refund error:", error);
      return {
        success: false,
        error: "Failed to process refund",
        code: "PROCESS_ERROR",
      };
    }
  },

  // ============ PAYMENT QUERIES ============

  /**
   * Get payment by order ID
   */
  async getPaymentByOrderId(orderId: string): Promise<PaymentResult<any>> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { orderId },
      });

      if (!payment) {
        return {
          success: false,
          error: "Payment not found",
          code: "NOT_FOUND",
        };
      }

      return { success: true, data: payment };
    } catch (error) {
      console.error("Get payment error:", error);
      return {
        success: false,
        error: "Failed to fetch payment",
        code: "FETCH_ERROR",
      };
    }
  },

  /**
   * Get payment status from Stripe
   */
  async getPaymentStatus(paymentIntentId: string): Promise<PaymentResult<any>> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        success: true,
        data: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100, // Convert from cents
          currency: paymentIntent.currency,
        },
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        return {
          success: false,
          error: error.message,
          code: "STRIPE_ERROR",
        };
      }

      console.error("Get payment status error:", error);
      return {
        success: false,
        error: "Failed to fetch payment status",
        code: "FETCH_ERROR",
      };
    }
  },
};
