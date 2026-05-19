import {
  BadgeCheck,
  ChefHat,
  Instagram,
  Facebook,
  QrCode,
  Share2,
  Star,
  Users,
  Wifi
} from "lucide-react";

export type Product = {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  accent: string;
  cta: string;
};

export const products: Product[] = [
  {
    id: "google-review-card",
    title: "Google Review Card",
    category: "Google Review",
    description: "Send customers straight to your review page with a single tap or scan.",
    image: "/images/white-google-card.png",
    accent: "from-pulse/35 to-volt/25",
    cta: "View review cards"
  },
  {
    id: "instagram-card",
    title: "Instagram Tap Card",
    category: "Instagram",
    description: "Grow followers from counters, events and packaging without asking people to search.",
    image: "/images/instagram-card.png",
    accent: "from-coral/35 to-pulse/20",
    cta: "Open Instagram cards"
  },
  {
    id: "facebook-card",
    title: "Facebook Tap Card",
    category: "Facebook",
    description: "Send customers straight to your Facebook page, reviews or latest social updates.",
    image: "/images/facebook-card.png",
    accent: "from-white/25 to-pulse/25",
    cta: "Explore Facebook cards"
  },
  {
    id: "google-review-stand",
    title: "Google Review Stand",
    category: "Google Review",
    description: "Place a premium NFC and QR review stand at reception, tables or checkout.",
    image: "/images/google-review-stand.jpg",
    accent: "from-volt/30 to-pulse/25",
    cta: "View review stands"
  },
  {
    id: "nfc-business-card",
    title: "NFC Business Card",
    category: "Business Cards",
    description: "Premium profile cards with editable links, QR backup and no app requirement.",
    image: "https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?auto=format&fit=crop&w=1200&q=80",
    accent: "from-pulse/30 to-white/15",
    cta: "Build your profile"
  },
  {
    id: "instagram-follow-stand",
    title: "Instagram Follow Us Stand",
    category: "Instagram",
    description: "Place an NFC and QR stand on counters or tables so customers can follow instantly.",
    image: "/images/instagram-review-stand.jpg",
    accent: "from-coral/30 to-volt/20",
    cta: "View Instagram stands"
  },
  {
    id: "custom-stand",
    title: "Custom NFC + QR Stand",
    category: "Custom Stand",
    description: "A branded counter stand built around your chosen destination, from reviews to socials or menus.",
    image: "/images/custom-stand.jpg",
    accent: "from-pulse/30 to-volt/20",
    cta: "Build a custom stand"
  }
];

export const categories = [
  { name: "Google Review", icon: Star, copy: "Collect reviews at the point of experience." },
  { name: "Instagram", icon: Instagram, copy: "Make following your brand instant." },
  { name: "Facebook", icon: Facebook, copy: "Connect customers to your Facebook presence." },
  { name: "WiFi", icon: Wifi, copy: "No typing passwords at the counter." },
  { name: "Business Cards", icon: Users, copy: "Share editable professional profiles." },
  { name: "Restaurant Products", icon: ChefHat, copy: "Menus, reviews and WiFi in one tap." }
];

export const steps = [
  { title: "Tap or Scan", copy: "Your customer taps the NFC chip or scans the QR backup.", icon: QrCode },
  { title: "Open Instantly", copy: "The right link opens in the browser. No downloads or accounts required.", icon: Share2 },
  { title: "Update Anytime", copy: "Change the destination behind the product without reprinting.", icon: BadgeCheck }
];
