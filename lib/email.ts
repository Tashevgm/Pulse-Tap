import { Resend } from "resend";
import type { Card } from "@/lib/cards";

const from = "PulseTap <noreply@pulse-tap.com>";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

function button(label: string, href: string) {
  return `<a href="${href}" style="display:inline-block;padding:13px 20px;background:#10131a;color:#ffffff;text-decoration:none;border-radius:999px;font-size:14px;font-weight:700;">${label}</a>`;
}

function shell(content: string) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f6f8fb;padding:32px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e6e9ef;border-radius:18px;padding:32px;">
        <p style="margin:0 0 18px;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:#0f8f95;font-weight:700;">PulseTap</p>
        ${content}
        <hr style="border:none;border-top:1px solid #edf0f4;margin:24px 0;" />
        <p style="margin:0;font-size:12px;line-height:1.5;color:#98a2b3;">PulseTap is a product of Pixel Solutions Ltd.</p>
      </div>
    </div>
  `;
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const resend = getResendClient();

  if (!resend) {
    console.warn(`RESEND_API_KEY is missing. Skipping email to ${to}: ${subject}`);
    return { skipped: true };
  }

  return resend.emails.send({
    from,
    to,
    subject,
    html
  });
}

export async function sendCardRegisteredEmail({
  to,
  card,
  dashboardUrl
}: {
  to: string;
  card: Card;
  dashboardUrl: string;
}) {
  return sendEmail({
    to,
    subject: `Your ${card.label} is active`,
    html: shell(`
      <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;color:#10131a;font-weight:700;">Your card is active</h1>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#4b5563;">${card.label} has been registered and now opens your saved destination link.</p>
      <p style="margin:24px 0;">${button("Open your profile", dashboardUrl)}</p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#667085;">You can edit the destination link, view the QR backup, and check tap activity from your PulseTap profile.</p>
    `)
  });
}

export async function sendAbandonedCheckoutEmail({
  to,
  productName,
  shopUrl
}: {
  to: string;
  productName: string;
  shopUrl: string;
}) {
  return sendEmail({
    to,
    subject: `Complete your PulseTap order`,
    html: shell(`
      <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;color:#10131a;font-weight:700;">Still interested in ${productName}?</h1>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#4b5563;">You started checkout for a PulseTap product but did not complete the order.</p>
      <p style="margin:24px 0;">${button("Return to shop", shopUrl)}</p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#667085;">If you changed your mind, you can ignore this email.</p>
    `)
  });
}
