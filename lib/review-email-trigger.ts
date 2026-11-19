import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendAmazonReviewRequestEmail } from "@/lib/email";

// Re-read the stored count; callers cannot make a card eligible with request data.
export async function sendReviewEmailForCard(cardId: string) {
  const db = createSupabaseAdminClient();
  const { data: card, error } = await db.from("cards")
    .select("id,label,taps,owner_profile_id,amazon_review_request_email_sent_at")
    .eq("id", cardId).maybeSingle();
  if (error) throw error;
  if (!card || card.taps < 5 || !card.owner_profile_id || card.amazon_review_request_email_sent_at) return false;

  const { data: profile, error: profileError } = await db.from("profiles")
    .select("auth_user_id").eq("id", card.owner_profile_id).maybeSingle();
  if (profileError) throw profileError;
  if (!profile?.auth_user_id) return false;
  const { data, error: authError } = await db.auth.admin.getUserById(profile.auth_user_id);
  if (authError) {
    if (authError.code === "user_not_found" || authError.status === 404) return false;
    throw authError;
  }
  const user = data.user;
  if (!user?.email || !(user.email_confirmed_at || user.confirmed_at)) return false;

  // Atomic claim prevents simultaneous taps from sending duplicate emails.
  const claimedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await db.from("cards")
    .update({ amazon_review_request_email_sent_at: claimedAt })
    .eq("id", card.id).eq("owner_profile_id", card.owner_profile_id)
    .gte("taps", 5).is("amazon_review_request_email_sent_at", null)
    .select("id").maybeSingle();
  if (claimError) throw claimError;
  if (!claimed) return false;

  try {
    await sendAmazonReviewRequestEmail({
      to: user.email,
      cardLabel: card.label,
      idempotencyKey: `card-review/${card.id}`
    });
    return true;
  } catch (sendError) {
    // Failed sends, including quota failures, remain eligible on the next tap.
    const { error: releaseError } = await db.from("cards")
      .update({ amazon_review_request_email_sent_at: null })
      .eq("id", card.id).eq("amazon_review_request_email_sent_at", claimedAt);
    if (releaseError) console.error("Could not release review email claim.", releaseError);
    throw sendError;
  }
}
