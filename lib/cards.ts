export type CardType =
  | "google-review"
  | "instagram"
  | "facebook"
  | "b2b-customer"
  | "google-review-stand";

export const CARD_DATABASES = ["google", "instagram", "facebook", "b2b"] as const;

export type CardDatabase = (typeof CARD_DATABASES)[number];

export type Card = {
  id: string;
  activationCode: string;
  claimToken: string;
  redirectUrl: string;
  activated: boolean;
  type: CardType;
  database: CardDatabase;
  ownerUserId?: string;
  label: string;
  taps: number;
  updatedAt: string;
  lastTappedAt?: string;
  activatedAt?: string;
};

function createSeedCards({
  database,
  prefix,
  activationPrefix,
  type,
  label,
  activeRedirect,
  count = 10
}: {
  database: CardDatabase;
  prefix: string;
  activationPrefix: string;
  type: CardType;
  label: string;
  activeRedirect: string;
  count?: number;
}): Card[] {
  return Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(3, "0");
    return {
      id: `${prefix}${number}`,
      activationCode: `${activationPrefix}-${number}`,
      claimToken: `${database}-claim-${number.toLowerCase()}-${prefix.toLowerCase()}`,
      redirectUrl: "",
      activated: false,
      type,
      database,
      label: `${label} ${number}`,
      taps: 0,
      updatedAt: "2026-05-08"
    };
  });
}

export const seedCardDatabases: Record<CardDatabase, Card[]> = {
  google: createSeedCards({
    database: "google",
    prefix: "PTG",
    activationPrefix: "GOOGLE",
    type: "google-review",
    label: "Google review card",
    activeRedirect: "https://www.google.com/search?q=Pixel+Solutions+Ltd"
  }),
  instagram: createSeedCards({
    database: "instagram",
    prefix: "PTI",
    activationPrefix: "INSTAGRAM",
    type: "instagram",
    label: "Instagram card",
    activeRedirect: "https://www.instagram.com"
  }),
  facebook: createSeedCards({
    database: "facebook",
    prefix: "PTF",
    activationPrefix: "FACEBOOK",
    type: "facebook",
    label: "Facebook card",
    activeRedirect: "https://www.facebook.com"
  }),
  b2b: createSeedCards({
    database: "b2b",
    prefix: "PTB",
    activationPrefix: "B2B",
    type: "b2b-customer",
    label: "B2B customer card",
    activeRedirect: "https://www.pulse-tap.com",
    count: 500
  })
};

export function normalizeUrl(url: string) {
  const trimmed = url.trim();

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}
