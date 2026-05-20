import { NextResponse } from "next/server";
import { products } from "@/lib/products";
import { findShopProduct } from "@/lib/shop-products";
import { createStripeClient, getStripeSecretKey } from "@/lib/stripe";
import { createPendingCheckoutOrder, attachStripeSessionToOrder } from "@/lib/supabase/order-store";
import { getCurrentProfile } from "@/lib/user-repository";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const deliveryAmount = 299;

type CheckoutSessionResult = {
  id: string;
  url: string | null;
};

type CheckoutLine = {
  shopProduct: NonNullable<ReturnType<typeof findShopProduct>>;
  product: (typeof products)[number];
  quantity: number;
};

function isStripeConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return message.toLowerCase().includes("connection to stripe") || message.toLowerCase().includes("request was retried");
}

async function createCheckoutSessionWithRest({
  origin,
  customerEmail,
  orderId,
  lines,
  productId
}: {
  origin: string;
  customerEmail: string;
  orderId: string;
  lines: CheckoutLine[];
  productId: string;
}): Promise<CheckoutSessionResult> {
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${origin}/checkout/cancel`);
  params.set("customer_email", customerEmail);
  params.set("billing_address_collection", "auto");
  params.set("shipping_address_collection[allowed_countries][0]", "GB");
  params.set("shipping_address_collection[allowed_countries][1]", "IE");
  params.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
  params.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", String(deliveryAmount));
  params.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "gbp");
  params.set("shipping_options[0][shipping_rate_data][display_name]", "Standard delivery");
  params.set("shipping_options[0][shipping_rate_data][delivery_estimate][minimum][unit]", "business_day");
  params.set("shipping_options[0][shipping_rate_data][delivery_estimate][minimum][value]", "2");
  params.set("shipping_options[0][shipping_rate_data][delivery_estimate][maximum][unit]", "business_day");
  params.set("shipping_options[0][shipping_rate_data][delivery_estimate][maximum][value]", "5");
  lines.forEach((line, index) => {
    params.set(`line_items[${index}][quantity]`, String(line.quantity));
    params.set(`line_items[${index}][price_data][currency]`, "gbp");
    params.set(`line_items[${index}][price_data][unit_amount]`, String(line.shopProduct.unitAmount));
    params.set(`line_items[${index}][price_data][product_data][name]`, line.product.title);
    params.set(`line_items[${index}][price_data][product_data][description]`, line.product.description);
    params.set(`line_items[${index}][price_data][product_data][metadata][pulseTapProductId]`, line.shopProduct.id);
  });
  params.set("metadata[pulseTapProductId]", productId);
  params.set("metadata[pulseTapOrderId]", orderId);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });

  const payload = (await response.json()) as CheckoutSessionResult & {
    error?: {
      message?: string;
    };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Stripe Checkout could not be started.");
  }

  return payload;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      productId?: string;
      items?: Array<{
        productId?: string;
        quantity?: number;
      }>;
      customerEmail?: string;
    };
    const requestedItems =
      body.items && body.items.length > 0
        ? body.items
        : body.productId
          ? [{ productId: body.productId, quantity: 1 }]
          : [];
    const lines = requestedItems
      .map((item) => {
        const quantity = Math.max(0, Math.min(Number(item.quantity ?? 1), 20));
        const shopProduct = findShopProduct(item.productId ?? "");
        const product = products.find((productItem) => productItem.id === shopProduct?.productId);

        return shopProduct && product && quantity > 0
          ? {
              shopProduct,
              product,
              quantity
            }
          : null;
      })
      .filter(Boolean) as CheckoutLine[];

    if (lines.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "Add at least one available product to checkout."
        },
        { status: 404 }
      );
    }

    const subtotal = lines.reduce((sum, line) => sum + line.shopProduct.unitAmount * line.quantity, 0);
    const productName =
      lines.length === 1
        ? lines[0].product.title
        : `${lines.reduce((sum, line) => sum + line.quantity, 0)} PulseTap products`;
    const productId = lines.length === 1 ? lines[0].shopProduct.id : "cart";

    const requestUrl = new URL(request.url);
    const cookieStore = await cookies();
    const profile = await getCurrentProfile(cookieStore.get("pulsetap_user_id")?.value);
    const customerEmail = (profile?.email ?? body.customerEmail ?? "").trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return NextResponse.json(
        {
          ok: false,
          requiresEmail: true,
          message: "Enter your email so we can send your order receipt."
        },
        { status: 400 }
      );
    }

    const order = await createPendingCheckoutOrder({
      productId,
      productName,
      customerEmail,
      profileId: profile?.id,
      amount: subtotal + deliveryAmount,
      currency: "gbp"
    });
    let session: CheckoutSessionResult;

    try {
      const stripe = createStripeClient();
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: `${requestUrl.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${requestUrl.origin}/checkout/cancel`,
        customer_email: customerEmail,
        billing_address_collection: "auto",
        shipping_address_collection: {
          allowed_countries: ["GB", "IE"]
        },
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: {
                amount: deliveryAmount,
                currency: "gbp"
              },
              display_name: "Standard delivery",
              delivery_estimate: {
                minimum: {
                  unit: "business_day",
                  value: 2
                },
                maximum: {
                  unit: "business_day",
                  value: 5
                }
              }
            }
          }
        ],
        line_items: lines.map((line) => ({
          quantity: line.quantity,
          price_data: {
            currency: "gbp",
            unit_amount: line.shopProduct.unitAmount,
            product_data: {
              name: line.product.title,
              description: line.product.description,
              metadata: {
                pulseTapProductId: line.shopProduct.id
              }
            }
          }
        })),
        metadata: {
          pulseTapProductId: productId,
          pulseTapOrderId: order.id
        }
      });
    } catch (error) {
      if (!isStripeConnectionError(error)) {
        throw error;
      }

      session = await createCheckoutSessionWithRest({
        origin: requestUrl.origin,
        customerEmail,
        orderId: order.id,
        productId,
        lines
      });
    }

    if (session.id) {
      await attachStripeSessionToOrder(order.id, session.id);
    }

    return NextResponse.json({
      ok: true,
      url: session.url
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "Could not start checkout.";

    return NextResponse.json(
      {
        ok: false,
        message
      },
      { status: 500 }
    );
  }
}
