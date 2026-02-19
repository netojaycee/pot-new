import { Section, Text, Link } from "@react-email/components";
import EmailLayout from "../BaseEmail";
import { headingStyle, textStyle } from "../BaseEmail";

interface PasswordChangeConfirmationEmailProps {
  firstName: string;
  timestamp: string;
}

export default function PasswordChangeConfirmationEmail({
  firstName,
  timestamp,
}: PasswordChangeConfirmationEmailProps) {
  const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL || "https://pot-dev-mu.vercel.app";

  return (
    <EmailLayout preview="Your password has been changed">
      <Text style={headingStyle}>Password Changed Successfully ✓</Text>

      <Text style={textStyle}>Hi {firstName},</Text>

      <Text style={textStyle}>
        Your Place of Treasure account password has been successfully changed. This change
        was completed on <strong>{timestamp}</strong>.
      </Text>

      <Text style={textStyle}>
        From now on, you&apos;ll use your new password to log in to your account.
      </Text>

      <Section
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
        <strong>Security Alert:</strong> If you didn&apos;t make this change, please{" "}
        <Link
          href={`${APP_URL}/account/security`}
          style={{ color: "#009F9D", textDecoration: "none" }}
        >
          update your security settings
        </Link>{" "}
        immediately.
      </Section>

      <Text style={{ ...textStyle, fontSize: "14px", color: "#666666" }}>
        <strong>Keep your password safe:</strong>
      </Text>

      <ul style={{ ...textStyle, fontSize: "14px", marginLeft: "20px" }}>
        <li>Never share your password with anyone</li>
        <li>Use a strong, unique password</li>
        <li>Don&apos;t use passwords from other websites</li>
        <li>Change your password regularly</li>
      </ul>

      <Text style={{ ...textStyle, fontSize: "14px", color: "#666666" }}>
        Need help? Visit our{" "}
        <Link
          href={`${APP_URL}/account/security`}
          style={{ color: "#009F9D", textDecoration: "none" }}
        >
          Security Center
        </Link>
        .
      </Text>

      <Text
        style={{
          ...textStyle,
          fontSize: "13px",
          color: "#999999",
          marginTop: "30px",
        }}
      >
        Your account security is important to us. <br />
        The Place of Treasure Team 🛡️
      </Text>
    </EmailLayout>
  );
}
