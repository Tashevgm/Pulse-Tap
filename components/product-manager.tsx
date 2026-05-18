"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  Link2,
  PackageOpen,
  QrCode,
  Search,
  Settings2
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Card } from "@/lib/cards";

type ProductManagerProps = {
  cards: Card[];
};

const productAccent: Record<Card["type"], string> = {
  facebook: "from-blue-500/26 to-pulse/12",
  "google-review": "from-volt/24 to-pulse/12",
  "google-review-stand": "from-volt/24 to-pulse/12",
  instagram: "from-coral/28 to-pulse/16"
};

const productTypeLabel: Record<Card["type"], string> = {
  facebook: "Facebook tap card",
  "google-review": "Google review card",
  "google-review-stand": "Google review stand",
  instagram: "Instagram tap card"
};

function publicTapLink(product: Card) {
  return `https://www.pulse-tap.com/t/${product.claimToken}`;
}

function formatLastTap(lastTappedAt?: string) {
  if (!lastTappedAt) {
    return "No taps yet";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(lastTappedAt));
}

function trackingLabel(product: Card) {
  return product.type === "google-review" || product.type === "google-review-stand"
    ? "Review page visits"
    : "Total taps";
}

export function ProductManager({ cards }: ProductManagerProps) {
  const [products, setProducts] = useState(cards);
  const [selectedId, setSelectedId] = useState(cards[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [savingId, setSavingId] = useState("");
  const [saveError, setSaveError] = useState("");

  const selectedProduct = products.find((product) => product.id === selectedId) ?? products[0];

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return products;
    }

    return products.filter((product) =>
      [product.id, product.label, product.type, product.database, product.redirectUrl]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [products, query]);

  function updateLocalRedirectUrl(cardId: string, redirectUrl: string) {
    setProducts((current) =>
      current.map((product) =>
        product.id === cardId
          ? {
              ...product,
              redirectUrl,
              activated: redirectUrl.trim().length > 0,
              updatedAt: new Date().toISOString().slice(0, 10)
            }
          : product
      )
    );
  }

  async function saveRedirectUrl(cardId: string, redirectUrl: string) {
    setSavingId(cardId);
    setSaveError("");

    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ redirectUrl })
      });
      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        card?: Card;
      };

      if (!response.ok || !payload.ok || !payload.card) {
        setSaveError(payload.message ?? "Could not save this destination.");
        return;
      }

      setProducts((current) => current.map((product) => (product.id === cardId ? payload.card! : product)));
    } catch {
      setSaveError("Could not save this destination.");
    } finally {
      setSavingId("");
    }
  }

  async function copyRedirect(cardId: string) {
    const product = products.find((item) => item.id === cardId);

    if (!product) {
      return;
    }

    await navigator.clipboard.writeText(publicTapLink(product));
    setCopiedId(cardId);
    window.setTimeout(() => setCopiedId(""), 1600);
  }

  if (products.length === 0) {
    return (
      <section className="px-5 py-10 md:py-14">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-ink">
            <PackageOpen className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight">No products connected yet.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Tap or scan your PulseTap card while signed in. The website will detect the card and connect it to this profile automatically.
          </p>
          <Link
            href="/activate"
            className="focus-ring mt-6 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-pulse"
          >
            Tap your card to add it
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="px-5 py-10 md:py-14">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[390px_1fr]">
        <aside className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <Search className="h-4 w-4 text-white/46" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm text-white placeholder:text-white/36 focus:outline-none"
              placeholder="Search products"
            />
          </div>

          <div className="mt-4 space-y-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelectedId(product.id)}
                className={`focus-ring w-full rounded-3xl border p-4 text-left transition ${
                  selectedProduct.id === product.id
                    ? "border-pulse/55 bg-pulse/10"
                    : "border-white/10 bg-black/18 hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pulse">{product.database} product</p>
                    <h2 className="mt-2 text-base font-semibold">{product.label}</h2>
                    <p className="mt-1 text-xs text-white/42">{productTypeLabel[product.type]}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.activated ? "bg-volt/15 text-volt" : "bg-coral/15 text-coral"}`}>
                    {product.activated ? "Active" : "Setup"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/48">
                  <span>
                    {trackingLabel(product)}: {product.taps}
                  </span>
                  <span>{formatLastTap(product.lastTappedAt)}</span>
                </div>
                <p className="mt-2 truncate text-sm text-white/48">{product.redirectUrl || "No destination yet"}</p>
              </button>
            ))}
          </div>
        </aside>

        {selectedProduct ? (
          <div className="glass overflow-hidden rounded-[2rem]">
            <div className={`bg-gradient-to-br ${productAccent[selectedProduct.type]} border-b border-white/10 p-6 md:p-8`}>
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink">{selectedProduct.id}</span>
                    <span className="rounded-full border border-white/14 bg-black/18 px-3 py-1 text-xs font-semibold text-white/76">
                      {productTypeLabel[selectedProduct.type]}
                    </span>
                  </div>
                  <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">{selectedProduct.label}</h2>
                  <p className="mt-3 text-sm leading-6 text-white/58">
                    Active PulseTap link · Updated {selectedProduct.updatedAt}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white p-3 text-ink">
                  <QRCodeSVG value={publicTapLink(selectedProduct)} size={132} />
                  <div className="mt-2 flex items-center justify-center gap-1 text-xs font-semibold">
                    <QrCode className="h-3.5 w-3.5" />
                    QR backup
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-0 md:grid-cols-[1fr_270px]">
              <div className="p-6 md:p-8">
                <label className="block">
                  <span className="flex items-center gap-2 text-sm font-semibold text-white/82">
                    <Link2 className="h-4 w-4 text-pulse" />
                    Customer destination
                  </span>
                  <input
                    value={selectedProduct.redirectUrl}
                    onChange={(event) => updateLocalRedirectUrl(selectedProduct.id, event.target.value)}
                    className="focus-ring mt-3 w-full rounded-2xl border border-white/12 bg-black/20 px-4 py-4 text-base text-white placeholder:text-white/34"
                    placeholder="https://your-link.com"
                    inputMode="url"
                  />
                </label>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => saveRedirectUrl(selectedProduct.id, selectedProduct.redirectUrl)}
                    disabled={savingId === selectedProduct.id}
                    className="focus-ring inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingId === selectedProduct.id ? "Saving" : "Save Destination"}
                  </button>
                  {saveError ? <p className="text-sm text-coral">{saveError}</p> : null}
                </div>

                <div className="mt-5 rounded-3xl border border-white/10 bg-black/18 p-4">
                  <p className="text-sm font-semibold">Public PulseTap link</p>
                  <p className="mt-2 break-all text-sm leading-6 text-white/58">{publicTapLink(selectedProduct)}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => copyRedirect(selectedProduct.id)}
                      className="focus-ring inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink"
                    >
                      {copiedId === selectedProduct.id ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                      {copiedId === selectedProduct.id ? "Copied" : "Copy Link"}
                    </button>
                    <a
                      href={`/t/${selectedProduct.claimToken}`}
                      target="_blank"
                      rel="noreferrer"
                      className="focus-ring inline-flex items-center rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-white/78"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Test Link
                    </a>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 p-6 md:border-l md:border-t-0 md:p-8">
                <p className="text-sm font-semibold">Product activity</p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-black/18 p-4">
                    <p className="flex items-center gap-2 text-white/46">
                      <BadgeCheck className="h-4 w-4" />
                      Status
                    </p>
                    <p className="mt-1 font-semibold">{selectedProduct.activated ? "Active redirect" : "Needs setup"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/18 p-4">
                    <p className="text-white/46">{trackingLabel(selectedProduct)}</p>
                    <p className="mt-1 font-semibold">{selectedProduct.taps}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/18 p-4">
                    <p className="flex items-center gap-2 text-white/46">
                      <Clock3 className="h-4 w-4" />
                      Last tapped
                    </p>
                    <p className="mt-1 font-semibold">{formatLastTap(selectedProduct.lastTappedAt)}</p>
                  </div>
                </div>
                <button className="focus-ring mt-5 inline-flex w-full items-center justify-center rounded-full border border-white/14 px-4 py-3 text-sm font-semibold text-white/78">
                  <Settings2 className="mr-2 h-4 w-4" />
                  More options soon
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
