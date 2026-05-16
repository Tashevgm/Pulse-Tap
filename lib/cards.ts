export type CardType =
  | "google-review"
  | "instagram"
  | "tiktok"
  | "wifi"
  | "business-card"
  | "restaurant";

export type Card = {
  id: string;
  activationCode: string;
  redirectUrl: string;
  activated: boolean;
  type: CardType;
  label: string;
  taps: number;
  updatedAt: string;
};

const globalForCards = globalThis as unknown as {
  pulseTapCards?: Card[];
};

export const mockCards: Card[] =
  globalForCards.pulseTapCards ??
  [
    {
      id: "PT0001",
      activationCode: "PULSE-0001",
      redirectUrl: "https://www.google.com/search?q=Pixel+Solutions+Ltd",
      activated: true,
      type: "google-review",
      label: "Google review counter card",
      taps: 128,
      updatedAt: "2026-05-01"
    },
    {
      id: "PT0002",
      activationCode: "PULSE-0002",
      redirectUrl: "",
      activated: false,
      type: "business-card",
      label: "Founder NFC business card",
      taps: 0,
      updatedAt: "2026-05-08"
    },
    {
      id: "PT0003",
      activationCode: "PULSE-0003",
      redirectUrl: "https://pulse-menu.com",
      activated: true,
      type: "restaurant",
      label: "Restaurant table stand",
      taps: 74,
      updatedAt: "2026-05-11"
    }
  ];

globalForCards.pulseTapCards = mockCards;

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

export function findCardByActivationCode(code: string) {
  const normalized = code.trim().toUpperCase();
  return mockCards.find((card) => card.activationCode.toUpperCase() === normalized);
}

export function findCardById(id: string) {
  return mockCards.find((card) => card.id.toUpperCase() === id.trim().toUpperCase());
}
