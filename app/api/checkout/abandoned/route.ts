import { NextResponse } from "next/server";
import { sendAbandonedCheckoutEmail } from "@/lib/email";
import { markAbandonedEmailSent, readAbandonedCheckoutOrders } from "@/lib/supabase/order-store";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (request.headers.get("x-vercel-cron") === "1") {
    return true;
  }

  if (!cronSecret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

async function runAbandonedCheckoutEmails(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Unauthorized."
      },
      { status: 401 }
    );
  }

  const requestUrl = new URL(request.url);
  const cutoff = new Date(Date.now() - 1000 * 60 * 60).toISOString();
  const orders = await readAbandonedCheckoutOrders(cutoff);

  for (const order of orders) {
    await sendAbandonedCheckoutEmail({
      to: order.customerEmail,
      productName: order.productName,
      shopUrl: new URL("/shop", requestUrl.origin).toString()
    });
    await markAbandonedEmailSent(order.id);
  }

  return NextResponse.json({
    ok: true,
    sent: orders.length
  });
}

export async function GET(request: Request) {
  try {
    return await runAbandonedCheckoutEmails(request);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Could not send abandoned checkout emails."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
