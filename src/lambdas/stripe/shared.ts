import type Stripe from "stripe";
import { getSupabaseClient } from "../../lib/supabase";

export type SubscriptionStatusResponse = {
  subscribed: boolean;
  status: string | null;
  priceId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export async function getOrCreateStripeCustomer(input: {
  userId: string;
  userEmail: string;
  stripe: Stripe;
}): Promise<string> {
  const supabase = getSupabaseClient();

  const { data: existingCustomer, error: customerLookupError } = await supabase
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (customerLookupError) {
    throw new Error(
      `Failed to load billing customer: ${customerLookupError.code ?? "DB_ERROR"} ${customerLookupError.message}`,
    );
  }

  if (existingCustomer?.stripe_customer_id) {
    return existingCustomer.stripe_customer_id;
  }

  const customer = await input.stripe.customers.create({
    email: input.userEmail || undefined,
    metadata: {
      supabaseUserId: input.userId,
    },
  });

  const { error: upsertError } = await supabase.from("billing_customers").upsert(
    {
      user_id: input.userId,
      stripe_customer_id: customer.id,
      email: input.userEmail || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (upsertError) {
    throw new Error(`Failed to persist billing customer: ${upsertError.code ?? "DB_ERROR"} ${upsertError.message}`);
  }

  return customer.id;
}

export async function getSubscriptionStatusForUser(userId: string): Promise<SubscriptionStatusResponse> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("billing_subscriptions")
    .select("status,price_id,current_period_end,cancel_at_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load subscription status: ${error.code ?? "DB_ERROR"} ${error.message}`);
  }

  if (!data) {
    return {
      subscribed: false,
      status: null,
      priceId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }

  return {
    subscribed: data.status === "active" || data.status === "trialing",
    status: data.status,
    priceId: data.price_id,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: Boolean(data.cancel_at_period_end),
  };
}

export async function upsertSubscriptionByStripeObject(subscription: Stripe.Subscription): Promise<void> {
  const supabase = getSupabaseClient();

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  if (!customerId) {
    return;
  }

  let userId = subscription.metadata?.supabaseUserId || "";

  if (!userId) {
    const { data: customerRow, error: customerError } = await supabase
      .from("billing_customers")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (customerError) {
      throw new Error(
        `Failed to map customer to user: ${customerError.code ?? "DB_ERROR"} ${customerError.message}`,
      );
    }

    userId = customerRow?.user_id ?? "";
  }

  if (!userId) {
    console.warn("Skipping subscription sync because no user mapping was found", {
      subscriptionId: subscription.id,
      customerId,
    });
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const currentPeriodEnd =
    subscription.cancel_at ?? subscription.trial_end ?? null;

  const { error } = await supabase.from("billing_subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: subscription.status,
      price_id: priceId,
      current_period_end: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : null,
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      raw: subscription as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(`Failed to sync subscription: ${error.code ?? "DB_ERROR"} ${error.message}`);
  }
}

