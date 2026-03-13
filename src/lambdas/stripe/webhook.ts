import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import type Stripe from "stripe";
import { errorJson, handleRouteError, json } from "../../lib/http";
import { getStripeClient } from "../../lib/stripe";
import { getSupabaseClient } from "../../lib/supabase";
import { upsertSubscriptionByStripeObject } from "./shared";

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext.requestId;

  try {
    const stripe = getStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return errorJson(500, "Missing Stripe webhook configuration", {
        details: "STRIPE_WEBHOOK_SECRET must be configured",
        requestId,
      });
    }

    const signature =
      event.headers["stripe-signature"] ?? event.headers["Stripe-Signature"];

    if (!signature) {
      return errorJson(400, "Missing Stripe signature", {
        details: "Expected stripe-signature header",
        requestId,
      });
    }

    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64").toString("utf8")
      : event.body || "";

    const stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );

    const supabase = getSupabaseClient();
    const { error: eventPersistError } = await supabase
      .from("billing_webhook_events")
      .upsert(
        {
          id: stripeEvent.id,
          type: stripeEvent.type,
        },
        { onConflict: "id", ignoreDuplicates: true },
      );

    if (eventPersistError) {
      throw new Error(
        `Failed to persist webhook event: ${eventPersistError.code ?? "DB_ERROR"} ${eventPersistError.message}`,
      );
    }

    if (
      stripeEvent.type === "customer.subscription.created" ||
      stripeEvent.type === "customer.subscription.updated" ||
      stripeEvent.type === "customer.subscription.deleted"
    ) {
      await upsertSubscriptionByStripeObject(
        stripeEvent.data.object as Stripe.Subscription,
      );
    }

    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertSubscriptionByStripeObject(subscription);
      }
    }

    return json(200, { received: true });
  } catch (error) {
    return handleRouteError(error, "Failed to process Stripe webhook", requestId);
  }
};

