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

function isStripeConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return message.toLowerCase().includes("connection to stripe") || message.toLowerCase().includes("request was retried");
}

async function createCheckoutSessionWithRest({
  origin,
  customerEmail,
  orderId,
  productId,
  productName,
  productDescription,
  unitAmount
}: {
  origin: string;
  customerEmail: string;
  orderId: string;
  productId: string;
  productName: string;
  productDescription: string;
  unitAmount: number;
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
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "gbp");
  params.set("line_items[0][price_data][unit_amount]", String(unitAmount));
  params.set("line_items[0][price_data][product_data][name]", productName);
  params.set("line_items[0][price_data][product_data][description]", productDescription);
  params.set("line_items[0][price_data][product_data][metadata][pulseTapProductId]", productId);
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
      customerEmail?: string;
    };
    const shopProduct = findShopProduct(body.productId ?? "");
    const product = products.find((item) => item.id === shopProduct?.productId);

    if (!shopProduct || !product) {
      return NextResponse.json(
        {
          ok: false,
          message: "Product is not available for checkout."
        },
        { status: 404 }
      );
    }

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
      productId: shopProduct.id,
      productName: product.title,
      customerEmail,
      profileId: profile?.id,
      amount: shopProduct.unitAmount + deliveryAmount,
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
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "gbp",
              unit_amount: shopProduct.unitAmount,
              product_data: {
                name: product.title,
                description: product.description,
                metadata: {
                  pulseTapProductId: shopProduct.id
                }
              }
            }
          }
        ],
        metadata: {
          pulseTapProductId: shopProduct.id,
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
        productId: shopProduct.id,
        productName: product.title,
        productDescription: product.description,
        unitAmount: shopProduct.unitAmount
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
