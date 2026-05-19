import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createStripeClient } from "@/lib/stripe";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { markCheckoutOrderCompleted, markCheckoutOrderExpired } from "@/lib/supabase/order-store";

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

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();
  const stripe = createStripeClient();

  let event: Stripe.Event;

  try {
    event =
      signature && webhookSecret
        ? stripe.webhooks.constructEvent(body, signature, webhookSecret)
        : (JSON.parse(body) as Stripe.Event);
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

    const customerEmail = session.customer_details?.email ?? session.customer_email ?? order?.customerEmail;

    if (order && customerEmail && session.amount_total !== null) {
      const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

      await sendOrderConfirmationEmail({
        to: customerEmail,
        productName: order.productName,
        amountTotal: session.amount_total,
        shippingAmount: session.shipping_cost?.amount_total ?? 0,
        currency: session.currency ?? order.currency,
        shippingName: session.customer_details?.name,
        shippingAddress: formatAddress(session.customer_details?.address),
        dashboardUrl: `${origin}/dashboard`
      });
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
