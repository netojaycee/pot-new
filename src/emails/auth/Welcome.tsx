import { Section, Text, Link } from "@react-email/components";
import EmailLayout from "../BaseEmail";
import { headingStyle, textStyle, buttonStyle, cardStyle, hrStyle } from "../BaseEmail";

interface WelcomeEmailProps {
  firstName: string;
}

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://placeoftreasure.co.uk";

export default function WelcomeEmail({ firstName }: WelcomeEmailProps) {
  return (
    <EmailLayout
      preview={`Welcome to Place of Treasure, ${firstName}! 🎁`}
      yellowStripText="Your journey to meaningful gifting starts here ✨"
    >
      <Text style={headingStyle}>Welcome, {firstName}! 🎉</Text>

      <Text style={textStyle}>
        We&apos;re thrilled to have you join the Place of Treasure family.
        Whether you&apos;re shopping for a birthday, anniversary, or just
        because — you&apos;ve come to the right place.
      </Text>

      <Section style={cardStyle}>
        <Text
          style={{ ...textStyle, fontWeight: "bold", margin: "0 0 12px 0" }}
        >
          What you can do with your account:
        </Text>
        <Text style={{ ...textStyle, margin: "0 0 6px 0" }}>
          🛍️ Browse curated gift boxes and collections
        </Text>
        <Text style={{ ...textStyle, margin: "0 0 6px 0" }}>
          ❤️ Save items to your wishlist
        </Text>
        <Text style={{ ...textStyle, margin: "0 0 6px 0" }}>
          📦 Track your orders in real-time
        </Text>
        <Text style={{ ...textStyle, margin: "0" }}>
          🎀 Add personalised messages to any gift
        </Text>
      </Section>

      <Section style={{ textAlign: "center", margin: "28px 0" }}>
        <Link href={APP_URL} style={buttonStyle}>
          Start Shopping Now
        </Link>
      </Section>

      <Text
        style={{
          ...textStyle,
          fontSize: "14px",
          color: "#555555",
          textAlign: "center",
          margin: "0",
        }}
      >
        Questions? We&apos;re always here —{" "}
        <Link
          href={`${APP_URL}/contact-us`}
          style={{ color: "#0D9488", textDecoration: "none" }}
        >
          get in touch
        </Link>
        .
      </Text>
    </EmailLayout>
  );
}
