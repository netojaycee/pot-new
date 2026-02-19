import { Resend } from "resend";
import WelcomeEmail from "@/emails/auth/Welcome";

export const resend = new Resend(process.env.RESEND_API_KEY!);

const DOMAIN = process.env.RESEND_DOMAIN;
export const EMAIL_SENDER = `Place of Treasure <pot-shop@${DOMAIN}>`;

export type SendEmailOptions = {
  from: string;
  to: string;
  subject: string;
  html?: string;
  react?: React.ReactElement;
};

/**
 * Reusable email sending function
 * @param options - Email options { from, to, subject, html?, react? }
 * @returns { success: boolean; messageId?: string; error?: string }
 */
export async function sendEmail(options: SendEmailOptions) {
  const { from, to, subject, html, react } = options;

  try {
    const fromEmail = from.includes("@") ? from : `${from}@${DOMAIN}`;

    const emailPayload: Parameters<typeof resend.emails.send>[0] = {
      from: fromEmail,
      to,
      subject,
      ...(react ? { react } : { html: html || "" }),
    };

    const result = await resend.emails.send(emailPayload);

    if (result.error) {
      console.error(
        `[Email Failed] To: ${to}, Subject: ${subject}`,
        result.error,
      );
      return { success: false, error: result.error.message };
    }

    console.log(
      `[Email Sent] To: ${to}, Subject: ${subject}, MessageId: ${result.data?.id}`,
    );
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Email Error] To: ${to}, Subject: ${subject}`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function sendWelcomeEmail(email: string, firstName: string) {
  return sendEmail({
    from: "pot-shop",
    to: email,
    subject: "Welcome to Place of Treasure!",
    react: WelcomeEmail({ firstName }),
  });
}
