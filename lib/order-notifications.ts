import { sendOwnerOrderNotificationEmail } from "@/lib/email";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase()
  }).format(amount / 100);
}

function buildNotificationText({
  orderId,
  productName,
  customerEmail,
  amountTotal,
  currency,
  shippingName,
  shippingAddress
}: {
  orderId: string;
  productName: string;
  customerEmail: string;
  amountTotal: number;
  currency: string;
  shippingName?: string | null;
  shippingAddress?: string | null;
}) {
  return [
    "New PulseTap order",
    `Product: ${productName}`,
    `Customer: ${customerEmail}`,
    `Total: ${formatCurrency(amountTotal, currency)}`,
    shippingName ? `Ship to: ${shippingName}` : null,
    shippingAddress ? `Address: ${shippingAddress.replace(/\n/g, ", ")}` : null,
    `Order ID: ${orderId}`
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendPhoneWebhookNotification(message: string) {
  const webhookUrl = process.env.ORDER_NOTIFICATION_WEBHOOK_URL;

  if (!webhookUrl) {
    return;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      Title: "New PulseTap order",
      Priority: "high"
    },
    body: message
  });

  if (!response.ok) {
    throw new Error(`Order notification webhook failed with status ${response.status}.`);
  }
}

export async function sendOwnerOrderNotifications({
  orderId,
  productName,
  customerEmail,
  amountTotal,
  shippingAmount,
  currency,
  shippingName,
  shippingAddress
}: {
  orderId: string;
  productName: string;
  customerEmail: string;
  amountTotal: number;
  shippingAmount: number;
  currency: string;
  shippingName?: string | null;
  shippingAddress?: string | null;
}) {
  const ownerEmail = process.env.ORDER_NOTIFICATION_EMAIL;
  const notificationText = buildNotificationText({
    orderId,
    productName,
    customerEmail,
    amountTotal,
    currency,
    shippingName,
    shippingAddress
  });

  if (!ownerEmail) {
    throw new Error("ORDER_NOTIFICATION_EMAIL is not configured.");
  }

  // The owner email is required: let failures reach Stripe so it retries the
  // webhook instead of acknowledging an order with no notification sent.
  await sendOwnerOrderNotificationEmail({
    to: ownerEmail,
    orderId,
    productName,
    customerEmail,
    amountTotal,
    shippingAmount,
    currency,
    shippingName,
    shippingAddress
  });

  // Phone push is optional and must not make a successful email send retry.
  try {
    await sendPhoneWebhookNotification(notificationText);
  } catch (error) {
    console.warn("Phone order notification failed.", error);
  }
}
