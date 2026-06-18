import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { products } from "@/lib/products";
import { shopProducts } from "@/lib/shop-products";
import { ShopCart } from "@/components/shop-cart";

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop PulseTap NFC and QR smart products for reviews, socials, business profiles and customer touchpoints."
};

const trustItems = [
  { icon: PackageCheck, label: "NFC + QR ready" },
  { icon: BadgeCheck, label: "No app required" },
  { icon: ShieldCheck, label: "Editable after activation" },
  { icon: Truck, label: "UK and Ireland shipping" }
];

export default function ShopPage() {
  const productById = new Map(products.map((product) => [product.id, product]));
  const shopItems = shopProducts
    .map((shopProduct) => {
      const product = productById.get(shopProduct.productId);

      return product
        ? {
            ...shopProduct,
            title: shopProduct.title ?? product.title,
            category: shopProduct.category ?? product.category,
            description: shopProduct.description ?? product.description,
            image: shopProduct.image ?? product.image
          }
        : null;
    })
    .filter((item) => item !== null);

  return (
    <main className="bg-ink">
      <section className="bg-premium-radial px-5 py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-pulse">PulseTap Shop</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
              Smart NFC and QR products, ready to activate.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/66">
              Premium cards and stands for reviews, socials, profiles and customer touchpoints. Tap. Activate. Done.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="#shop-grid"
                className="focus-ring inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-pulse"
              >
                Browse products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/activate"
                className="focus-ring inline-flex items-center rounded-full border border-white/14 px-5 py-3 text-sm font-semibold text-white/78 transition hover:text-white"
              >
                Activate a card
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {trustItems.map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.055] p-4">
                <item.icon className="h-5 w-5 text-pulse" />
                <p className="mt-3 text-sm font-semibold">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ShopCart items={shopItems} />

      <section className="px-5 pb-20">
        <div className="mx-auto grid max-w-7xl gap-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pulse">Secure checkout</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Secure checkout powered by Stripe.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
              Orders open Stripe Checkout with encrypted payment processing and shipping address collection for the UK and Ireland.
            </p>
          </div>
          <Link
            href="/activate"
            className="focus-ring inline-flex items-center justify-center rounded-full border border-white/14 px-5 py-3 text-sm font-semibold text-white/78 transition hover:text-white"
          >
            Already bought a card?
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
