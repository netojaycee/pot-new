import { Section, Text, Link } from "@react-email/components";
import EmailLayout from "../BaseEmail";
import {
  headingStyle,
  textStyle,
  codeBoxStyle,
  codeStyle,
  buttonStyle,
} from "../BaseEmail";

interface OtpEmailProps {
  firstName: string;
  otp: string;
  type:
    | "email_verification"
    | "password_reset"
    | "change_password"
    | "change_email";
  email: string;
}

const typeConfig = {
  email_verification: {
    subject: "Verify your email address",
    preview: "Verify your email to complete registration",
    heading: "Verify Your Email",
    message:
      "Welcome! Please use the code below to verify your email address, or click the button to verify instantly. This code expires in 10 minutes.",
    buttonText: "Verify Email",
    linkType: "email_verification",
  },
  password_reset: {
    subject: "Reset your password",
    preview: "Password reset code for your account",
    heading: "Reset Your Password",
    message:
      "We received a request to reset your password. Use the code below to create a new password, or click the button to proceed. This code expires in 10 minutes.",
    buttonText: "Reset Password",
    linkType: "password_reset",
  },
  change_password: {
    subject: "Confirm password change",
    preview: "Password change verification code",
    heading: "Confirm Password Change",
    message:
      "We received a request to change your password. Use the code below to confirm this action, or click the button. This code expires in 10 minutes.",
    buttonText: "Confirm Change",
    linkType: "change_password",
  },
  change_email: {
    subject: "Verify new email address",
    preview: "Email verification code",
    heading: "Verify New Email",
    message:
      "Please use the code below to verify your new email address, or click the button to verify instantly. This code expires in 10 minutes.",
    buttonText: "Verify Email",
    linkType: "change_email",
  },
};

export default function OtpEmail({
  firstName,
  otp,
  type = "email_verification",
  email,
}: OtpEmailProps) {
  const config = typeConfig[type];
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://pot-dev-mu.vercel.app";
  
  // Generate verification link with OTP code
  const verificationLink = `${APP_URL}/auth/otp-verification?email=${encodeURIComponent(
    email
  )}&type=${config.linkType}&code=${otp}&auto=true`;

  return (
    <EmailLayout preview={config.preview}>
      <Text style={headingStyle}>Hi {firstName},</Text>

      <Text style={textStyle}>{config.message}</Text>

      {/* Quick Link Button */}
      <Section style={{ textAlign: "center" as const, marginTop: "30px" }}>
        <Link href={verificationLink} style={buttonStyle}>
          {config.buttonText}
        </Link>
      </Section>

      {/* OTP Code Box */}
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

      <Text style={{ ...textStyle, fontSize: "14px", color: "#666666" }}>
        Never share this code with anyone. Our team will never ask for your
        code.
      </Text>

      {type === "email_verification" && (
        <Text style={textStyle}>
          If you didn&apos;t create an account, please ignore this email or{" "}
          <Link
            href={`${APP_URL}/contact`}
            style={{ color: "#009F9D", textDecoration: "none" }}
          >
            contact us
          </Link>
          .
        </Text>
      )}

      {(type === "password_reset" || type === "change_password") && (
        <Text style={textStyle}>
          If you didn&apos;t request this, please{" "}
          <Link
            href={`${APP_URL}/contact`}
            style={{ color: "#009F9D", textDecoration: "none" }}
          >
            contact support
          </Link>{" "}
          immediately.
        </Text>
      )}
    </EmailLayout>
  );
}
