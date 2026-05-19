import { NextResponse } from "next/server";
import { products } from "@/lib/products";
import { findShopProduct } from "@/lib/shop-products";
import { createStripeClient } from "@/lib/stripe";
import { createPendingCheckoutOrder, attachStripeSessionToOrder } from "@/lib/supabase/order-store";
import { getCurrentProfile } from "@/lib/user-repository";
import { cookies } from "next/headers";

const deliveryAmount = 299;

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
    const stripe = createStripeClient();
    const session = await stripe.checkout.sessions.create({
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
