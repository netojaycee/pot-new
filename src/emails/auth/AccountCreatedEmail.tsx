import { Section, Text, Link } from "@react-email/components";
import EmailLayout from "../BaseEmail";
import { headingStyle, textStyle, buttonStyle } from "../BaseEmail";

interface AccountCreatedEmailProps {
  firstName: string;
}

export default function AccountCreatedEmail({
  firstName,
}: AccountCreatedEmailProps) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://pot-dev-mu.vercel.app";

  return (
    <EmailLayout preview="Your Place of Treasure account is ready">
      <Text style={headingStyle}>Welcome to Place of Treasure, {firstName}! 🎁</Text>

      <Text style={textStyle}>
        Your account has been successfully created and verified. You&apos;re all set to start shopping for amazing gifts and curated collections.
      </Text>

      <Text style={textStyle}>
        Here are some things you can do now:
      </Text>

      <ul style={{ ...textStyle, marginLeft: "20px" }}>
        <li>Browse our curated gift collections</li>
        <li>Save items to your wishlist</li>
        <li>Track your orders in real-time</li>
        <li>Enjoy exclusive member benefits</li>
      </ul>

      <Section style={{ textAlign: "center" as const, marginTop: "30px" }}>
        <Link href={APP_URL} style={buttonStyle}>
          Start Shopping
        </Link>
      </Section>

      <Text style={{ ...textStyle, fontSize: "14px", color: "#666666" }}>
        If you have any questions or need assistance, feel free to{" "}
        <Link
          href={`${APP_URL}/contact`}
          style={{ color: "#009F9D", textDecoration: "none" }}
        >
          contact our support team
        </Link>
        .
      </Text>

      <Text
        style={{
          ...textStyle,
          fontSize: "13px",
          color: "#999999",
          marginTop: "30px",
          fontStyle: "italic",
        }}
      >
        Happy shopping! <br />
        The Place of Treasure Team 🛍️
      </Text>
    </EmailLayout>
  );
}
