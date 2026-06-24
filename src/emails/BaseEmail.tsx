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
  Row,
  Column,
} from "@react-email/components";

const BRAND_TEAL = "#0D9488";
const BRAND_YELLOW = "#FACC15";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://placeoftreasure.co.uk";

// ─── Shared style tokens ────────────────────────────────────────────────────

export const containerStyle: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "10px",
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

export const headerStyle: React.CSSProperties = {
  backgroundColor: BRAND_TEAL,
  padding: "32px 24px 28px",
  textAlign: "center",
};

export const yellowStripStyle: React.CSSProperties = {
  backgroundColor: BRAND_YELLOW,
  padding: "6px 24px",
  textAlign: "center",
};

export const footerStyle: React.CSSProperties = {
  backgroundColor: "#111111",
  padding: "28px 24px",
  textAlign: "center",
};

export const contentStyle: React.CSSProperties = {
  padding: "40px 32px",
  color: "#1a1a1a",
};

export const headingStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: "bold",
  color: BRAND_TEAL,
  margin: "0 0 16px 0",
  lineHeight: "1.3",
};

export const textStyle: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "1.7",
  color: "#333333",
  margin: "0 0 16px 0",
};

export const mutedTextStyle: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "1.6",
  color: "#666666",
  margin: "0 0 8px 0",
};

export const buttonStyle: React.CSSProperties = {
  backgroundColor: BRAND_TEAL,
  color: "#ffffff",
  padding: "13px 28px",
  borderRadius: "7px",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: "15px",
  display: "inline-block",
};

export const hrStyle: React.CSSProperties = {
  borderColor: "#e8e8e8",
  margin: "24px 0",
};

export const codeBoxStyle: React.CSSProperties = {
  backgroundColor: "#f0fdf9",
  border: `2px dashed ${BRAND_TEAL}`,
  padding: "20px",
  borderRadius: "8px",
  textAlign: "center",
  margin: "20px 0",
};

export const codeStyle: React.CSSProperties = {
  fontSize: "36px",
  fontWeight: "bold",
  color: BRAND_TEAL,
  letterSpacing: "6px",
  margin: "0",
  fontFamily: "monospace",
};

export const cardStyle: React.CSSProperties = {
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  padding: "20px 24px",
  margin: "16px 0",
  borderLeft: `4px solid ${BRAND_TEAL}`,
};

export const statusBadgeBase: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 14px",
  borderRadius: "20px",
  fontSize: "13px",
  fontWeight: "bold",
  letterSpacing: "0.5px",
  textTransform: "uppercase",
};

// ─── Layout component ────────────────────────────────────────────────────────

interface EmailLayoutProps {
  children: React.ReactNode;
  preview: string;
  yellowStripText?: string;
}

export default function EmailLayout({
  children,
  preview,
  yellowStripText = "Thoughtfully curated gifts — delivered with care 🎁",
}: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#f4f4f4",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          margin: "0",
          padding: "20px 0 40px",
        }}
      >
        <Container style={containerStyle}>
          {/* Teal header */}
          <Section style={headerStyle}>
            <Text
              style={{
                color: "#ffffff",
                fontSize: "26px",
                fontWeight: "bold",
                margin: "0 0 4px 0",
                letterSpacing: "1px",
              }}
            >
              🎁 Place of Treasure
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: "13px",
                margin: "0",
                letterSpacing: "0.5px",
              }}
            >
              Premium Gifts &amp; Curated Collections
            </Text>
          </Section>

          {/* Yellow accent strip */}
          <Section style={yellowStripStyle}>
            <Text
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#1a1a1a",
                margin: "0",
                letterSpacing: "0.3px",
              }}
            >
              {yellowStripText}
            </Text>
          </Section>

          {/* Main content */}
          <Section style={contentStyle}>{children}</Section>

          {/* Dark footer */}
          <Section style={footerStyle}>
            <Row>
              <Column align="center">
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "bold",
                    margin: "0 0 8px 0",
                  }}
                >
                  Place of Treasure
                </Text>
                <Text
                  style={{
                    color: "#999999",
                    fontSize: "12px",
                    margin: "0 0 12px 0",
                  }}
                >
                  United Kingdom &nbsp;·&nbsp; 07832 813934
                </Text>
                <Text style={{ margin: "0 0 12px 0" }}>
                  <Link
                    href="https://www.instagram.com/placeoftreasure_"
                    style={{
                      color: BRAND_YELLOW,
                      textDecoration: "none",
                      fontSize: "12px",
                      marginRight: "16px",
                    }}
                  >
                    Instagram
                  </Link>
                  <Link
                    href="https://www.facebook.com/share/1DjTf1RYkt/"
                    style={{
                      color: BRAND_YELLOW,
                      textDecoration: "none",
                      fontSize: "12px",
                      marginRight: "16px",
                    }}
                  >
                    Facebook
                  </Link>
                  <Link
                    href={`${APP_URL}/contact-us`}
                    style={{
                      color: BRAND_YELLOW,
                      textDecoration: "none",
                      fontSize: "12px",
                    }}
                  >
                    Contact Us
                  </Link>
                </Text>
                <Hr style={{ borderColor: "#333333", margin: "12px 0" }} />
                <Text
                  style={{
                    color: "#555555",
                    fontSize: "11px",
                    margin: "0",
                    lineHeight: "1.6",
                  }}
                >
                  © {new Date().getFullYear()} Place of Treasure. All rights
                  reserved.
                  <br />
                  If you didn&apos;t request this email, you can safely ignore
                  it.
                </Text>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
