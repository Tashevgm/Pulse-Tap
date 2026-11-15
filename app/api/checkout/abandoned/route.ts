import { NextResponse } from "next/server";
import { runAbandonedCheckoutAutomation } from "@/lib/abandoned-checkout-automation";

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

  const result = await runAbandonedCheckoutAutomation(new URL(request.url).origin);

  return NextResponse.json({
    ok: true,
    ...result
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
