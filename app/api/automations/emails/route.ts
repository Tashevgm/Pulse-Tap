import { NextResponse } from "next/server";
import { sendAmazonReviewRequestEmail, sendEmailVerificationReminderEmail } from "@/lib/email";
import {
  claimAmazonReviewRequestEmail,
  claimEmailVerificationReminder,
  readAmazonReviewRequestCandidates,
  readEmailVerificationReminderCandidates,
  resendSupabaseVerificationEmail
} from "@/lib/supabase/email-automations";

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

function getOrigin(request: Request) {
  return process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
}

async function runEmailAutomations(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Unauthorized."
      },
      { status: 401 }
    );
  }

  const origin = getOrigin(request);
  const emailVerificationCutoff = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
  const reviewCutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();
  const verificationCandidates = await readEmailVerificationReminderCandidates(emailVerificationCutoff);
  const reviewCandidates = await readAmazonReviewRequestCandidates(reviewCutoff);
  let verificationRemindersSent = 0;
  let verificationRemindersSkipped = 0;
  let reviewRequestsSent = 0;
  let reviewRequestsSkipped = 0;

  for (const candidate of verificationCandidates) {
    const claimed = await claimEmailVerificationReminder(candidate.profileId);

    if (!claimed) {
      verificationRemindersSkipped += 1;
      continue;
    }

    const callbackUrl = new URL("/api/auth/callback", origin);
    callbackUrl.searchParams.set("next", "/dashboard");
    await resendSupabaseVerificationEmail(claimed.email, callbackUrl.toString());
    await sendEmailVerificationReminderEmail({
      to: claimed.email,
      verifyUrl: new URL("/login", origin).toString()
    });
    verificationRemindersSent += 1;
  }

  for (const candidate of reviewCandidates) {
    const claimed = await claimAmazonReviewRequestEmail(candidate);

    if (!claimed) {
      reviewRequestsSkipped += 1;
      continue;
    }

    await sendAmazonReviewRequestEmail({
      to: candidate.email,
      cardLabel: candidate.label
    });
    reviewRequestsSent += 1;
  }

  return NextResponse.json({
    ok: true,
    verificationRemindersSent,
    verificationRemindersSkipped,
    reviewRequestsSent,
    reviewRequestsSkipped
  });
}

export async function GET(request: Request) {
  try {
    return await runEmailAutomations(request);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Could not run email automations."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
