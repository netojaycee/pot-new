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

export interface AdminNewOrderEmailProps {
  orderNumber: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  tax: number;
  shippingFee: number;
  total: number;
  deliveryAddress: {
    street: string;
    town: string;
    county: string;
    zip: string;
  };
  occasion?: string;
  specialMessage?: string;
  isGuest?: boolean;
}

function fmt(n: number) {
  return `£${n.toFixed(2)}`;
}

export default function AdminNewOrderEmail({
  orderNumber,
  orderId,
  customerName,
  customerEmail,
  items,
  subtotal,
  discountAmount,
  tax,
  shippingFee,
  total,
  deliveryAddress,
  occasion,
  specialMessage,
  isGuest,
}: AdminNewOrderEmailProps) {
  const adminOrderUrl = `${APP_URL}/admin/orders/${orderId}`;

  return (
    <EmailLayout
      preview={`New order ${orderNumber} — ${fmt(total)} from ${customerName}`}
      yellowStripText={`💰 New order received: ${orderNumber} — ${fmt(total)}`}
    >
      {/* Alert heading */}
      <Section
        style={{
          backgroundColor: "#0D9488",
          borderRadius: "8px",
          padding: "20px 24px",
          margin: "0 0 24px 0",
          textAlign: "center",
        }}
      >
        <Text
          style={{
            color: "#ffffff",
            fontSize: "28px",
            margin: "0 0 4px 0",
            lineHeight: "1",
          }}
        >
          🛒
        </Text>
        <Text
          style={{
            color: "#ffffff",
            fontSize: "20px",
            fontWeight: "bold",
            margin: "4px 0 0 0",
          }}
        >
          New Order Received!
        </Text>
      </Section>

      {/* Order reference */}
      <Section style={cardStyle}>
        <Row>
          <Column>
            <Text style={{ ...mutedTextStyle, margin: "0 0 2px 0" }}>
              Order Number
            </Text>
            <Text
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#0D9488",
                margin: "0",
                fontFamily: "monospace",
              }}
            >
              {orderNumber}
            </Text>
          </Column>
          <Column align="right">
            <Text style={{ ...mutedTextStyle, margin: "0 0 2px 0" }}>
              Total
            </Text>
            <Text
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#0D9488",
                margin: "0",
              }}
            >
              {fmt(total)}
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Customer info */}
      <Text
        style={{
          ...textStyle,
          fontWeight: "bold",
          margin: "20px 0 10px 0",
          fontSize: "15px",
        }}
      >
        Customer
      </Text>

      <Section
        style={{
          ...cardStyle,
          backgroundColor: isGuest ? "#fffbeb" : "#f0fdf9",
          borderLeft: `4px solid ${isGuest ? "#FACC15" : "#0D9488"}`,
        }}
      >
        <Text style={{ ...textStyle, margin: "0 0 4px 0", fontWeight: "600" }}>
          {customerName}{" "}
          {isGuest && (
            <span
              style={{
                backgroundColor: "#FACC15",
                color: "#1a1a1a",
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "10px",
                fontWeight: "bold",
              }}
            >
              GUEST
            </span>
          )}
        </Text>
        <Text style={{ ...mutedTextStyle, margin: "0" }}>{customerEmail}</Text>
      </Section>

      {/* Items */}
      <Text
        style={{
          ...textStyle,
          fontWeight: "bold",
          margin: "20px 0 10px 0",
          fontSize: "15px",
        }}
      >
        Items ({items.length})
      </Text>

      {items.map((item, i) => (
        <Section
          key={i}
          style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}
        >
          <Row>
            <Column>
              <Text style={{ ...textStyle, margin: "0", fontWeight: "600" }}>
                {item.name}
              </Text>
              <Text style={{ ...mutedTextStyle, margin: "2px 0 0 0" }}>
                Qty: {item.quantity} × {fmt(item.price)}
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

      {/* Totals */}
      <Section style={{ marginTop: "12px" }}>
        <Row>
          <Column>
            <Text style={{ ...mutedTextStyle, margin: "3px 0" }}>Subtotal</Text>
          </Column>
          <Column align="right">
            <Text style={{ ...mutedTextStyle, margin: "3px 0" }}>
              {fmt(subtotal)}
            </Text>
          </Column>
        </Row>
        {discountAmount > 0 && (
          <Row>
            <Column>
              <Text
                style={{
                  ...mutedTextStyle,
                  margin: "3px 0",
                  color: "#16a34a",
                }}
              >
                Discount
              </Text>
            </Column>
            <Column align="right">
              <Text
                style={{
                  ...mutedTextStyle,
                  margin: "3px 0",
                  color: "#16a34a",
                }}
              >
                -{fmt(discountAmount)}
              </Text>
            </Column>
          </Row>
        )}
        <Row>
          <Column>
            <Text style={{ ...mutedTextStyle, margin: "3px 0" }}>
              Tax + Shipping
            </Text>
          </Column>
          <Column align="right">
            <Text style={{ ...mutedTextStyle, margin: "3px 0" }}>
              {fmt(tax + shippingFee)}
            </Text>
          </Column>
        </Row>
        <Hr style={{ ...hrStyle, margin: "8px 0" }} />
        <Row>
          <Column>
            <Text
              style={{
                ...textStyle,
                fontWeight: "bold",
                margin: "0",
                fontSize: "16px",
              }}
            >
              Total Charged
            </Text>
          </Column>
          <Column align="right">
            <Text
              style={{
                ...textStyle,
                fontWeight: "bold",
                margin: "0",
                fontSize: "16px",
                color: "#0D9488",
              }}
            >
              {fmt(total)}
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Delivery */}
      <Hr style={{ ...hrStyle, margin: "20px 0" }} />
      <Text
        style={{
          ...textStyle,
          fontWeight: "bold",
          margin: "0 0 8px 0",
          fontSize: "15px",
        }}
      >
        Ship to
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
          <Hr style={{ ...hrStyle, margin: "20px 0" }} />
          <Text
            style={{
              ...textStyle,
              fontWeight: "bold",
              margin: "0 0 8px 0",
              fontSize: "15px",
            }}
          >
            🎀 Gift details
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
                backgroundColor: "#fffbeb",
                borderLeft: "4px solid #FACC15",
                fontStyle: "italic",
              }}
            >
              <Text
                style={{ ...textStyle, margin: "0", fontStyle: "italic" }}
              >
                &ldquo;{specialMessage}&rdquo;
              </Text>
            </Section>
          )}
        </>
      )}

      {/* CTA */}
      <Section style={{ textAlign: "center", margin: "28px 0 0" }}>
        <Link href={adminOrderUrl} style={buttonStyle}>
          View &amp; Process Order
        </Link>
      </Section>

      <Text
        style={{
          ...mutedTextStyle,
          textAlign: "center",
          marginTop: "12px",
          fontSize: "11px",
        }}
      >
        This notification was sent to you because you are an admin of Place of
        Treasure.
      </Text>
    </EmailLayout>
  );
}
