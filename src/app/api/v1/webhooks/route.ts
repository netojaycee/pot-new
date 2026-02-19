import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/lib/services/payment.service";

/**
 * Stripe Webhook Handler
 * POST /api/v1/webhooks/stripe
 *
 * CRITICAL: Must use raw body to verify webhook signature
 * Never parse the request as JSON before verification
 */

// Get raw body as string (required for Stripe signature verification)
async function getRawBody(request: NextRequest): Promise<string> {
  const buffer = await request.arrayBuffer();
  return Buffer.from(buffer).toString("utf8");
}

export async function POST(request: NextRequest) {
  try {
    // Get Stripe signature from headers
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Get raw body (IMPORTANT: must be raw, not parsed JSON)
    const rawBody = await getRawBody(request);

    if (!rawBody) {
      return NextResponse.json(
        { error: "Empty request body" },
        { status: 400 }
      );
    }

    // Process webhook through service
    const result = await paymentService.verifyWebhookSignature(rawBody, signature);

    if (!result.success) {
      // Return 400 for invalid signatures, 200 for other errors
      // Stripe needs a 2xx response to consider webhook delivered
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.code === "INVALID_SIGNATURE" ? 400 : 200 }
      );
    }

    // update order status based on event

    // Return success
    return NextResponse.json(
      { received: true, message: "Webhook processed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Webhook error:", error);

    // Return 200 even on errors (Stripe will retry if 5xx)
    return NextResponse.json(
      { error: "Internal server error", message: String(error) },
      { status: 200 }
    );
  }
}

/**
 * Webhook Events Handled:
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 * - charge.refunded
 *
 * Setup Instructions:
 * 1. In Stripe Dashboard: Developers → Webhooks
 * 2. Create Endpoint: https://yourdomain.com/api/v1/webhooks/stripe
 * 3. Events to listen: payment_intent, charge
 * 4. Copy signing secret to STRIPE_WEBHOOK_SECRET env var
 *
 * Testing Locally:
 * 1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
 * 2. Run: stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe
 * 3. Run: stripe trigger payment_intent.succeeded
 */
