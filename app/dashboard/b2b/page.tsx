import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, Link2 } from "lucide-react";
import { CardAnalytics } from "@/components/card-analytics";
import { ProductManager } from "@/components/product-manager";
import { readCardsForUser, readTapEventsForCards } from "@/lib/card-repository";
import { getCurrentProfile } from "@/lib/user-repository";

export const metadata: Metadata = {
  title: "B2B Customers",
  description: "Manage B2B customer PulseTap products separately from other product databases."
};

export default async function B2BDashboardPage() {
  const cookieStore = await cookies();
  const cookieUserId = cookieStore.get("pulsetap_user_id")?.value ?? "";
  const profile = await getCurrentProfile(cookieUserId);
  const allCards = profile ? await readCardsForUser(profile.id) : [];
  const cards = allCards.filter((card) => card.database === "b2b");
  const tapEvents = cards.length ? await readTapEventsForCards(cards.map((card) => card.id)) : [];
  const activeProducts = cards.filter((card) => card.activated).length;
  const totalTaps = cards.reduce((sum, card) => sum + card.taps, 0);

  return (
    <main className="min-h-screen bg-ink">
      <section className="bg-premium-radial px-5 py-12 md:py-16">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard" className="focus-ring inline-flex items-center rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-white/78">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All products
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-pulse">B2B Database</p>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                B2B customer products only.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/66">
                This view only shows products from the separate B2B customer database.
              </p>
            </div>

            <div className="glass rounded-[2rem] p-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "B2B", value: cards.length, icon: BriefcaseBusiness },
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
              <Link
                href="/activate"
                className="focus-ring mt-4 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-pulse"
              >
                Activate B2B product
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CardAnalytics cards={cards} tapEvents={tapEvents} />
      <ProductManager cards={cards} />
    </main>
  );
}
