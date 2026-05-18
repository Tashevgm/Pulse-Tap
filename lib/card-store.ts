import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import { normalizeUrl, seedCardDatabases, type Card, type CardDatabase } from "@/lib/cards";

const dataDirectory = path.join(process.cwd(), "data");

const databaseFiles: Record<CardDatabase, string> = {
  google: path.join(dataDirectory, "google-cards.json"),
  instagram: path.join(dataDirectory, "instagram-cards.json"),
  facebook: path.join(dataDirectory, "facebook-cards.json")
};

const databases = Object.keys(databaseFiles) as CardDatabase[];

async function ensureDatabaseFile(database: CardDatabase) {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(databaseFiles[database], "utf8");
  } catch {
    await writeDatabaseCards(database, seedCardDatabases[database]);
  }
}

async function readDatabaseCards(database: CardDatabase) {
  await ensureDatabaseFile(database);
  const raw = await readFile(databaseFiles[database], "utf8");
  return JSON.parse(raw) as Card[];
}

async function writeDatabaseCards(database: CardDatabase, cards: Card[]) {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(databaseFiles[database], `${JSON.stringify(cards, null, 2)}\n`, "utf8");
}

function getCardDatabase(card: Card): CardDatabase {
  return card.database;
}

export async function readCardDatabases() {
  noStore();
  const entries = await Promise.all(
    databases.map(async (database) => {
      const cards = await readDatabaseCards(database);
      return [database, cards] as const;
    })
  );

  return Object.fromEntries(entries) as Record<CardDatabase, Card[]>;
}

export async function readCards() {
  const cardDatabases = await readCardDatabases();
  return databases.flatMap((database) => cardDatabases[database]);
}

export async function findCardByActivationCode(code: string) {
  const cards = await readCards();
  const normalized = code.trim().toUpperCase();
  return cards.find((card) => card.activationCode.toUpperCase() === normalized) ?? null;
}

export async function findCardByClaimToken(claimToken: string) {
  const cards = await readCards();
  const normalized = claimToken.trim();
  return cards.find((card) => card.claimToken === normalized) ?? null;
}

export async function findCardById(id: string) {
  const cards = await readCards();
  return cards.find((card) => card.id.toUpperCase() === id.trim().toUpperCase()) ?? null;
}

async function activateExistingCard(existingCard: Card, redirectUrl: string, ownerUserId?: string) {
  const database = getCardDatabase(existingCard);
  const cards = await readDatabaseCards(database);
  const cardIndex = cards.findIndex((card) => card.id === existingCard.id);

  if (cardIndex === -1) {
    return null;
  }

  const updatedCard: Card = {
    ...cards[cardIndex],
    redirectUrl: normalizeUrl(redirectUrl),
    activated: true,
    ownerUserId,
    updatedAt: new Date().toISOString().slice(0, 10)
  };

  await writeDatabaseCards(database, cards.toSpliced(cardIndex, 1, updatedCard));
  return updatedCard;
}

export async function activateCard(activationCode: string, redirectUrl: string, ownerUserId?: string) {
  const existingCard = await findCardByActivationCode(activationCode);

  if (!existingCard) {
    return null;
  }

  return activateExistingCard(existingCard, redirectUrl, ownerUserId);
}

export async function activateCardByClaimToken(claimToken: string, redirectUrl: string, ownerUserId?: string) {
  const existingCard = await findCardByClaimToken(claimToken);

  if (!existingCard) {
    return null;
  }

  return activateExistingCard(existingCard, redirectUrl, ownerUserId);
}

export async function updateCardRedirect(cardId: string, redirectUrl: string) {
  const existingCard = await findCardById(cardId);

  if (!existingCard) {
    return null;
  }

  const database = getCardDatabase(existingCard);
  const cards = await readDatabaseCards(database);
  const cardIndex = cards.findIndex((card) => card.id.toUpperCase() === cardId.trim().toUpperCase());

  if (cardIndex === -1) {
    return null;
  }

  const normalizedUrl = normalizeUrl(redirectUrl);
  const updatedCard: Card = {
    ...cards[cardIndex],
    redirectUrl: normalizedUrl,
    activated: normalizedUrl.length > 0,
    updatedAt: new Date().toISOString().slice(0, 10)
  };

  await writeDatabaseCards(database, cards.toSpliced(cardIndex, 1, updatedCard));
  return updatedCard;
}

export async function recordTap(cardId: string) {
  const existingCard = await findCardById(cardId);

  if (!existingCard) {
    return null;
  }

  const database = getCardDatabase(existingCard);
  const cards = await readDatabaseCards(database);
  const cardIndex = cards.findIndex((card) => card.id.toUpperCase() === cardId.trim().toUpperCase());

  if (cardIndex === -1) {
    return null;
  }

  const tappedCard: Card = {
    ...cards[cardIndex],
    taps: cards[cardIndex].taps + 1,
    lastTappedAt: new Date().toISOString()
  };

  await writeDatabaseCards(database, cards.toSpliced(cardIndex, 1, tappedCard));
  return tappedCard;
}

export async function readCardsForUser(userId: string) {
  const cards = await readCards();
  return cards.filter((card) => card.ownerUserId === userId);
}
