"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

type ShopItem = {
  id: string;
  productId: string;
  priceLabel: string;
  unitAmount: number;
  badge: string;
  finish: string;
  title: string;
  category: string;
  description: string;
  image: string;
};

type CartLine = {
  productId: string;
  quantity: number;
};

type ShopCartProps = {
  items: ShopItem[];
};

const storageKey = "pulsetap_cart";
const deliveryAmount = 299;

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP"
  }).format(amount / 100);
}

function readCart() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as CartLine[]) : [];
  } catch {
    return [];
  }
}

function saveCart(cart: CartLine[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(cart));
}

export function ShopCart({ items }: ShopCartProps) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [email, setEmail] = useState("");
  const [needsEmail, setNeedsEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCart(readCart());
  }, []);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const cartItems = cart
    .map((line) => {
      const item = itemById.get(line.productId);
      return item ? { ...line, item } : null;
    })
    .filter(Boolean) as Array<CartLine & { item: ShopItem }>;
  const itemCount = cartItems.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cartItems.reduce((sum, line) => sum + line.item.unitAmount * line.quantity, 0);
  const total = subtotal > 0 ? subtotal + deliveryAmount : 0;

  function updateQuantity(productId: string, quantity: number) {
    setCart((current) => {
      const nextQuantity = Math.max(0, Math.min(quantity, 20));
      const exists = current.some((line) => line.productId === productId);

      if (!exists && nextQuantity > 0) {
        return [...current, { productId, quantity: nextQuantity }];
      }

      return current
        .map((line) => (line.productId === productId ? { ...line, quantity: nextQuantity } : line))
        .filter((line) => line.quantity > 0);
    });
  }

  function getQuantity(productId: string) {
    return cart.find((line) => line.productId === productId)?.quantity ?? 0;
  }

  async function startCheckout() {
    setError("");

    if (cartItems.length === 0) {
      setError("Add at least one product to your cart.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items: cartItems.map((line) => ({
            productId: line.productId,
            quantity: line.quantity
          })),
          customerEmail: email
        })
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
    <section id="shop-grid" className="px-5 py-14 md:py-16">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1fr_380px]">
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((item) => {
            const quantity = getQuantity(item.id);

            return (
              <article key={item.id} className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045]">
                <div className="relative h-72 overflow-hidden bg-white">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 1280px) 100vw, 50vw"
                    quality={100}
                    className={`transition duration-500 group-hover:scale-105 ${
                      item.productId === "instagram-card" || item.productId === "facebook-card" ? "object-contain p-3" : "object-cover"
                    }`}
                  />
                  <div className="absolute left-4 top-4 rounded-full border border-white/18 bg-black/50 px-3 py-1 text-xs font-semibold">
                    {item.badge}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pulse">{item.category}</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{item.title}</h2>
                    </div>
                    <p className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-semibold text-ink">
                      {item.priceLabel}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/60">{item.description}</p>
                  <p className="mt-4 text-sm font-semibold text-white/78">{item.finish}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {quantity > 0 ? (
                      <div className="inline-flex items-center rounded-full border border-white/14 bg-white/8 p-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, quantity - 1)}
                          className="focus-ring grid h-9 w-9 place-items-center rounded-full text-white/80 transition hover:bg-white/12 hover:text-white"
                          aria-label={`Remove one ${item.title}`}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-9 text-center text-sm font-semibold">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, quantity + 1)}
                          className="focus-ring grid h-9 w-9 place-items-center rounded-full text-white/80 transition hover:bg-white/12 hover:text-white"
                          aria-label={`Add one ${item.title}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="focus-ring inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-pulse"
                      >
                        Add to cart
                        <Plus className="ml-2 h-4 w-4" />
                      </button>
                    )}
                    <Link
                      href="/support"
                      className="focus-ring inline-flex items-center rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-white/78 transition hover:text-white"
                    >
                      Setup guide
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="h-fit rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 xl:sticky xl:top-24">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-pulse">Cart</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Your order</h2>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink">
              <ShoppingBag className="h-5 w-5" />
            </span>
          </div>

          {cartItems.length === 0 ? (
            <p className="mt-5 rounded-3xl border border-white/10 bg-black/18 p-4 text-sm leading-6 text-white/58">
              Add products to your cart, then checkout once with one delivery fee.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {cartItems.map((line) => (
                <div key={line.productId} className="rounded-3xl border border-white/10 bg-black/18 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{line.item.title}</p>
                      <p className="mt-1 text-sm text-white/46">
                        {line.quantity} x {formatPrice(line.item.unitAmount)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.productId, 0)}
                      className="focus-ring rounded-full p-2 text-white/48 transition hover:bg-white/10 hover:text-white"
                      aria-label={`Remove ${line.item.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 space-y-3 rounded-3xl border border-white/10 bg-black/18 p-4 text-sm">
            <div className="flex justify-between text-white/60">
              <span>Items</span>
              <span>{itemCount}</span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>Standard delivery</span>
              <span>{subtotal > 0 ? formatPrice(deliveryAmount) : formatPrice(0)}</span>
            </div>
            <div className="border-t border-white/10 pt-3">
              <div className="flex justify-between text-base font-semibold text-white">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {needsEmail ? (
            <label className="mt-4 block">
              <span className="text-sm font-medium text-white/82">Email for receipt</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="focus-ring mt-2 w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-base text-white placeholder:text-white/32"
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
              />
            </label>
          ) : null}

          {error ? <p className="mt-4 rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-white/78">{error}</p> : null}

          <button
            type="button"
            onClick={startCheckout}
            disabled={loading || cartItems.length === 0}
            className="focus-ring mt-5 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-4 text-sm font-semibold text-ink transition hover:bg-pulse disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Opening checkout" : "Checkout"}
            {!loading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
          </button>
        </aside>
      </div>
    </section>
  );
}
