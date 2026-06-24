import { Resend } from "resend";
import WelcomeEmail from "@/emails/auth/Welcome";
import OtpEmail from "@/emails/auth/OtpEmail";
import AccountCreatedEmail from "@/emails/auth/AccountCreatedEmail";
import OrderConfirmationEmail, {
  type OrderConfirmationEmailProps,
} from "@/emails/orders/OrderConfirmationEmail";
import OrderStatusUpdateEmail, {
  type OrderStatusUpdateEmailProps,
} from "@/emails/orders/OrderStatusUpdateEmail";
import AdminNewOrderEmail, {
  type AdminNewOrderEmailProps,
} from "@/emails/orders/AdminNewOrderEmail";

export const resend = new Resend(process.env.RESEND_API_KEY!);

const DOMAIN = process.env.RESEND_DOMAIN;
export const EMAIL_SENDER = `Place of Treasure <noreply@${DOMAIN}>`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || `admin@${DOMAIN}`;

export type SendEmailOptions = {
  from?: string;
  to: string;
  subject: string;
  html?: string;
  react?: React.ReactElement;
};

/**
 * Core email send function — all helpers go through here.
 */
export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, html, react } = options;
  const from = options.from ?? EMAIL_SENDER;

  try {
    const emailPayload: Parameters<typeof resend.emails.send>[0] = {
      from,
      to,
      subject,
      ...(react ? { react } : { html: html || "" }),
    };

    const result = await resend.emails.send(emailPayload);

    if (result.error) {
      console.error(`[Email Failed] To: ${to}, Subject: ${subject}`, result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Email Error] To: ${to}, Subject: ${subject}`, msg);
    return { success: false, error: msg };
  }
}

// ─── Auth emails ──────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(email: string, firstName: string) {
  return sendEmail({
    to: email,
    subject: "Welcome to Place of Treasure! 🎁",
    react: WelcomeEmail({ firstName }) as React.ReactElement,
  });
}

export async function sendOtpEmail(
  email: string,
  firstName: string,
  otp: string,
  type: "email_verification" | "password_reset" | "change_password" | "change_email",
) {
  const subjects: Record<typeof type, string> = {
    email_verification: "Verify your email address — Place of Treasure",
    password_reset: "Reset your password — Place of Treasure",
    change_password: "Confirm password change — Place of Treasure",
    change_email: "Verify your new email — Place of Treasure",
  };

  return sendEmail({
    to: email,
    subject: subjects[type],
    react: OtpEmail({ firstName, otp, type, email }) as React.ReactElement,
  });
}

export async function sendAccountCreatedEmail(email: string, firstName: string) {
  return sendEmail({
    to: email,
    subject: "Your Place of Treasure account is ready 🎉",
    react: AccountCreatedEmail({ firstName }) as React.ReactElement,
  });
}

// ─── Order emails ─────────────────────────────────────────────────────────────

export async function sendOrderConfirmationEmail(
  email: string,
  props: OrderConfirmationEmailProps,
) {
  return sendEmail({
    to: email,
    subject: `Order confirmed: ${props.orderNumber} — Place of Treasure`,
    react: OrderConfirmationEmail(props) as React.ReactElement,
  });
}

export async function sendOrderStatusEmail(
  email: string,
  props: OrderStatusUpdateEmailProps,
) {
  const subjects: Record<OrderStatusUpdateEmailProps["newStatus"], string> = {
    paid: `Payment confirmed — Order ${props.orderNumber}`,
    processing: `We're preparing your order — ${props.orderNumber}`,
    shipped: `Your order is on the way! — ${props.orderNumber}`,
    delivered: `Your order has been delivered — ${props.orderNumber}`,
    cancelled: `Order ${props.orderNumber} has been cancelled`,
    failed: `Payment failed for order ${props.orderNumber}`,
  };

  return sendEmail({
    to: email,
    subject: subjects[props.newStatus],
    react: OrderStatusUpdateEmail(props) as React.ReactElement,
  });
}

export async function sendAdminNewOrderEmail(props: AdminNewOrderEmailProps) {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `🛒 New order: ${props.orderNumber} — ${props.customerName} (£${props.total.toFixed(2)})`,
    react: AdminNewOrderEmail(props) as React.ReactElement,
  });
}
