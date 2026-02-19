import { Section, Text, Link } from "@react-email/components";
import EmailLayout from "../BaseEmail";
import { headingStyle, textStyle, buttonStyle } from "../BaseEmail";

interface PasswordResetInitiationEmailProps {
  firstName: string;
  resetLink: string;
}

export default function PasswordResetInitiationEmail({
  firstName,
  resetLink,
}: PasswordResetInitiationEmailProps) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://pot-dev-mu.vercel.app";

  return (
    <EmailLayout preview="Reset your Place of Treasure password">
      <Text style={headingStyle}>Password Reset Request</Text>

      <Text style={textStyle}>Hi {firstName},</Text>

      <Text style={textStyle}>
        We received a request to reset the password for your Place of Treasure account. Click the button below to create a new password. This link expires in 24 hours.
      </Text>

      <Section style={{ textAlign: "center" as const, marginTop: "30px" }}>
        <Link href={resetLink} style={buttonStyle}>
          Reset Your Password
        </Link>
      </Section>

      <Text
        style={{
          ...textStyle,
          fontSize: "13px",
          color: "#666666",
          marginTop: "30px",
          backgroundColor: "#f5f5f5",
          padding: "15px",
          borderRadius: "6px",
          borderLeft: "4px solid #009F9D",
        }}
      >
        <strong>Security Tip:</strong> If you didn&apos;t request this password reset, please{" "}
        <Link
          href={`${APP_URL}/contact`}
          style={{ color: "#009F9D", textDecoration: "none" }}
        >
          contact our support team
        </Link>{" "}
        immediately.
      </Text>

      <Text style={{ ...textStyle, fontSize: "14px", color: "#666666" }}>
        Never share your password reset link with anyone. Our team will never ask for it.
      </Text>

      <Text
        style={{
          ...textStyle,
          fontSize: "13px",
          color: "#999999",
          marginTop: "30px",
        }}
      >
        Need help? Visit our{" "}
        <Link
          href={`${APP_URL}/help`}
          style={{ color: "#009F9D", textDecoration: "none" }}
        >
          Help Center
        </Link>
        .
      </Text>
    </EmailLayout>
  );
}
