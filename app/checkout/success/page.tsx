import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, PackageCheck } from "lucide-react";
import { ClearCart } from "@/components/clear-cart";

export const metadata: Metadata = {
  title: "Order Complete",
  description: "Your PulseTap test checkout is complete."
};

type SuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { session_id: sessionId = "" } = await searchParams;

  return (
    <main className="min-h-screen bg-premium-radial px-5 py-16">
      <ClearCart />
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 text-center md:p-10">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-volt/15 text-volt">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.34em] text-pulse">Checkout Complete</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">Your PulseTap order is confirmed.</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/62">
          Stripe test checkout completed successfully. The next production step is connecting this payment to order fulfilment and card allocation.
        </p>

        {sessionId ? (
          <p className="mx-auto mt-5 max-w-xl break-all rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/48">
            Stripe session: {sessionId}
          </p>
        ) : null}

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/activate"
            className="focus-ring inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-pulse"
          >
            Activate a card
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/shop"
            className="focus-ring inline-flex items-center rounded-full border border-white/14 px-5 py-3 text-sm font-semibold text-white/78 transition hover:text-white"
          >
            <PackageCheck className="mr-2 h-4 w-4" />
            Back to shop
          </Link>
        </div>
      </section>
    </main>
  );
}
