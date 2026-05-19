export type ShopProduct = {
  id: string;
  productId: string;
  priceLabel: string;
  unitAmount: number;
  badge: string;
  finish: string;
};

export const shopProducts: ShopProduct[] = [
  {
    id: "google-review-card",
    productId: "google-review-card",
    priceLabel: "GBP 14.99",
    unitAmount: 1499,
    badge: "Best for reviews",
    finish: "White NFC card"
  },
  {
    id: "instagram-card",
    productId: "instagram-card",
    priceLabel: "GBP 14.99",
    unitAmount: 1499,
    badge: "Social growth",
    finish: "Gradient NFC card"
  },
  {
    id: "facebook-card",
    productId: "facebook-card",
    priceLabel: "GBP 14.99",
    unitAmount: 1499,
    badge: "Facebook ready",
    finish: "Blue NFC card"
  },
  {
    id: "google-review-stand",
    productId: "google-review-stand",
    priceLabel: "GBP 24.99",
    unitAmount: 2499,
    badge: "Counter display",
    finish: "NFC + QR stand"
  },
  {
    id: "instagram-follow-stand",
    productId: "instagram-follow-stand",
    priceLabel: "GBP 24.99",
    unitAmount: 2499,
    badge: "Follow us stand",
    finish: "NFC + QR stand"
  },
  {
    id: "nfc-business-card",
    productId: "nfc-business-card",
    priceLabel: "GBP 19.99",
    unitAmount: 1999,
    badge: "Editable profile",
    finish: "Premium profile card"
  }
];

export function findShopProduct(id: string) {
  return shopProducts.find((product) => product.id === id) ?? null;
}
