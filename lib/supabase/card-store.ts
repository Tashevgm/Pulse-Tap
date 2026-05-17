import { normalizeUrl, type Card, type CardDatabase, type CardType } from "@/lib/cards";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type CardRow = {
  id: string;
  activation_code: string;
  claim_token: string;
  redirect_url: string;
  activated: boolean;
  card_type: CardType;
  card_database: CardDatabase;
  label: string;
  owner_profile_id: string | null;
  taps: number;
  updated_at: string;
};

function mapCardRow(row: CardRow): Card {
  return {
    id: row.id,
    activationCode: row.activation_code,
    claimToken: row.claim_token,
    redirectUrl: row.redirect_url,
    activated: row.activated,
    type: row.card_type,
    database: row.card_database,
    ownerUserId: row.owner_profile_id ?? undefined,
    label: row.label,
    taps: row.taps,
    updatedAt: row.updated_at.slice(0, 10)
  };
}

export async function readSupabaseCards() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as CardRow[]).map(mapCardRow);
}

export async function readSupabaseCardDatabases() {
  const cards = await readSupabaseCards();
  return {
    google: cards.filter((card) => card.database === "google"),
    instagram: cards.filter((card) => card.database === "instagram"),
    facebook: cards.filter((card) => card.database === "facebook")
  };
}

export async function findSupabaseCardByActivationCode(code: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("activation_code", code.trim().toUpperCase())
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapCardRow(data as CardRow) : null;
}

export async function findSupabaseCardByClaimToken(claimToken: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("claim_token", claimToken.trim())
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapCardRow(data as CardRow) : null;
}

export async function findSupabaseCardById(id: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("id", id.trim().toUpperCase())
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapCardRow(data as CardRow) : null;
}

async function activateSupabaseExistingCard(card: Card, redirectUrl: string, ownerProfileId?: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cards")
    .update({
      redirect_url: normalizeUrl(redirectUrl),
      activated: true,
      owner_profile_id: ownerProfileId || null,
      activated_at: new Date().toISOString()
    })
    .eq("id", card.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapCardRow(data as CardRow);
}

export async function activateSupabaseCard(activationCode: string, redirectUrl: string, ownerProfileId?: string) {
  const card = await findSupabaseCardByActivationCode(activationCode);
  return card ? activateSupabaseExistingCard(card, redirectUrl, ownerProfileId) : null;
}

export async function activateSupabaseCardByClaimToken(claimToken: string, redirectUrl: string, ownerProfileId?: string) {
  const card = await findSupabaseCardByClaimToken(claimToken);
  return card ? activateSupabaseExistingCard(card, redirectUrl, ownerProfileId) : null;
}

export async function updateSupabaseCardRedirect(cardId: string, redirectUrl: string) {
  const normalizedUrl = normalizeUrl(redirectUrl);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cards")
    .update({
      redirect_url: normalizedUrl,
      activated: normalizedUrl.length > 0
    })
    .eq("id", cardId.trim().toUpperCase())
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapCardRow(data as CardRow);
}

export async function recordSupabaseTap(cardId: string) {
  const card = await findSupabaseCardById(cardId);

  if (!card) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cards")
    .update({ taps: card.taps + 1 })
    .eq("id", card.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await supabase.from("tap_events").insert({
    card_id: card.id,
    redirect_url: card.redirectUrl
  });

  return mapCardRow(data as CardRow);
}

export async function readSupabaseCardsForUser(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("owner_profile_id", userId)
    .order("id", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as CardRow[]).map(mapCardRow);
}
