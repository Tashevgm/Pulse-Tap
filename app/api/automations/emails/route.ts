import { NextResponse } from "next/server";
import { runAbandonedCheckoutAutomation } from "@/lib/abandoned-checkout-automation";
import { sendEmailVerificationReminderEmail } from "@/lib/email";
import {
  claimEmailVerificationReminder,
  readEmailVerificationReminderCandidates,
  releaseEmailVerificationReminderClaim,
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
  let verificationRemindersSent = 0;
  let verificationRemindersSkipped = 0;
  let verificationRemindersFailed = 0;
  let abandonedCheckoutEmailsSent = 0;
  let abandonedCheckoutEmailsFailed = 0;

  // Run each automation independently.
  try {
    const verificationCandidates = await readEmailVerificationReminderCandidates(emailVerificationCutoff);

    for (const candidate of verificationCandidates) {
      let claimed: Awaited<ReturnType<typeof claimEmailVerificationReminder>> = null;
      try {
        claimed = await claimEmailVerificationReminder(candidate.profileId);

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
        if (claimed) {
          try {
            await releaseEmailVerificationReminderClaim(claimed.profileId, claimed.claimedAt);
          } catch (releaseError) {
            console.error("Could not release verification reminder claim.", releaseError);
          }
        }
        verificationRemindersFailed += 1;
        console.error("Email verification reminder failed.", error);
      }
    }
  } catch (error) {
    verificationRemindersFailed += 1;
    console.error("Could not load email verification reminder candidates.", error);
  }

  // Review emails are sent individually after a card tap, not by this daily job.

  // Hobby plans allow only one daily cron schedule, so run abandoned checkout
  // reminders in this same daily job rather than scheduling a second cron.
  try {
    const abandonedResult = await runAbandonedCheckoutAutomation(origin);
    abandonedCheckoutEmailsSent = abandonedResult.sent;
    abandonedCheckoutEmailsFailed = abandonedResult.failed;
  } catch (error) {
    abandonedCheckoutEmailsFailed += 1;
    console.error("Could not run abandoned checkout email automation.", error);
  }

  const ok = verificationRemindersFailed === 0 && abandonedCheckoutEmailsFailed === 0;

  return NextResponse.json({
    ok,
    verificationRemindersSent,
    verificationRemindersSkipped,
    verificationRemindersFailed,
    abandonedCheckoutEmailsSent,
    abandonedCheckoutEmailsFailed
  }, { status: ok ? 200 : 500 });
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
