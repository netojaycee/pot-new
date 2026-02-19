import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Text,
  Link,
  Heading,
  Section,
  Hr,
} from "@react-email/components";


interface WelcomeEmailProps {
  firstName: string;
}

export default function WelcomeEmail({ firstName }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Place of Treasure</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome, {firstName}!</Heading>
          <Text style={text}>
            Thanks for joining Place of Treasure. We&apos;re excited to have you on board!
          </Text>
          <Section style={btnContainer}>
            <Link style={button} href={process.env.NEXT_PUBLIC_APP_URL!}>
              Start Shopping
            </Link>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            If you have any questions, feel free to reply to this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const h1 = {
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.1",
  color: "#484848",
};

const text = {
  fontSize: "16px",
  lineHeight: "1.4",
  color: "#484848",
};

const btnContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "32px",
};

const button = {
  backgroundColor: "#000000",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px",
};

const hr = {
  borderColor: "#cccccc",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
};
