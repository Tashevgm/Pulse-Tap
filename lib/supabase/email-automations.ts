import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type VerificationReminderCandidate = {
  profileId: string;
  authUserId: string;
  email: string;
};

export type ReviewRequestCandidate = {
  table: "cards" | "b2b_customer_cards";
  tapEventsTable: "tap_events" | "b2b_tap_events";
  cardId: string;
  label: string;
  ownerProfileId: string;
  email: string;
  taps: number;
  activatedAt: string;
};

type ProfileReminderRow = {
  id: string;
  auth_user_id: string;
  email: string;
};

type CardCandidateRow = {
  id: string;
  label: string;
  owner_profile_id: string;
  taps: number;
  activated_at: string;
};

type ProfileEmailRow = {
  id: string;
  email: string;
};

function isEmailUser(user: User) {
  return (user.app_metadata.provider as string | undefined) === "email";
}

function isUnverified(user: User) {
  return Boolean(user.email && !user.email_confirmed_at && !user.confirmed_at);
}

export async function readEmailVerificationReminderCandidates(cutoffIso: string) {
  const supabase = createSupabaseAdminClient();
  const candidates: VerificationReminderCandidate[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000
    });

    if (error) {
      throw error;
    }

    const authUsers = data.users.filter(
      (user) => isEmailUser(user) && isUnverified(user) && new Date(user.created_at).getTime() <= new Date(cutoffIso).getTime()
    );

    if (authUsers.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id,auth_user_id,email")
        .in(
          "auth_user_id",
          authUsers.map((user) => user.id)
        )
        .is("email_verification_reminder_sent_at", null);

      if (profileError) {
        throw profileError;
      }

      const usersById = new Map(authUsers.map((user) => [user.id, user]));

      candidates.push(
        ...(profiles as ProfileReminderRow[]).map((profile) => ({
          profileId: profile.id,
          authUserId: profile.auth_user_id,
          email: usersById.get(profile.auth_user_id)?.email ?? profile.email
        }))
      );
    }

    if (!data.nextPage) {
      break;
    }

    page = data.nextPage;
  }

  return candidates;
}

export async function claimEmailVerificationReminder(profileId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      email_verification_reminder_sent_at: new Date().toISOString()
    })
    .eq("id", profileId)
    .is("email_verification_reminder_sent_at", null)
    .select("id,auth_user_id,email")
    .maybeSingle<ProfileReminderRow>();

  if (error) {
    throw error;
  }

  return data
    ? {
        profileId: data.id,
        authUserId: data.auth_user_id,
        email: data.email
      }
    : null;
}

export async function resendSupabaseVerificationEmail(email: string, redirectTo: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: redirectTo
    }
  });

  if (error) {
    console.warn(`Could not resend Supabase verification email to ${email}.`, error);
  }
}

async function readCardCandidates({
  table,
  tapEventsTable,
  cutoffIso
}: {
  table: "cards" | "b2b_customer_cards";
  tapEventsTable: "tap_events" | "b2b_tap_events";
  cutoffIso: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(table)
    .select("id,label,owner_profile_id,taps,activated_at")
    .not("owner_profile_id", "is", null)
    .is("amazon_review_request_email_sent_at", null)
    .gte("taps", 5)
    .lte("activated_at", cutoffIso)
    .order("activated_at", { ascending: true })
    .limit(50);

  if (error) {
    throw error;
  }

  const rows = data as CardCandidateRow[];

  if (rows.length === 0) {
    return [];
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id,email")
    .in(
      "id",
      rows.map((row) => row.owner_profile_id)
    );

  if (profilesError) {
    throw profilesError;
  }

  const emailByProfileId = new Map((profiles as ProfileEmailRow[]).map((profile) => [profile.id, profile.email]));
  const candidates: ReviewRequestCandidate[] = [];

  for (const row of rows) {
    const email = emailByProfileId.get(row.owner_profile_id);

    if (!email) {
      continue;
    }

    candidates.push({
      table,
      tapEventsTable,
      cardId: row.id,
      label: row.label,
      ownerProfileId: row.owner_profile_id,
      email,
      taps: row.taps,
      activatedAt: row.activated_at
    });
  }

  return candidates;
}

export async function readAmazonReviewRequestCandidates(cutoffIso: string) {
  return readCardCandidates({
    table: "cards",
    tapEventsTable: "tap_events",
    cutoffIso
  });
}

export async function claimAmazonReviewRequestEmail(candidate: ReviewRequestCandidate) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(candidate.table)
    .update({
      amazon_review_request_email_sent_at: new Date().toISOString()
    })
    .eq("id", candidate.cardId)
    .is("amazon_review_request_email_sent_at", null)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    throw error;
  }

  return Boolean(data);
}
