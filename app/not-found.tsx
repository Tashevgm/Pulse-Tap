import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] bg-premium-radial px-5 py-28">
      <section className="mx-auto max-w-3xl text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-pulse">404</p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">
          This PulseTap link is not active.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/68">
          The card or page may still need activation. Start with the activation flow or explore PulseTap products.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="focus-ring inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink" href="/activate">
            Activate Your Card
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link className="focus-ring inline-flex items-center justify-center rounded-full border border-white/14 px-6 py-3 text-sm font-semibold text-white" href="/products">
            Explore Products
          </Link>
        </div>
      </section>
    </main>
  );
}
