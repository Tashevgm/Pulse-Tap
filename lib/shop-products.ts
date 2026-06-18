export type ShopProduct = {
  id: string;
  productId: string;
  title?: string;
  category?: string;
  description?: string;
  image?: string;
  priceLabel: string;
  unitAmount: number;
  badge: string;
  finish: string;
};

export const shopProducts: ShopProduct[] = [
  {
    id: "google-review-card",
    productId: "google-review-card",
    image: "/images/google-white-card.png",
    priceLabel: "GBP 7.99",
    unitAmount: 799,
    badge: "Best for reviews",
    finish: "White NFC card"
  },
  {
    id: "google-review-card-black",
    productId: "google-review-card",
    title: "Google Review Card - Black",
    category: "Google Review",
    description: "A black NFC review card that sends customers straight to your Google review page.",
    image: "/images/google-black-card.png",
    priceLabel: "GBP 7.99",
    unitAmount: 799,
    badge: "Black finish",
    finish: "Black NFC card"
  },
  {
    id: "google-review-card-white-3-pack",
    productId: "google-review-card",
    title: "Google Review Card 3 Pack - White",
    category: "Google Review",
    description: "Three white NFC cards for collecting Google reviews across counters, tables or team members.",
    image: "/images/google-white-3-pack.png",
    priceLabel: "GBP 17.99",
    unitAmount: 1799,
    badge: "3 pack",
    finish: "3 x white NFC cards"
  },
  {
    id: "google-review-card-white-5-pack",
    productId: "google-review-card",
    title: "Google Review Card 5 Pack - White",
    category: "Google Review",
    description: "Five white NFC cards for businesses that need review touchpoints in multiple places.",
    image: "/images/google-white-5-pack.png",
    priceLabel: "GBP 24.99",
    unitAmount: 2499,
    badge: "5 pack",
    finish: "5 x white NFC cards"
  },
  {
    id: "google-review-card-black-3-pack",
    productId: "google-review-card",
    title: "Google Review Card 3 Pack - Black",
    category: "Google Review",
    description: "Three black NFC cards for premium Google review collection around your business.",
    image: "/images/google-black-3-pack.png",
    priceLabel: "GBP 17.99",
    unitAmount: 1799,
    badge: "3 pack",
    finish: "3 x black NFC cards"
  },
  {
    id: "google-review-card-black-5-pack",
    productId: "google-review-card",
    title: "Google Review Card 5 Pack - Black",
    category: "Google Review",
    description: "Five black NFC cards for teams, counters and multi-area customer touchpoints.",
    image: "/images/google-black-5-pack.png",
    priceLabel: "GBP 24.99",
    unitAmount: 2499,
    badge: "5 pack",
    finish: "5 x black NFC cards"
  },
  {
    id: "instagram-card",
    productId: "instagram-card",
    image: "/images/instagram-card.png",
    priceLabel: "GBP 7.99",
    unitAmount: 799,
    badge: "Social growth",
    finish: "Gradient NFC card"
  },
  {
    id: "instagram-card-3-pack",
    productId: "instagram-card",
    title: "Instagram Tap Card 3 Pack",
    category: "Instagram",
    description: "Three NFC cards that make following your Instagram profile instant from real-world touchpoints.",
    image: "/images/instagram-3-pack.png",
    priceLabel: "GBP 17.99",
    unitAmount: 1799,
    badge: "3 pack",
    finish: "3 x Instagram NFC cards"
  },
  {
    id: "instagram-card-5-pack",
    productId: "instagram-card",
    title: "Instagram Tap Card 5 Pack",
    category: "Instagram",
    description: "Five Instagram NFC cards for events, counters, packaging and staff handouts.",
    image: "/images/instagram-5-pack.png",
    priceLabel: "GBP 24.99",
    unitAmount: 2499,
    badge: "5 pack",
    finish: "5 x Instagram NFC cards"
  },
  {
    id: "facebook-card",
    productId: "facebook-card",
    image: "/images/facebook-card.png",
    priceLabel: "GBP 7.99",
    unitAmount: 799,
    badge: "Facebook ready",
    finish: "Blue NFC card"
  },
  {
    id: "facebook-card-3-pack",
    productId: "facebook-card",
    title: "Facebook Tap Card 3 Pack",
    category: "Facebook",
    description: "Three NFC cards for sending customers straight to your Facebook page, reviews or updates.",
    image: "/images/facebook-3-pack.png",
    priceLabel: "GBP 17.99",
    unitAmount: 1799,
    badge: "3 pack",
    finish: "3 x Facebook NFC cards"
  },
  {
    id: "facebook-card-5-pack",
    productId: "facebook-card",
    title: "Facebook Tap Card 5 Pack",
    category: "Facebook",
    description: "Five Facebook NFC cards for businesses with several customer-facing touchpoints.",
    image: "/images/facebook-5-pack.png",
    priceLabel: "GBP 24.99",
    unitAmount: 2499,
    badge: "5 pack",
    finish: "5 x Facebook NFC cards"
  },
  {
    id: "starter-bundle",
    productId: "google-review-card",
    title: "PulseTap Starter Bundle",
    category: "Bundle",
    description: "A mixed NFC card bundle for reviews and social growth across your main customer channels.",
    image: "/images/starter-bundle.png",
    priceLabel: "GBP 17.99",
    unitAmount: 1799,
    badge: "Bundle",
    finish: "Google, Instagram and Facebook NFC cards"
  },
  {
    id: "google-review-stand",
    productId: "google-review-stand",
    priceLabel: "GBP 14.99",
    unitAmount: 1499,
    badge: "Counter display",
    finish: "NFC + QR stand"
  },
  {
    id: "instagram-follow-stand",
    productId: "instagram-follow-stand",
    priceLabel: "GBP 14.99",
    unitAmount: 1499,
    badge: "Follow us stand",
    finish: "NFC + QR stand"
  },
  {
    id: "custom-stand",
    productId: "custom-stand",
    priceLabel: "GBP 19.99",
    unitAmount: 1999,
    badge: "Custom design",
    finish: "Custom NFC + QR stand"
  }
];

export function findShopProduct(id: string) {
  return shopProducts.find((product) => product.id === id) ?? null;
}
