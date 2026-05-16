import type { Metadata } from "next";
import { ActivateForm } from "@/components/activate-form";
import { findCardByClaimToken } from "@/lib/card-store";

export const metadata: Metadata = {
  title: "Activate",
  description: "Activate a PulseTap NFC or QR product with an activation code and destination URL."
};

type ActivatePageProps = {
  searchParams: Promise<{
    claim?: string;
  }>;
};

export default async function ActivatePage({ searchParams }: ActivatePageProps) {
  const { claim = "" } = await searchParams;
  const detectedCard = claim ? await findCardByClaimToken(claim) : null;

  return (
    <main className="min-h-screen bg-premium-radial px-5 py-14">
      <section className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-pulse">Activation</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">
            Activate your card in one simple flow.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/66">
            Tap or scan your PulseTap product, paste your destination URL, then activate. The card is detected automatically from its private claim link.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-white/62 sm:grid-cols-3 lg:grid-cols-1">
            {["Card detected", "Paste destination", "Tap activate"].map((item, index) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-white/[0.055] p-4">
                <span className="text-pulse">0{index + 1}</span>
                <p className="mt-2 font-medium text-white">{item}</p>
              </div>
            ))}
          </div>
        </div>
        <ActivateForm
          claimToken={detectedCard ? claim : ""}
          detectedCard={
            detectedCard
              ? {
                  id: detectedCard.id,
                  label: detectedCard.label,
                  database: detectedCard.database,
                  activated: detectedCard.activated
                }
              : null
          }
        />
      </section>
    </main>
  );
}
