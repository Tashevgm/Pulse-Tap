import { Resend } from "resend";
import type { Card } from "@/lib/cards";

const from = "PulseTap <noreply@pulse-tap.com>";
const siteUrl = "https://www.pulse-tap.com";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  return apiKey ? new Resend(apiKey) : null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeLink(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? escapeHtml(url.toString()) : siteUrl;
  } catch {
    return siteUrl;
  }
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase()
  }).format(amount / 100);
}

function button(label: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:26px 0 8px;"><tr><td align="center" bgcolor="#101820" style="border-radius:9px;"><a href="${safeLink(href)}" style="display:inline-block;padding:14px 22px;border:1px solid #101820;border-radius:9px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;line-height:20px;text-decoration:none;">${escapeHtml(label)}</a></td></tr></table>`;
}

function titleBlock(eyebrow: string, title: string, intro: string) {
  return `<p style="margin:0 0 10px;color:#087f83;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.7px;line-height:18px;text-transform:uppercase;">${escapeHtml(eyebrow)}</p>
    <h1 style="margin:0 0 14px;color:#14212b;font-family:Arial,Helvetica,sans-serif;font-size:30px;font-weight:700;letter-spacing:-0.6px;line-height:36px;">${escapeHtml(title)}</h1>
    <p style="margin:0;color:#52616d;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;">${intro}</p>`;
}

function detailTable(rows: Array<[string, string]>) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:24px 0;border:1px solid #e5ebef;border-radius:10px;border-collapse:separate;overflow:hidden;">
    ${rows
      .map(
        ([label, value], index) => `<tr><td style="padding:12px 15px;border-bottom:${index === rows.length - 1 ? "0" : "1px solid #e9eef1"};color:#687784;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:19px;vertical-align:top;">${escapeHtml(label)}</td><td align="right" style="padding:12px 15px;border-bottom:${index === rows.length - 1 ? "0" : "1px solid #e9eef1"};color:#14212b;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;line-height:19px;text-align:right;vertical-align:top;">${value}</td></tr>`
      )
      .join("")}
  </table>`;
}

function shell({ preheader, content }: { preheader: string; content: string }) {
  return `<!doctype html>
  <html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background-color:#f1f5f7;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f1f5f7" style="width:100%;background:#f1f5f7;border-collapse:collapse;">
      <tr><td align="center" style="padding:34px 14px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;border-collapse:separate;border-spacing:0;">
          <tr><td bgcolor="#101820" style="padding:24px 32px;border-radius:14px 14px 0 0;background:#101820;">
            <p style="margin:0;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:21px;font-weight:700;letter-spacing:-0.4px;line-height:25px;">Pulse<span style="color:#52d8d7;">Tap</span></p>
            <p style="margin:6px 0 0;color:#aab8c1;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.8px;line-height:15px;">SMART NFC + QR</p>
          </td></tr>
          <tr><td bgcolor="#ffffff" style="padding:36px 36px 34px;background:#ffffff;">${content}</td></tr>
          <tr><td bgcolor="#f8fafb" style="padding:20px 30px;border-top:1px solid #e7edef;border-radius:0 0 14px 14px;background:#f8fafb;">
            <p style="margin:0 0 7px;color:#52616d;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;">Need a hand? Visit <a href="${siteUrl}/support" style="color:#087f83;text-decoration:underline;">PulseTap support</a>.</p>
            <p style="margin:0;color:#87939c;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:17px;">PulseTap is a product of Pixel Solutions Ltd.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
}

