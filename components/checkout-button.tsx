"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

type CheckoutButtonProps = {
  productId: string;
};

export function CheckoutButton({ productId }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [needsEmail, setNeedsEmail] = useState(false);

  async function startCheckout() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ productId, customerEmail: email })
      });
      const payload = (await response.json()) as {
        ok: boolean;
        url?: string;
        message?: string;
        requiresEmail?: boolean;
      };

      if (!response.ok || !payload.ok || !payload.url) {
        setNeedsEmail(Boolean(payload.requiresEmail));
        setError(payload.message ?? "Could not start checkout.");
        return;
      }

      window.location.href = payload.url;
    } catch {
      setError("Could not start checkout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {needsEmail ? (
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="focus-ring w-full min-w-56 rounded-full border border-white/12 bg-black/20 px-4 py-2 text-sm text-white placeholder:text-white/34"
          placeholder="Email for receipt"
          type="email"
          autoComplete="email"
        />
      ) : null}
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className="focus-ring inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-pulse disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {loading ? "Opening checkout" : "Buy now"}
        {!loading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
      </button>
      {error ? <p className="mt-2 text-sm text-coral">{error}</p> : null}
    </div>
  );
}
