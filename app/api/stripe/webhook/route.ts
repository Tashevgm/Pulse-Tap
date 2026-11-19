import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createStripeClient } from "@/lib/stripe";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { sendOwnerOrderNotifications } from "@/lib/order-notifications";
import {
  claimOrderConfirmationEmail,
  claimOwnerOrderNotification,
  markCheckoutOrderCompleted,
  markCheckoutOrderExpired,
  releaseOrderConfirmationEmailClaim,
  releaseOwnerOrderNotificationClaim
} from "@/lib/supabase/order-store";

export const runtime = "nodejs";

function formatAddress(address?: Stripe.Address | null) {
  if (!address) {
    return null;
  }

  return [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country
  ]
    .filter(Boolean)
    .join("\n");
}

function isMissingColumnError(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes("column");
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();
  const stripe = createStripeClient();

  if (!webhookSecret) {
    return NextResponse.json(
      {
        ok: false,
        message: "Missing STRIPE_WEBHOOK_SECRET."
      },
      { status: 500 }
    );
  }

  if (!signature) {
    return NextResponse.json(
      {
        ok: false,
        message: "Missing Stripe signature."
      },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Invalid Stripe webhook."
      },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const order = await markCheckoutOrderCompleted({
      stripeSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
      customerEmail: session.customer_details?.email ?? session.customer_email
    });

    if (!order) {
      throw new Error(`No local checkout order was found for Stripe session ${session.id}.`);
    }

    const customerEmail = session.customer_details?.email ?? session.customer_email ?? order.customerEmail;

    if (!customerEmail || session.amount_total === null) {
      throw new Error(`Stripe session ${session.id} is missing the customer email or total.`);
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
    const shippingName = session.customer_details?.name;
    const shippingAddress = formatAddress(session.customer_details?.address);

    // Guard the internal notification separately from the customer receipt so
    // retries can recover a failed owner alert without sending duplicates.
    let ownerNotificationClaimedAt: string | null = null;
    let shouldSendOwnerNotification = true;

    try {
      ownerNotificationClaimedAt = await claimOwnerOrderNotification(order.id);
      shouldSendOwnerNotification = Boolean(ownerNotificationClaimedAt);
    } catch (claimError) {
      if (!isMissingColumnError(claimError)) {
        throw claimError;
      }

      console.warn("owner_order_notification_sent_at is missing. Sending without duplicate guard until migration is applied.");
    }

    if (shouldSendOwnerNotification) {
      try {
        await sendOwnerOrderNotifications({
          orderId: order.id,
          productName: order.productName,
          customerEmail,
          amountTotal: session.amount_total,
          shippingAmount: session.shipping_cost?.amount_total ?? 0,
          currency: session.currency ?? order.currency,
          shippingName,
          shippingAddress
        });
      } catch (notificationError) {
        if (ownerNotificationClaimedAt) {
          try {
            await releaseOwnerOrderNotificationClaim(order.id, ownerNotificationClaimedAt);
          } catch (releaseError) {
            console.error("Could not release the failed owner notification claim.", releaseError);
          }
        }

        throw notificationError;
      }
    }

    let claimedOrder;

    try {
      claimedOrder = await claimOrderConfirmationEmail(order.id);
    } catch (claimError) {
      if (!isMissingColumnError(claimError)) {
        throw claimError;
      }

      console.warn("order_confirmation_email_sent_at is missing. Sending without duplicate guard until migration is applied.");
      claimedOrder = order;
    }

    if (!claimedOrder) {
      return NextResponse.json({
        ok: true
      });
    }

    try {
      await sendOrderConfirmationEmail({
        to: customerEmail,
        productName: claimedOrder.productName,
        amountTotal: session.amount_total,
        shippingAmount: session.shipping_cost?.amount_total ?? 0,
        currency: session.currency ?? claimedOrder.currency,
        shippingName,
        shippingAddress,
        dashboardUrl: `${origin}/dashboard`
      });
    } catch (emailError) {
      if (claimedOrder.orderConfirmationEmailSentAt) {
        try {
          await releaseOrderConfirmationEmailClaim(order.id, claimedOrder.orderConfirmationEmailSentAt);
        } catch (releaseError) {
          console.error("Could not release order confirmation claim.", releaseError);
        }
      }
      throw emailError;
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    await markCheckoutOrderExpired(session.id);
  }

  return NextResponse.json({
    ok: true
  });
}
