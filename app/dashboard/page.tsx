import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Box, Database, Link2, Sparkles } from "lucide-react";
import { CardAnalytics } from "@/components/card-analytics";
import { ProductManager } from "@/components/product-manager";
import { readCardsForUser, readTapEventsForCards } from "@/lib/card-repository";
import { getCurrentProfile } from "@/lib/user-repository";
import { listDynamicQrCodes } from "@/lib/dynamic-qr";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage PulseTap products, editable redirect URLs, QR codes and profile settings."
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const cookieUserId = cookieStore.get("pulsetap_user_id")?.value ?? "";
  const profile = await getCurrentProfile(cookieUserId);
  const accountName = profile?.companyName ?? "PulseTap customer";
  const accountEmail = profile?.email ?? "Sign in to manage your cards";
  const cards = profile ? await readCardsForUser(profile.id) : [];
  const tapEvents = cards.length ? await readTapEventsForCards(cards.map((card) => card.id)) : [];
  const b2bCards = cards.filter((card) => card.database === "b2b");
  const activeProducts = cards.filter((card) => card.activated).length;
  const totalTaps = cards.reduce((sum, card) => sum + card.taps, 0);
  let qrCodes: Awaited<ReturnType<typeof listDynamicQrCodes>> = [];
  let qrUnavailable = false;
  if (profile?.isAuthenticated) {
    try {
      qrCodes = await listDynamicQrCodes(profile.id);
    } catch (error) {
      qrUnavailable = true;
      console.warn("Dashboard dynamic QR codes unavailable.", error);
    }
  }

  return (
    <main className="min-h-screen bg-ink">
      <section className="bg-premium-radial px-3 py-8 sm:px-5 md:py-16">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-pulse">User Profile</p>
            <h1 className="mt-4 max-w-4xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-6xl">
              All your PulseTap products in one place.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/66 sm:text-base sm:leading-7">
              Products appear here after you tap or scan a PulseTap card and connect it to your account.
            </p>
          </div>

          <div className="glass rounded-[1.5rem] p-4 sm:rounded-[2rem] sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/54">
                  {profile?.isAuthenticated ? "Signed in account" : "Activation profile"}
                </p>
                <h2 className="mt-1 break-words text-xl font-semibold sm:text-2xl">{accountName}</h2>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  {accountEmail} · Owner access · NFC and QR products · Editable redirects
                </p>
              </div>
              <div className="rounded-2xl bg-white p-3 text-ink">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: "Products", value: cards.length, icon: Box },
                { label: "Active", value: activeProducts, icon: BadgeCheck },
                { label: "Taps", value: totalTaps, icon: Link2 }
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:rounded-3xl sm:p-4">
                  <stat.icon className="h-4 w-4 text-pulse" />
                  <p className="mt-3 text-xl font-semibold sm:mt-4 sm:text-2xl">{stat.value}</p>
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
            ) : b2bCards.length > 0 ? (
              <Link
                href="/dashboard/b2b"
                className="focus-ring mt-4 inline-flex items-center rounded-full border border-white/14 px-5 py-3 text-sm font-semibold text-white/78 transition hover:border-pulse hover:text-white"
              >
                <Database className="mr-2 h-4 w-4" />
                B2B database ({b2bCards.length})
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {profile && !profile.isAuthenticated ? (
        <section className="px-5 pt-8">
          <div className="mx-auto max-w-7xl rounded-[2rem] border border-pulse/25 bg-pulse/10 p-5">
            <p className="text-sm font-semibold text-white">Verify your email to secure this profile</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">
              You can continue activating cards in this browser, but email verification keeps long-term access to your
              PulseTap products. Open the verification email we sent, then log in with your email and password.
            </p>
          </div>
        </section>
      ) : null}

      {profile?.isAuthenticated ? (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="account-qr-heading">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 id="account-qr-heading" className="text-2xl font-semibold">Your dynamic QR codes</h2>
              <p className="mt-2 text-sm text-white/58">Manage saved destinations, view scan counts and download your QR codes.</p>
            </div>
            <Link href="/tools/qr?mode=dynamic" className="focus-ring rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink hover:bg-pulse">Create QR code</Link>
          </div>
          {qrUnavailable ? (
            <p role="status" className="mt-5 text-sm text-white/62">We couldn’t load your QR codes. Refresh the page to try again.</p>
          ) : qrCodes.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-white/10 p-5 text-sm text-white/62">You haven’t created any dynamic QR codes in this account yet.</p>
          ) : (
            <ul className="mt-5 grid gap-4 md:grid-cols-2">
              {qrCodes.map((code) => (
                <li key={code.id} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.045] p-5">
                  <h3 className="break-words text-lg font-semibold">{code.name}</h3>
                  <p className="mt-2 break-all text-sm text-white/58">{code.destinationUrl}</p>
                  <p className="mt-3 text-sm text-pulse">{code.scans} scans</p>
                  <Link href={`/tools/qr?mode=dynamic&code=${encodeURIComponent(code.id)}`} className="focus-ring mt-4 inline-flex items-center text-sm font-semibold text-white hover:text-pulse">Edit or download<ArrowRight className="ml-2 h-4 w-4" /></Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <CardAnalytics cards={cards} tapEvents={tapEvents} />
      <ProductManager cards={cards} />
    </main>
  );
}
