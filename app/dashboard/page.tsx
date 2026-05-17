import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Box, Link2, Sparkles } from "lucide-react";
import { ProductManager } from "@/components/product-manager";
import { readCardsForUser } from "@/lib/card-repository";
import { getUserById } from "@/lib/user-store";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage PulseTap products, editable redirect URLs, QR codes and profile settings."
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("pulsetap_user_id")?.value ?? "";
  const user = userId ? await getUserById(userId) : null;
  const accountName = user?.companyName ?? "Pixel Solutions Ltd";
  const accountEmail = user?.email ?? "demo@pulsetap.co.uk";
  const cards = userId ? await readCardsForUser(userId) : [];
  const activeProducts = cards.filter((card) => card.activated).length;
  const totalTaps = cards.reduce((sum, card) => sum + card.taps, 0);

  return (
    <main className="min-h-screen bg-ink">
      <section className="bg-premium-radial px-5 py-12 md:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-pulse">User Profile</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
              All your PulseTap products in one place.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/66">
              Products appear here only after you activate them with the code supplied with your NFC or QR card.
            </p>
          </div>

          <div className="glass rounded-[2rem] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/54">{user ? "Google account" : "Demo account"}</p>
                <h2 className="mt-1 text-2xl font-semibold">{accountName}</h2>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  {accountEmail} · Owner access · NFC and QR products · Editable redirects
                </p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-ink">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: "Products", value: cards.length, icon: Box },
                { label: "Active", value: activeProducts, icon: BadgeCheck },
                { label: "Taps", value: totalTaps, icon: Link2 }
              ].map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <stat.icon className="h-4 w-4 text-pulse" />
                  <p className="mt-4 text-2xl font-semibold">{stat.value}</p>
                  <p className="mt-1 text-xs text-white/48">{stat.label}</p>
                </div>
              ))}
            </div>
            {cards.length === 0 ? (
              <Link
                href="/activate"
                className="focus-ring mt-4 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-pulse"
              >
                Activate your first product
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <ProductManager cards={cards} />
    </main>
  );
}
