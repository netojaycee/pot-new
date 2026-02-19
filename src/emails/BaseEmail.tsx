import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Text,
  Link,
  Section,
  Hr,
  Img,
} from "@react-email/components";

const BRAND_COLOR = "#0D9488";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://pot-dev-mu.vercel.app";

export const containerStyle = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  overflow: "hidden",
};

export const headerStyle = {
  backgroundColor: BRAND_COLOR,
  padding: "40px 20px",
  textAlign: "center" as const,
};

export const logoStyle = {
  height: "40px",
  width: "auto",
  marginBottom: "10px",
};

export const footerStyle = {
  backgroundColor: "#f5f5f5",
  padding: "20px",
  textAlign: "center" as const,
  borderTop: `1px solid #e0e0e0`,
};

export const footerText = {
  color: "#666666",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0",
};

export const contentStyle = {
  padding: "40px 20px",
  color: "#000000",
};

export const headingStyle = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  color: BRAND_COLOR,
  margin: "0 0 20px 0",
};

export const textStyle = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#000000",
  margin: "0 0 20px 0",
};

export const buttonStyle = {
  backgroundColor: BRAND_COLOR,
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "bold" as const,
  fontSize: "16px",
  display: "inline-block",
  marginTop: "20px",
};

export const hrStyle = {
  borderColor: "#e0e0e0",
  margin: "30px 0",
};

export const codeBoxStyle = {
  backgroundColor: "#f5f5f5",
  padding: "20px",
  borderRadius: "6px",
  textAlign: "center" as const,
  margin: "20px 0",
};

export const codeStyle = {
  fontSize: "32px",
  fontWeight: "bold" as const,
  color: BRAND_COLOR,
  letterSpacing: "4px",
  margin: "0",
  fontFamily: "monospace",
};

interface EmailLayoutProps {
  children: React.ReactNode;
  preview: string;
  title?: string;
}

export default function EmailLayout({
  children,
  preview,
  title = "Place of Treasure",
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#ffffff",
          fontFamily:
            '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
          margin: "0",
          padding: "20px 0",
        }}
      >
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text
              style={{
                color: "#ffffff",
                fontSize: "28px",
                fontWeight: "bold",
                margin: "0",
              }}
            >
              🎁 POT Shop
            </Text>
          </Section>

          {/* Content */}
          <Section style={contentStyle}>{children}</Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Hr style={hrStyle} />
            <Text style={footerText}>
              <strong>Place of Treasure</strong>
              <br />
              Premium Gifts & Curated Collections
            </Text>
            <Text style={footerText}>
              <Link
                href={APP_URL}
                style={{
                  color: BRAND_COLOR,
                  textDecoration: "none",
                  marginRight: "20px",
                }}
              >
                Visit Shop
              </Link>
              <Link
                href={`${APP_URL}/contact`}
                style={{
                  color: BRAND_COLOR,
                  textDecoration: "none",
                }}
              >
                Contact Us
              </Link>
            </Text>
            <Text style={footerText}>
              © 2026 Place of Treasure. All rights reserved.
            </Text>
            <Text style={{ ...footerText, marginTop: "15px", fontSize: "11px" }}>
              If you didn&apos;t request this email, please ignore it.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
