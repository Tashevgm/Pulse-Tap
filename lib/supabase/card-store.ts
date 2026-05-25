import { CARD_DATABASES, normalizeUrl, type Card, type CardDatabase, type CardType } from "@/lib/cards";
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
  activated_at?: string | null;
  last_tapped_at?: string | null;
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
    updatedAt: row.updated_at.slice(0, 10),
    activatedAt: row.activated_at ?? undefined,
    lastTappedAt: row.last_tapped_at ?? undefined
  };
}

function isB2BCardId(cardId: string) {
  return cardId.trim().toUpperCase().startsWith("PTB");
}

function cardTableName(card: Pick<Card, "database">) {
  return card.database === "b2b" ? "b2b_customer_cards" : "cards";
}

function tapEventsTableName(card: Pick<Card, "database">) {
  return card.database === "b2b" ? "b2b_tap_events" : "tap_events";
}

async function addLastTapData(cards: Card[]) {
  if (cards.length === 0) {
    return cards;
  }

  const supabase = createSupabaseAdminClient();
  const latestByCard = new Map<string, string>();

  for (const database of ["standard", "b2b"] as const) {
    const scopedCards = cards.filter((card) => (database === "b2b" ? card.database === "b2b" : card.database !== "b2b"));

    if (scopedCards.length === 0) {
      continue;
    }

    const { data, error } = await supabase
      .from(database === "b2b" ? "b2b_tap_events" : "tap_events")
      .select("card_id,created_at")
      .in(
        "card_id",
        scopedCards.map((card) => card.id)
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    for (const event of data as Array<{ card_id: string; created_at: string }>) {
      if (!latestByCard.has(event.card_id)) {
        latestByCard.set(event.card_id, event.created_at);
      }
    }
  }

  return cards.map((card) => ({
    ...card,
    lastTappedAt: latestByCard.get(card.id) ?? card.lastTappedAt
  }));
}

export async function readSupabaseCards() {
  const supabase = createSupabaseAdminClient();
  const { data: standardData, error: standardError } = await supabase
    .from("cards")
    .select("*")
    .order("id", { ascending: true });

  if (standardError) {
    throw standardError;
  }

  const { data: b2bData, error: b2bError } = await supabase
    .from("b2b_customer_cards")
    .select("*")
    .order("id", { ascending: true });

  if (b2bError) {
    throw b2bError;
  }

  return addLastTapData([...(standardData as CardRow[]), ...(b2bData as CardRow[])].map(mapCardRow));
}

export async function readSupabaseCardDatabases() {
  const cards = await readSupabaseCards();
  return Object.fromEntries(
    CARD_DATABASES.map((database) => [database, cards.filter((card) => card.database === database)])
  ) as Record<CardDatabase, Card[]>;
}

export async function findSupabaseCardByActivationCode(code: string) {
  const supabase = createSupabaseAdminClient();
  const normalizedCode = code.trim().toUpperCase();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("activation_code", normalizedCode)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return mapCardRow(data as CardRow);
  }

  const { data: b2bData, error: b2bError } = await supabase
    .from("b2b_customer_cards")
    .select("*")
    .eq("activation_code", normalizedCode)
    .maybeSingle();

  if (b2bError) {
    throw b2bError;
  }

  return b2bData ? mapCardRow(b2bData as CardRow) : null;
}

export async function findSupabaseCardByClaimToken(claimToken: string) {
  const supabase = createSupabaseAdminClient();
  const normalizedClaimToken = claimToken.trim();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("claim_token", normalizedClaimToken)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return mapCardRow(data as CardRow);
  }

  const { data: b2bData, error: b2bError } = await supabase
    .from("b2b_customer_cards")
    .select("*")
    .eq("claim_token", normalizedClaimToken)
    .maybeSingle();

  if (b2bError) {
    throw b2bError;
  }

  return b2bData ? mapCardRow(b2bData as CardRow) : null;
}

export async function findSupabaseCardById(id: string) {
  const supabase = createSupabaseAdminClient();
  const tableName = isB2BCardId(id) ? "b2b_customer_cards" : "cards";
  const { data, error } = await supabase
    .from(tableName)
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
    .from(cardTableName(card))
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
  const card = await findSupabaseCardById(cardId);

  if (!card) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(cardTableName(card))
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

export async function recordSupabaseTap(cardId: string, metadata?: { userAgent?: string; referrer?: string }) {
  const card = await findSupabaseCardById(cardId);

  if (!card) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from(cardTableName(card))
    .update({ taps: card.taps + 1 })
    .eq("id", card.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await supabase.from(tapEventsTableName(card)).insert({
    card_id: card.id,
    redirect_url: card.redirectUrl,
    user_agent: metadata?.userAgent ?? null,
    referrer: metadata?.referrer ?? null
  });

  return {
    ...mapCardRow(data as CardRow),
    lastTappedAt: new Date().toISOString()
  };
}

export async function readSupabaseCardsForUser(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: standardData, error: standardError } = await supabase
    .from("cards")
    .select("*")
    .eq("owner_profile_id", userId)
    .order("id", { ascending: true });

  if (standardError) {
    throw standardError;
  }

  const { data: b2bData, error: b2bError } = await supabase
    .from("b2b_customer_cards")
    .select("*")
    .eq("owner_profile_id", userId)
    .order("id", { ascending: true });

  if (b2bError) {
    throw b2bError;
  }

  return addLastTapData([...(standardData as CardRow[]), ...(b2bData as CardRow[])].map(mapCardRow));
}

export type TapEvent = {
  cardId: string;
  redirectUrl: string;
  userAgent?: string;
  referrer?: string;
  createdAt: string;
};

export async function readSupabaseTapEventsForCards(cardIds: string[]) {
  if (cardIds.length === 0) {
    return [];
  }

  const supabase = createSupabaseAdminClient();
  const events: TapEvent[] = [];

  for (const database of ["standard", "b2b"] as const) {
    const scopedCardIds = cardIds.filter((cardId) => (database === "b2b" ? isB2BCardId(cardId) : !isB2BCardId(cardId)));

    if (scopedCardIds.length === 0) {
      continue;
    }

    const { data, error } = await supabase
      .from(database === "b2b" ? "b2b_tap_events" : "tap_events")
      .select("card_id,redirect_url,user_agent,referrer,created_at")
      .in("card_id", scopedCardIds)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      throw error;
    }

    events.push(
      ...(data as Array<{
        card_id: string;
        redirect_url: string;
        user_agent: string | null;
        referrer: string | null;
        created_at: string;
      }>).map((event) => ({
        cardId: event.card_id,
        redirectUrl: event.redirect_url,
        userAgent: event.user_agent ?? undefined,
        referrer: event.referrer ?? undefined,
        createdAt: event.created_at
      }))
    );
  }

  return events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 500);
}
