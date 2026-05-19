import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type CheckoutOrderStatus = "pending" | "completed" | "expired";

export type CheckoutOrder = {
  id: string;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  productId: string;
  productName: string;
  customerEmail: string;
  profileId: string | null;
  amount: number;
  currency: string;
  status: CheckoutOrderStatus;
  abandonedEmailSentAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

type CheckoutOrderRow = {
  id: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  product_id: string;
  product_name: string;
  customer_email: string;
  profile_id: string | null;
  amount: number;
  currency: string;
  status: CheckoutOrderStatus;
  abandoned_email_sent_at: string | null;
  completed_at: string | null;
  created_at: string;
};

function mapOrder(row: CheckoutOrderRow): CheckoutOrder {
  return {
    id: row.id,
    stripeSessionId: row.stripe_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    productId: row.product_id,
    productName: row.product_name,
    customerEmail: row.customer_email,
    profileId: row.profile_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    abandonedEmailSentAt: row.abandoned_email_sent_at,
    completedAt: row.completed_at,
    createdAt: row.created_at
  };
}

export async function createPendingCheckoutOrder({
  productId,
  productName,
  customerEmail,
  profileId,
  amount,
  currency
}: {
  productId: string;
  productName: string;
  customerEmail: string;
  profileId?: string;
  amount: number;
  currency: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("checkout_orders")
    .insert({
      product_id: productId,
      product_name: productName,
      customer_email: customerEmail,
      profile_id: profileId ?? null,
      amount,
      currency,
      status: "pending"
    })
    .select("*")
    .single<CheckoutOrderRow>();

  if (error) {
    throw error;
  }

  return mapOrder(data);
}

export async function attachStripeSessionToOrder(orderId: string, stripeSessionId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("checkout_orders")
    .update({
      stripe_session_id: stripeSessionId
    })
    .eq("id", orderId)
    .select("*")
    .single<CheckoutOrderRow>();

  if (error) {
    throw error;
  }

  return mapOrder(data);
}

export async function markCheckoutOrderCompleted({
  stripeSessionId,
  stripePaymentIntentId,
  customerEmail
}: {
  stripeSessionId: string;
  stripePaymentIntentId?: string | null;
  customerEmail?: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("checkout_orders")
    .update({
      stripe_payment_intent_id: stripePaymentIntentId ?? null,
      customer_email: customerEmail ?? undefined,
      status: "completed",
      completed_at: new Date().toISOString()
    })
    .eq("stripe_session_id", stripeSessionId)
    .neq("status", "completed")
    .select("*")
    .maybeSingle<CheckoutOrderRow>();

  if (error) {
    throw error;
  }

  return data ? mapOrder(data) : null;
}

export async function markCheckoutOrderExpired(stripeSessionId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("checkout_orders")
    .update({
      status: "expired"
    })
    .eq("stripe_session_id", stripeSessionId)
    .select("*")
    .maybeSingle<CheckoutOrderRow>();

  if (error) {
    throw error;
  }

  return data ? mapOrder(data) : null;
}

export async function readAbandonedCheckoutOrders(cutoffIso: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("checkout_orders")
    .select("*")
    .eq("status", "pending")
    .is("abandoned_email_sent_at", null)
    .lt("created_at", cutoffIso)
    .order("created_at", { ascending: true })
    .limit(25);

  if (error) {
    throw error;
  }

  return (data as CheckoutOrderRow[]).map(mapOrder);
}

export async function markAbandonedEmailSent(orderId: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("checkout_orders")
    .update({
      abandoned_email_sent_at: new Date().toISOString()
    })
    .eq("id", orderId);

  if (error) {
    throw error;
  }
}
