import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
  title: "Checkout Cancelled",
  description: "Return to the PulseTap shop."
};

export default function CheckoutCancelPage() {
  return (
    <main className="min-h-screen bg-premium-radial px-5 py-16">
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 text-center md:p-10">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-white">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.34em] text-pulse">Checkout Cancelled</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">Your order was not completed.</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/62">
          No payment was taken. You can return to the shop and start checkout again when ready.
        </p>
        <Link
          href="/shop"
          className="focus-ring mt-7 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-pulse"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to shop
        </Link>
      </section>
    </main>
  );
}
