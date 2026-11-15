import { NextResponse } from "next/server";
import { sendAmazonReviewRequestEmail, sendEmailVerificationReminderEmail } from "@/lib/email";
import {
  claimEmailVerificationReminder,
  markAmazonReviewRequestEmailSent,
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
  let verificationRemindersSent = 0;
  let verificationRemindersSkipped = 0;
  let verificationRemindersFailed = 0;
  let reviewRequestsSent = 0;
  let reviewRequestsSkipped = 0;
  let reviewRequestsFailed = 0;

  // Run each automation independently so a failure in account verification
  // reminders cannot prevent Amazon review reminders from being processed.
  try {
    const verificationCandidates = await readEmailVerificationReminderCandidates(emailVerificationCutoff);

    for (const candidate of verificationCandidates) {
      try {
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
      } catch (error) {
        verificationRemindersFailed += 1;
        console.error("Email verification reminder failed.", error);
      }
    }
  } catch (error) {
    verificationRemindersFailed += 1;
    console.error("Could not load email verification reminder candidates.", error);
  }

  try {
    const reviewResult = await readAmazonReviewRequestCandidates(reviewCutoff);
    reviewRequestsSkipped += reviewResult.skipped;

    for (const candidate of reviewResult.candidates) {
      try {
        await sendAmazonReviewRequestEmail({
          to: candidate.email,
          cardLabel: candidate.label
        });
        await markAmazonReviewRequestEmailSent(candidate);
        reviewRequestsSent += 1;
      } catch (error) {
        reviewRequestsFailed += 1;
        console.error("Amazon review request failed.", error);
      }
    }
  } catch (error) {
    reviewRequestsFailed += 1;
    console.error("Could not load Amazon review request candidates.", error);
  }

  return NextResponse.json({
    ok: verificationRemindersFailed === 0 && reviewRequestsFailed === 0,
    verificationRemindersSent,
    verificationRemindersSkipped,
    verificationRemindersFailed,
    reviewRequestsSent,
    reviewRequestsSkipped,
    reviewRequestsFailed
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
