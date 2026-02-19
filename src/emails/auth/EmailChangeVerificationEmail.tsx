import { Section, Text, Link } from "@react-email/components";
import EmailLayout from "../BaseEmail";
import { headingStyle, textStyle, codeBoxStyle, codeStyle } from "../BaseEmail";

interface EmailChangeVerificationEmailProps {
  firstName: string;
  newEmail: string;
  otp: string;
  verificationLink: string;
}

export default function EmailChangeVerificationEmail({
  firstName,
  newEmail,
  otp,
  verificationLink,
}: EmailChangeVerificationEmailProps) {
  const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL || "https://pot-dev-mu.vercel.app";

  return (
    <EmailLayout preview="Verify your new email address">
      <Text style={headingStyle}>Verify Your New Email</Text>

      <Text style={textStyle}>Hi {firstName},</Text>

      <Text style={textStyle}>
        You&apos;ve requested to change your email address to{" "}
        <strong>{newEmail}</strong>. To complete this change, please verify your new email
        address using the code below, or click the button to verify instantly. This code
        expires in 10 minutes.
      </Text>

      <Section style={{ textAlign: "center" as const, marginTop: "30px" }}>
        <Link
          href={verificationLink}
          style={{
            ...textStyle,
            backgroundColor: "#009F9D",
            color: "#ffffff",
            padding: "12px 24px",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
            display: "inline-block",
          }}
        >
          Verify Email
        </Link>
      </Section>

      <Text
        style={{
          ...textStyle,
          fontSize: "14px",
          color: "#666666",
          marginTop: "30px",
          marginBottom: "20px",
        }}
      >
        Or enter this code:
      </Text>

      <Section style={codeBoxStyle}>
        <Text style={codeStyle}>{otp}</Text>
      </Section>

      <Text
        style={{
          ...textStyle,
          fontSize: "13px",
          color: "#666666",
          backgroundColor: "#f5f5f5",
          padding: "15px",
          borderRadius: "6px",
          borderLeft: "4px solid #009F9D",
          marginTop: "30px",
        }}
      >
        <strong>Important:</strong> If you didn&apos;t request this email change, please{" "}
        <Link
          href={`${APP_URL}/contact`}
          style={{ color: "#009F9D", textDecoration: "none" }}
        >
          contact support
        </Link>{" "}
        immediately.
      </Text>

      <Text style={{ ...textStyle, fontSize: "14px", color: "#666666" }}>
        Never share your verification code with anyone.
      </Text>
    </EmailLayout>
  );
}
