import {
  BadgeCheck,
  ChefHat,
  Instagram,
  MessageCircleHeart,
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
    image: "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=1200&q=80",
    accent: "from-pulse/35 to-volt/25",
    cta: "View review cards"
  },
  {
    id: "instagram-card",
    title: "Instagram Tap Card",
    category: "Instagram",
    description: "Grow followers from counters, events and packaging without asking people to search.",
    image: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=1200&q=80",
    accent: "from-coral/35 to-pulse/20",
    cta: "Open Instagram cards"
  },
  {
    id: "tiktok-card",
    title: "TikTok Creator Card",
    category: "TikTok",
    description: "Turn real-world attention into profile visits for creators, venues and retail teams.",
    image: "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?auto=format&fit=crop&w=1200&q=80",
    accent: "from-white/25 to-pulse/25",
    cta: "Explore TikTok cards"
  },
  {
    id: "wifi-connect-card",
    title: "WiFi Connect Card",
    category: "WiFi",
    description: "Let guests connect to WiFi through a clean NFC and QR touchpoint.",
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80",
    accent: "from-volt/30 to-pulse/25",
    cta: "See WiFi cards"
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
    id: "restaurant-table-stand",
    title: "Restaurant QR + NFC Stand",
    category: "Restaurant Products",
    description: "Launch menus, reviews, socials or WiFi from tables, counters and takeaway bags.",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    accent: "from-coral/30 to-volt/20",
    cta: "View restaurant products"
  }
];

export const categories = [
  { name: "Google Review", icon: Star, copy: "Collect reviews at the point of experience." },
  { name: "Instagram", icon: Instagram, copy: "Make following your brand instant." },
  { name: "TikTok", icon: MessageCircleHeart, copy: "Convert attention into profile visits." },
  { name: "WiFi", icon: Wifi, copy: "No typing passwords at the counter." },
  { name: "Business Cards", icon: Users, copy: "Share editable professional profiles." },
  { name: "Restaurant Products", icon: ChefHat, copy: "Menus, reviews and WiFi in one tap." }
];

export const steps = [
  { title: "Tap or Scan", copy: "Your customer taps the NFC chip or scans the QR backup.", icon: QrCode },
  { title: "Open Instantly", copy: "The right link opens in the browser. No downloads or accounts required.", icon: Share2 },
  { title: "Update Anytime", copy: "Change the destination behind the product without reprinting.", icon: BadgeCheck }
];
