import { Section, Text, Link, Hr } from "@react-email/components";
import EmailLayout from "../BaseEmail";
import {
  headingStyle,
  textStyle,
  mutedTextStyle,
  buttonStyle,
  cardStyle,
  hrStyle,
} from "../BaseEmail";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://placeoftreasure.co.uk";

type OrderStatus =
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "failed";

export interface OrderStatusUpdateEmailProps {
  firstName: string;
  orderNumber: string;
  newStatus: OrderStatus;
  total: number;
  trackingNumber?: string;
  trackingUrl?: string;
}

const statusConfig: Record<
  OrderStatus,
  {
    emoji: string;
    label: string;
    preview: string;
    message: string;
    stripText: string;
    accentColor: string;
  }
> = {
  paid: {
    emoji: "💳",
    label: "Payment Received",
    preview: "Your payment was successful — we're getting your order ready!",
    message:
      "Great news! Your payment has been received and your order is now confirmed. Our team will begin preparing your gifts shortly.",
    stripText: "Payment confirmed — your gifts are on their way! 💛",
    accentColor: "#0D9488",
  },
  processing: {
    emoji: "📦",
    label: "Order Being Prepared",
    preview: "We're preparing your order with care!",
    message:
      "Your order is now being carefully prepared by our team. We're making sure everything is perfectly packaged before it heads out to you.",
    stripText: "Your order is being prepared with love 🎀",
    accentColor: "#7c3aed",
  },
  shipped: {
    emoji: "🚚",
    label: "Order Shipped",
    preview: "Your order is on its way!",
    message:
      "Exciting news — your order has been shipped! It&apos;s now on its way to you. Depending on your location, delivery typically takes 2–5 working days.",
    stripText: "Your order is on its way to you! 🚀",
    accentColor: "#ea580c",
  },
  delivered: {
    emoji: "🎉",
    label: "Order Delivered",
    preview: "Your order has been delivered — enjoy!",
    message:
      "Your order has been delivered! We hope you and the recipient absolutely love it. If anything isn't right, please don't hesitate to get in touch.",
    stripText: "Your order has arrived — enjoy every moment! 🎁",
    accentColor: "#16a34a",
  },
  cancelled: {
    emoji: "❌",
    label: "Order Cancelled",
    preview: "Your order has been cancelled",
    message:
      "Your order has been cancelled. If you didn't request this or believe this is a mistake, please contact our support team immediately. Any payment will be refunded within 5–7 business days.",
    stripText: "Order cancelled — our team is here to help",
    accentColor: "#dc2626",
  },
  failed: {
    emoji: "⚠️",
    label: "Payment Failed",
    preview: "There was an issue with your payment",
    message:
      "Unfortunately, there was an issue processing your payment and your order could not be completed. Please try placing your order again or use a different payment method.",
    stripText: "Payment issue — please try again or contact us",
    accentColor: "#dc2626",
  },
};

function fmt(n: number) {
  return `£${n.toFixed(2)}`;
}

export default function OrderStatusUpdateEmail({
  firstName,
  orderNumber,
  newStatus,
  total,
  trackingNumber,
  trackingUrl,
}: OrderStatusUpdateEmailProps) {
  const config = statusConfig[newStatus];
  const orderUrl = `${APP_URL}/orders/${orderNumber}`;

  return (
    <EmailLayout
      preview={config.preview}
      yellowStripText={config.stripText}
    >
      {/* Status icon + heading */}
      <Section style={{ textAlign: "center", marginBottom: "24px" }}>
        <Text
          style={{ fontSize: "48px", margin: "0 0 8px 0", lineHeight: "1" }}
        >
          {config.emoji}
        </Text>
        <Text
          style={{
            ...headingStyle,
            textAlign: "center",
            color: config.accentColor,
            margin: "0",
          }}
        >
          {config.label}
        </Text>
      </Section>

      <Text style={textStyle}>Hi {firstName},</Text>

      <Text
        style={textStyle}
        dangerouslySetInnerHTML={{ __html: config.message }}
      />

      {/* Order reference */}
      <Section
        style={{
          ...cardStyle,
          borderLeft: `4px solid ${config.accentColor}`,
        }}
      >
        <Text style={{ ...mutedTextStyle, margin: "0 0 4px 0" }}>
          Order reference
        </Text>
        <Text
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: config.accentColor,
            margin: "0 0 8px 0",
            fontFamily: "monospace",
          }}
        >
          {orderNumber}
        </Text>
        <Text style={{ ...mutedTextStyle, margin: "0" }}>
          Order total: <strong>{fmt(total)}</strong>
        </Text>
      </Section>

      {/* Tracking info (for shipped status) */}
      {newStatus === "shipped" && (trackingNumber || trackingUrl) && (
        <Section style={{ ...cardStyle, backgroundColor: "#fff7ed", borderLeft: "4px solid #ea580c" }}>
          <Text
            style={{
              ...textStyle,
              fontWeight: "bold",
              margin: "0 0 8px 0",
            }}
          >
            📍 Tracking information
          </Text>
          {trackingNumber && (
            <Text style={{ ...mutedTextStyle, margin: "0 0 4px 0" }}>
              Tracking number:{" "}
              <strong style={{ fontFamily: "monospace" }}>
                {trackingNumber}
              </strong>
            </Text>
          )}
          {trackingUrl && (
            <Text style={{ ...mutedTextStyle, margin: "4px 0 0 0" }}>
              <Link
                href={trackingUrl}
                style={{ color: "#ea580c", textDecoration: "none", fontWeight: "bold" }}
              >
                Track your delivery →
              </Link>
            </Text>
          )}
        </Section>
      )}

      {/* Review prompt for delivered */}
      {newStatus === "delivered" && (
        <Section
          style={{
            ...cardStyle,
            backgroundColor: "#f0fdf9",
            borderLeft: "4px solid #16a34a",
          }}
        >
          <Text style={{ ...textStyle, margin: "0 0 8px 0" }}>
            ⭐ Loved your experience?
          </Text>
          <Text style={{ ...mutedTextStyle, margin: "0" }}>
            Your feedback means the world to us. Leave a review to help others
            discover the perfect gift.
          </Text>
        </Section>
      )}

      <Hr style={{ ...hrStyle, margin: "24px 0" }} />

      {/* CTA */}
      <Section style={{ textAlign: "center", margin: "8px 0 0" }}>
        <Link href={orderUrl} style={buttonStyle}>
          View Order Details
        </Link>
      </Section>

      <Text
        style={{
          ...mutedTextStyle,
          textAlign: "center",
          marginTop: "16px",
        }}
      >
        Questions?{" "}
        <Link
          href={`${APP_URL}/contact-us`}
          style={{ color: "#0D9488", textDecoration: "none" }}
        >
          We&apos;re here to help
        </Link>
      </Text>
    </EmailLayout>
  );
}