async function sendEmail({ to, subject, html, idempotencyKey }: { to: string; subject: string; html: string; idempotencyKey?: string }) {
  const resend = getResendClient();

  if (!resend) {
    throw new Error("RESEND_API_KEY is missing; email was not sent.");
  }

  const result = await resend.emails.send({ from, to, subject, html }, idempotencyKey ? { idempotencyKey } : undefined);

  if (result.error) {
    throw new Error(`Resend could not send email: ${result.error.message}`);
  }

  return result;
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
  const safeLabel = escapeHtml(card.label);

  return sendEmail({
    to,
    subject: `Your ${card.label} is active`,
    html: shell({
      preheader: `${card.label} is ready. Your destination is now connected.`,
      content: `${titleBlock("CARD ACTIVATED", "Your card is ready to tap", `<strong style="color:#14212b;">${safeLabel}</strong> is now connected to your saved destination.`)}
        <div style="margin:24px 0 4px;padding:17px 20px;border:1px solid #dceeed;border-radius:10px;background:#f2fbfa;">
          <p style="margin:0 0 6px;color:#087f83;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.4px;line-height:17px;text-transform:uppercase;">Your activation code</p>
          <p style="margin:0;color:#14212b;font-family:Courier New,monospace;font-size:22px;font-weight:700;letter-spacing:1.5px;line-height:30px;">${escapeHtml(card.activationCode)}</p>
          <p style="margin:5px 0 0;color:#687784;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;">Keep this code for your records.</p>
        </div>
        <div style="margin:24px 0 4px;padding:18px 20px;border:1px solid #dceeed;border-radius:10px;background:#f2fbfa;">
          <p style="margin:0 0 8px;color:#087f83;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;line-height:21px;">What you can do in your account</p>
          <ul style="margin:0;padding-left:19px;color:#52616d;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:23px;">
            <li>Change the destination your card opens.</li>
            <li>View the QR backup for your card.</li>
            <li>Check tap activity and manage your PulseTap products.</li>
          </ul>
        </div>
        ${button("Open your profile", dashboardUrl)}`
    })
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
  const safeProduct = escapeHtml(productName);

  return sendEmail({
    to,
    subject: "Your PulseTap order is waiting",
    html: shell({
      preheader: "Your PulseTap products are still waiting in your basket.",
      content: `${titleBlock("YOUR BASKET", "Ready when you are", `You left <strong style="color:#14212b;">${safeProduct}</strong> in checkout. Your order has not been placed yet.`)}
        ${button("Return to your basket", shopUrl)}
        <p style="margin:18px 0 0;color:#71808b;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;">If you have already completed your order or changed your mind, you can ignore this email.</p>`
    })
  });
}

export async function sendOwnerAbandonedCheckoutEmail({
  to,
  orderId,
  productName,
  customerEmail,
  amount,
  currency,
  createdAt
}: {
  to: string;
  orderId: string;
  productName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  createdAt: string;
}) {
  const startedAt = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London"
  }).format(new Date(createdAt));

  return sendEmail({
    to,
    subject: `Abandoned checkout: ${productName}`,
    html: shell({
      preheader: `A customer left ${productName} in checkout.`,
      content: `${titleBlock("INTERNAL NOTIFICATION", "Checkout not completed", "A customer started checkout more than an hour ago and has not completed payment.")}
        ${detailTable([
          ["Product", escapeHtml(productName)],
          ["Customer", escapeHtml(customerEmail)],
          ["Checkout started", escapeHtml(startedAt)],
          ["Cart total", escapeHtml(formatCurrency(amount, currency))],
          ["Order ID", escapeHtml(orderId)]
        ])}`
    })
  });
}

export async function sendEmailVerificationReminderEmail({
  to,
  verifyUrl
}: {
  to: string;
  verifyUrl: string;
}) {
  return sendEmail({
    to,
    subject: "Finish setting up your PulseTap account",
    html: shell({
      preheader: "Verify your email to finish setting up your PulseTap profile.",
      content: `${titleBlock("ONE QUICK STEP", "Verify your email address", "Your PulseTap account is ready, but your email address still needs to be confirmed.")}
        <p style="margin:17px 0 0;color:#52616d;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;">We have requested a fresh verification email. Open it and follow the link to confirm your address. Once verified, you can manage your cards, QR backups, and saved destinations.</p>
        ${button("Open PulseTap", verifyUrl)}
        <p style="margin:16px 0 0;color:#71808b;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;">If you have already verified your email, no further action is needed.</p>`
    })
  });
}

export async function sendOrderConfirmationEmail({
  to,
  productName,
  amountTotal,
  shippingAmount,
  currency,
  shippingName,
  shippingAddress,
  dashboardUrl
}: {
  to: string;
  productName: string;
  amountTotal: number;
  shippingAmount: number;
  currency: string;
  shippingName?: string | null;
  shippingAddress?: string | null;
  dashboardUrl: string;
}) {
  const safeShippingName = shippingName ? escapeHtml(shippingName) : "";
  const safeShippingAddress = shippingAddress ? escapeHtml(shippingAddress).replace(/\n/g, "<br />") : "";
  const addressBlock = safeShippingName || safeShippingAddress
    ? `<div style="margin:18px 0 0;padding:17px 18px;border:1px solid #e5ebef;border-radius:10px;"><p style="margin:0 0 7px;color:#687784;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Shipping address</p><p style="margin:0;color:#263641;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;">${safeShippingName}${safeShippingName && safeShippingAddress ? "<br />" : ""}${safeShippingAddress}</p></div>`
    : "";

  return sendEmail({
    to,
    subject: "Your PulseTap order is confirmed",
    html: shell({
      preheader: "Payment received. We are preparing your PulseTap order.",
      content: `${titleBlock("ORDER CONFIRMED", "Thanks for your order", "Your payment has been received and your PulseTap products are being prepared.")}
        ${detailTable([
          ["Items", escapeHtml(productName)],
          ["Delivery", escapeHtml(formatCurrency(shippingAmount, currency))],
          ["Total paid", `<strong style="color:#14212b;font-size:16px;">${escapeHtml(formatCurrency(amountTotal, currency))}</strong>`]
        ])}
        ${addressBlock}
        <div style="margin:24px 0 0;padding:19px 20px;border-radius:10px;background:#f5f8fa;">
          <p style="margin:0 0 11px;color:#14212b;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;line-height:20px;">What happens next</p>
          <p style="margin:0 0 7px;color:#52616d;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;"><strong style="color:#263641;">Preparation:</strong> We aim to prepare your order within 1 business day.</p>
          <p style="margin:0 0 7px;color:#52616d;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;"><strong style="color:#263641;">Dispatch:</strong> Most orders leave us within 1 business day.</p>
          <p style="margin:0;color:#52616d;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;"><strong style="color:#263641;">Delivery:</strong> Royal Mail delivery is usually 1–2 business days after dispatch.</p>
        </div>
        ${button("Open your profile", dashboardUrl)}
        <p style="margin:15px 0 0;color:#71808b;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;">When your card arrives, tap it to open the activation flow and connect it to your destination.</p>`
    })
  });
}

