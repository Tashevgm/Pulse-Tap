import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { categories, products } from "@/lib/products";
import { SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Products",
  description: "Explore PulseTap NFC and QR products for reviews, socials, WiFi, business cards and restaurants."
};

export default function ProductsPage() {
  return (
    <main className="bg-ink">
      <section className="bg-premium-radial px-5 py-20">
        <SectionHeading
          eyebrow="Catalog"
          title="Smart products for real customer moments."
          copy="Browse the V1 PulseTap product ecosystem. Checkout is intentionally not included yet; product actions can link to Amazon, a future store or product detail pages."
        />
      </section>

      <section className="px-5 py-16">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article key={product.id} className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045]">
              <div className="relative h-72 overflow-hidden bg-white">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  quality={100}
                  className={`transition duration-500 group-hover:scale-105 ${
                    product.id === "instagram-card" || product.id === "facebook-card" ? "object-contain p-3" : "object-cover"
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/42 via-transparent to-transparent" />
                <div className="absolute left-4 top-4 rounded-full border border-white/18 bg-black/45 px-3 py-1 text-xs font-medium">
                  {product.category}
                </div>
              </div>
              <div className="p-5">
                <h2 className="text-2xl font-semibold tracking-tight">{product.title}</h2>
                <p className="mt-3 text-sm leading-6 text-white/60">{product.description}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/activate" className="focus-ring inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-pulse">
                    {product.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link href="/support" className="focus-ring inline-flex items-center rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-white/78 transition hover:text-white">
                    Setup guide
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 pb-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pulse">Categories</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div key={category.name} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <category.icon className="h-5 w-5 text-volt" />
                <h3 className="mt-4 font-semibold">{category.name}</h3>
                <p className="mt-2 text-sm leading-6 text-white/58">{category.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
