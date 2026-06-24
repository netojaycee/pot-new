import { Section, Text, Link, Row, Column, Hr } from "@react-email/components";
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

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface DeliveryAddress {
  street: string;
  town: string;
  county: string;
  zip: string;
}

export interface OrderConfirmationEmailProps {
  firstName: string;
  orderNumber: string;
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  tax: number;
  shippingFee: number;
  total: number;
  deliveryAddress: DeliveryAddress;
  occasion?: string;
  specialMessage?: string;
  promoCode?: string;
}

function fmt(n: number) {
  return `£${n.toFixed(2)}`;
}

export default function OrderConfirmationEmail({
  firstName,
  orderNumber,
  orderId,
  items,
  subtotal,
  discountAmount,
  tax,
  shippingFee,
  total,
  deliveryAddress,
  occasion,
  specialMessage,
  promoCode,
}: OrderConfirmationEmailProps) {
  const orderUrl = `${APP_URL}/orders/${orderNumber}`;

  return (
    <EmailLayout
      preview={`Order confirmed! Your order ${orderNumber} is on its way 🎁`}
      yellowStripText={`Order #${orderNumber} confirmed — thank you for shopping with us! 🎉`}
    >
      {/* Heading */}
      <Text style={headingStyle}>Your order is confirmed! 🎉</Text>

      <Text style={textStyle}>
        Hi {firstName}, thank you for your purchase. We&apos;ve received your
        order and it&apos;s being prepared with care. You&apos;ll hear from us
        again once it&apos;s on its way.
      </Text>

      {/* Order reference */}
      <Section
        style={{
          ...cardStyle,
          borderLeft: "none",
          backgroundColor: "#f0fdf9",
          border: "1px solid #99f6e4",
          textAlign: "center",
        }}
      >
        <Text style={{ ...mutedTextStyle, margin: "0 0 4px 0" }}>
          ORDER NUMBER
        </Text>
        <Text
          style={{
            fontSize: "22px",
            fontWeight: "bold",
            color: "#0D9488",
            margin: "0",
            letterSpacing: "1px",
            fontFamily: "monospace",
          }}
        >
          {orderNumber}
        </Text>
      </Section>

      {/* Order items */}
      <Text
        style={{
          ...textStyle,
          fontWeight: "bold",
          margin: "24px 0 12px 0",
          fontSize: "16px",
        }}
      >
        Items ordered
      </Text>

      {items.map((item, i) => (
        <Section
          key={i}
          style={{
            padding: "12px 0",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Row>
            <Column>
              <Text
                style={{ ...textStyle, margin: "0", fontWeight: "600" }}
              >
                {item.name}
              </Text>
              <Text style={{ ...mutedTextStyle, margin: "2px 0 0 0" }}>
                Qty: {item.quantity}
              </Text>
            </Column>
            <Column align="right">
              <Text style={{ ...textStyle, margin: "0", fontWeight: "600" }}>
                {fmt(item.price * item.quantity)}
              </Text>
            </Column>
          </Row>
        </Section>
      ))}

      {/* Order totals */}
      <Section style={{ marginTop: "16px" }}>
        <Row>
          <Column>
            <Text style={{ ...mutedTextStyle, margin: "4px 0" }}>
              Subtotal
            </Text>
          </Column>
          <Column align="right">
            <Text style={{ ...mutedTextStyle, margin: "4px 0" }}>
              {fmt(subtotal)}
            </Text>
          </Column>
        </Row>

        {discountAmount > 0 && (
          <Row>
            <Column>
              <Text
                style={{ ...mutedTextStyle, margin: "4px 0", color: "#16a34a" }}
              >
                Discount{promoCode ? ` (${promoCode})` : ""}
              </Text>
            </Column>
            <Column align="right">
              <Text
                style={{ ...mutedTextStyle, margin: "4px 0", color: "#16a34a" }}
              >
                -{fmt(discountAmount)}
              </Text>
            </Column>
          </Row>
        )}

        <Row>
          <Column>
            <Text style={{ ...mutedTextStyle, margin: "4px 0" }}>Tax</Text>
          </Column>
          <Column align="right">
            <Text style={{ ...mutedTextStyle, margin: "4px 0" }}>
              {fmt(tax)}
            </Text>
          </Column>
        </Row>

        <Row>
          <Column>
            <Text style={{ ...mutedTextStyle, margin: "4px 0" }}>
              Shipping
            </Text>
          </Column>
          <Column align="right">
            <Text style={{ ...mutedTextStyle, margin: "4px 0" }}>
              {shippingFee === 0 ? "FREE" : fmt(shippingFee)}
            </Text>
          </Column>
        </Row>

        <Hr style={{ ...hrStyle, margin: "12px 0" }} />

        <Row>
          <Column>
            <Text
              style={{
                ...textStyle,
                fontWeight: "bold",
                fontSize: "17px",
                margin: "0",
              }}
            >
              Total
            </Text>
          </Column>
          <Column align="right">
            <Text
              style={{
                ...textStyle,
                fontWeight: "bold",
                fontSize: "17px",
                margin: "0",
                color: "#0D9488",
              }}
            >
              {fmt(total)}
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Delivery address */}
      <Hr style={{ ...hrStyle, margin: "24px 0" }} />

      <Text
        style={{
          ...textStyle,
          fontWeight: "bold",
          margin: "0 0 10px 0",
          fontSize: "16px",
        }}
      >
        Delivery address
      </Text>

      <Section style={cardStyle}>
        <Text style={{ ...textStyle, margin: "0" }}>
          {deliveryAddress.street}
          <br />
          {deliveryAddress.town}, {deliveryAddress.county}
          <br />
          {deliveryAddress.zip}
        </Text>
      </Section>

      {/* Gift details */}
      {(occasion || specialMessage) && (
        <>
          <Hr style={{ ...hrStyle, margin: "24px 0" }} />
          <Text
            style={{
              ...textStyle,
              fontWeight: "bold",
              margin: "0 0 10px 0",
              fontSize: "16px",
            }}
          >
            Gift details
          </Text>
          {occasion && (
            <Text style={{ ...mutedTextStyle, margin: "0 0 6px 0" }}>
              <strong>Occasion:</strong> {occasion}
            </Text>
          )}
          {specialMessage && (
            <Section
              style={{
                ...cardStyle,
                fontStyle: "italic",
                backgroundColor: "#fffbeb",
                borderLeft: "4px solid #FACC15",
              }}
            >
              <Text style={{ ...textStyle, margin: "0", fontStyle: "italic" }}>
                &ldquo;{specialMessage}&rdquo;
              </Text>
            </Section>
          )}
        </>
      )}

      {/* CTA */}
      <Section style={{ textAlign: "center", margin: "32px 0 0" }}>
        <Link href={orderUrl} style={buttonStyle}>
          View Your Order
        </Link>
      </Section>

      <Text
        style={{
          ...mutedTextStyle,
          textAlign: "center",
          marginTop: "16px",
        }}
      >
        Need help with your order?{" "}
        <Link
          href={`${APP_URL}/contact-us`}
          style={{ color: "#0D9488", textDecoration: "none" }}
        >
          Contact us
        </Link>
      </Text>
    </EmailLayout>
  );
}