export async function sendOwnerOrderNotificationEmail({
  to,
  orderId,
  productName,
  customerEmail,
  amountTotal,
  shippingAmount,
  currency,
  shippingName,
  shippingAddress
}: {
  to: string;
  orderId: string;
  productName: string;
  customerEmail: string;
  amountTotal: number;
  shippingAmount: number;
  currency: string;
  shippingName?: string | null;
  shippingAddress?: string | null;
}) {
  const safeShippingName = shippingName ? escapeHtml(shippingName) : "";
  const safeShippingAddress = shippingAddress ? escapeHtml(shippingAddress).replace(/\n/g, "<br />") : "";
  const address = [safeShippingName, safeShippingAddress].filter(Boolean).join("<br />");

  return sendEmail({
    to,
    subject: `New paid order: ${productName}`,
    html: shell({
      preheader: `A new PulseTap order from ${customerEmail}.`,
      content: `${titleBlock("INTERNAL NOTIFICATION", "New paid order", "Stripe confirmed a customer payment. Review the order details below and prepare it for dispatch.")}
        ${detailTable([
          ["Product", escapeHtml(productName)],
          ["Customer", escapeHtml(customerEmail)],
          ["Order ID", escapeHtml(orderId)],
          ["Delivery", escapeHtml(formatCurrency(shippingAmount, currency))],
          ["Total paid", `<strong style="color:#14212b;font-size:16px;">${escapeHtml(formatCurrency(amountTotal, currency))}</strong>`],
          ...(address ? [["Ship to", address] as [string, string]] : [])
        ])}`
    })
  });
}

export async function sendAmazonReviewRequestEmail({
  to,
  cardLabel,
  idempotencyKey
}: {
  to: string;
  cardLabel: string;
  idempotencyKey?: string;
}) {
  return sendEmail({
    to,
    subject: "How is your PulseTap card working for you?",
    idempotencyKey,
    html: shell({
      preheader: "Your PulseTap card is active. We would value your honest feedback.",
      content: `${titleBlock("A QUICK CHECK-IN", "How is your card working for you?", `Your <strong style="color:#14212b;">${escapeHtml(cardLabel)}</strong> is active and has started receiving taps.`)}
        <div style="margin:24px 0;padding:19px 20px;border-left:3px solid #37c9c7;border-radius:0 9px 9px 0;background:#f3f9f9;">
          <p style="margin:0;color:#263641;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;">Thank you for choosing PulseTap. If you have a moment, we would appreciate your honest review on Amazon. Your feedback helps other businesses know what to expect.</p>
        </div>
        <p style="margin:0;color:#71808b;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;">There is no pressure, and we value your honest opinion either way.</p>`
    })
  });
}

export async function sendCustomerThankYouDiscountEmail({
  to,
  firstName,
  shopUrl = `${siteUrl}/shop`
}: {
  to: string;
  firstName?: string;
  shopUrl?: string;
}) {
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi there,";

  return sendEmail({
    to,
    subject: "A thank-you from PulseTap: 15% off your next order",
    html: shell({
      preheader: "Enjoy 15% off your next order with THANKYOU15, plus free shipping over £20.",
      content: `<p style="margin:0 0 16px;color:#52616d;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;">${greeting}</p>
        ${titleBlock("A THANK-YOU FROM PULSETAP", "A little something for your next order", "Thanks for choosing PulseTap and activating your card. We hope it is helping you make every customer interaction count.")}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:25px 0 8px;border:1px solid #bfe5e3;border-radius:12px;background:#f0fbf9;border-collapse:separate;">
          <tr><td align="center" style="padding:24px 18px;">
            <p style="margin:0 0 5px;color:#087f83;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.6px;line-height:17px;">YOUR CUSTOMER THANK-YOU</p>
            <p style="margin:0 0 14px;color:#14212b;font-family:Arial,Helvetica,sans-serif;font-size:32px;font-weight:700;line-height:38px;">15% off</p>
            <p style="display:inline-block;margin:0;padding:10px 15px;border:1px dashed #087f83;border-radius:7px;background:#ffffff;color:#14212b;font-family:Courier New,monospace;font-size:20px;font-weight:700;letter-spacing:2px;line-height:24px;">THANKYOU15</p>
            <p style="margin:14px 0 0;color:#52616d;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;">Enter the code at checkout. Free shipping applies to orders of £20 or more.</p>
          </td></tr>
        </table>
        ${button("Shop PulseTap", shopUrl)}
        <p style="margin:15px 0 0;color:#71808b;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;">We would love to hear how your PulseTap card is working for you.</p>`
    })
  });
}
