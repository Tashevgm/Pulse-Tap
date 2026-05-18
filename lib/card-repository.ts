import {
  activateCard as activateLocalCard,
  activateCardByClaimToken as activateLocalCardByClaimToken,
  findCardByActivationCode as findLocalCardByActivationCode,
  findCardByClaimToken as findLocalCardByClaimToken,
  findCardById as findLocalCardById,
  readCardDatabases as readLocalCardDatabases,
  readCards as readLocalCards,
  readCardsForUser as readLocalCardsForUser,
  recordTap as recordLocalTap,
  updateCardRedirect as updateLocalCardRedirect
} from "@/lib/card-store";
import { hasSupabaseEnv } from "@/lib/supabase/server";
import {
  activateSupabaseCard,
  activateSupabaseCardByClaimToken,
  findSupabaseCardByActivationCode,
  findSupabaseCardByClaimToken,
  findSupabaseCardById,
  readSupabaseCardDatabases,
  readSupabaseCards,
  readSupabaseCardsForUser,
  recordSupabaseTap,
  updateSupabaseCardRedirect
} from "@/lib/supabase/card-store";

async function withFallback<T>(supabaseFn: () => Promise<T>, localFn: () => Promise<T>) {
  if (!hasSupabaseEnv()) {
    return localFn();
  }

  try {
    return await supabaseFn();
  } catch (error) {
    console.warn("Supabase unavailable, using local JSON fallback.", error);
    return localFn();
  }
}

export async function readCards() {
  return withFallback(readSupabaseCards, readLocalCards);
}

export async function readCardDatabases() {
  return withFallback(readSupabaseCardDatabases, readLocalCardDatabases);
}

export async function findCardByActivationCode(code: string) {
  return withFallback(
    () => findSupabaseCardByActivationCode(code),
    () => findLocalCardByActivationCode(code)
  );
}

export async function findCardByClaimToken(claimToken: string) {
  return withFallback(
    () => findSupabaseCardByClaimToken(claimToken),
    () => findLocalCardByClaimToken(claimToken)
  );
}

export async function findCardById(id: string) {
  return withFallback(
    () => findSupabaseCardById(id),
    () => findLocalCardById(id)
  );
}

export async function activateCard(activationCode: string, redirectUrl: string, ownerUserId?: string) {
  return withFallback(
    () => activateSupabaseCard(activationCode, redirectUrl, ownerUserId),
    () => activateLocalCard(activationCode, redirectUrl, ownerUserId)
  );
}

export async function activateCardByClaimToken(claimToken: string, redirectUrl: string, ownerUserId?: string) {
  return withFallback(
    () => activateSupabaseCardByClaimToken(claimToken, redirectUrl, ownerUserId),
    () => activateLocalCardByClaimToken(claimToken, redirectUrl, ownerUserId)
  );
}

export async function updateCardRedirect(cardId: string, redirectUrl: string) {
  return withFallback(
    () => updateSupabaseCardRedirect(cardId, redirectUrl),
    () => updateLocalCardRedirect(cardId, redirectUrl)
  );
}

export async function recordTap(cardId: string, metadata?: { userAgent?: string; referrer?: string }) {
  return withFallback(
    () => recordSupabaseTap(cardId, metadata),
    () => recordLocalTap(cardId)
  );
}

export async function readCardsForUser(userId: string) {
  return withFallback(
    () => readSupabaseCardsForUser(userId),
    () => readLocalCardsForUser(userId)
  );
}
