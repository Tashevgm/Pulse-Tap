import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createStripeClient } from "@/lib/stripe";
import { markCheckoutOrderCompleted, markCheckoutOrderExpired } from "@/lib/supabase/order-store";

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
    await markCheckoutOrderCompleted({
      stripeSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
      customerEmail: session.customer_details?.email ?? session.customer_email
    });
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    await markCheckoutOrderExpired(session.id);
  }

  return NextResponse.json({
    ok: true
  });
}
