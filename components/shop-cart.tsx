"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowRight, Loader2, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

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
const deliveryAmount = 480;
const freeShippingThreshold = 2000;

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
  const [promoCode, setPromoCode] = useState("");
  const [needsEmail, setNeedsEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

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
  const shippingAmount = subtotal >= freeShippingThreshold ? 0 : deliveryAmount;
  const total = subtotal > 0 ? subtotal + shippingAmount : 0;

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
          customerEmail: email,
          promoCode
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
    <section id="shop-grid" className="px-5 py-14 pb-28 md:py-16 md:pb-16">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1fr_380px]">
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((item) => {
            const quantity = getQuantity(item.id);
            const isProductPhoto = item.image.endsWith(".png");

            return (
              <article key={item.id} className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045]">
                <div className="relative h-72 overflow-hidden bg-white">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 1280px) 100vw, 50vw"
                    quality={100}
                    className={`transition duration-500 group-hover:scale-105 ${isProductPhoto ? "object-contain p-3" : "object-cover"}`}
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

        {mobileCartOpen ? (
          <button
            type="button"
            aria-label="Close cart"
            onClick={() => setMobileCartOpen(false)}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm xl:hidden"
          />
        ) : null}

        <aside
          aria-label="Your shopping cart"
          aria-modal={mobileCartOpen ? true : undefined}
          role={mobileCartOpen ? "dialog" : undefined}
          className={`${mobileCartOpen ? "fixed inset-x-0 bottom-0 z-50 block max-h-[88dvh] overflow-y-auto rounded-b-none pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(0,0,0,0.45)]" : "hidden xl:block"} h-fit rounded-[2rem] border border-white/10 bg-[#11131b] p-5 xl:sticky xl:top-24 xl:max-h-none xl:overflow-visible xl:rounded-[2rem] xl:bg-white/[0.045] xl:pb-5 xl:shadow-none`}
        >
          <div className="flex items-center justify-between gap-4 pr-12 xl:pr-0">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-pulse">Cart</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Your order</h2>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink">
              <ShoppingBag className="h-5 w-5" />
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMobileCartOpen(false)}
            className="focus-ring absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-[#11131b] text-white/70 xl:hidden"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>

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

          <label className="mt-4 block">
            <span className="text-sm font-medium text-white/82">Promo code</span>
            <input
              value={promoCode}
              onChange={(event) => setPromoCode(event.target.value)}
              className="focus-ring mt-2 w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-base text-white placeholder:text-white/32"
              placeholder="Enter promo code"
              autoComplete="off"
            />
            <span className="mt-2 block text-xs text-white/50">Free UK and Ireland delivery on orders of £20 or more.</span>
          </label>

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
              <span>{shippingAmount === 0 ? "Free Shipping" : "Royal Mail 24 Tracked"}</span>
              <span>{shippingAmount === 0 && subtotal > 0 ? "Free" : formatPrice(shippingAmount)}</span>
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

      {!mobileCartOpen ? (
        <button
          type="button"
          onClick={() => setMobileCartOpen(true)}
          className="focus-ring fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex items-center justify-between rounded-full border border-white/15 bg-ink px-5 py-3.5 text-left text-white shadow-[0_12px_40px_rgba(0,0,0,0.5)] xl:hidden"
          aria-label={`Open cart with ${itemCount} items, total ${formatPrice(total)}`}
        >
          <span className="flex items-center gap-3">
            <span className="relative grid h-10 w-10 place-items-center rounded-full bg-white text-ink">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-pulse px-1 text-[10px] font-bold text-ink">{itemCount}</span>
            </span>
            <span>
              <span className="block text-xs text-white/60">{itemCount === 1 ? "1 item" : `${itemCount} items`}</span>
              <span className="block text-sm font-semibold">View cart</span>
            </span>
          </span>
          <span className="flex items-center gap-2 text-sm font-semibold">
            {formatPrice(total)}
            <ArrowDown className="h-4 w-4" />
          </span>
        </button>
      ) : null}
    </section>
  );
}
