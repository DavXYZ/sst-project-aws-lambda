import type { APIGatewayProxyResultV2 } from "aws-lambda";
import { getAuthUser } from "../../lib/auth";
import type { AuthorizedEvent } from "../../lib/auth";
import { errorJson, handleRouteError, json } from "../../lib/http";
import { getStripeClient } from "../../lib/stripe";
import { getOrCreateStripeCustomer } from "./shared";

const APP_URL_FALLBACK = "http://localhost:5173";

export const handler = async (
  event: AuthorizedEvent,
): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext.requestId;

  try {
    const user = getAuthUser(event);
    const stripe = getStripeClient();

    const customerId = await getOrCreateStripeCustomer({
      userId: user.userId,
      userEmail: user.userEmail,
      stripe,
    });

    let body: { successUrl?: string; cancelUrl?: string; priceId?: string } = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch {
        return errorJson(400, "Invalid JSON body", {
          details: "Request body must be valid JSON",
          requestId,
        });
      }
    }

    const stripePriceId = body.priceId || process.env.STRIPE_PRICE_ID;
    if (!stripePriceId) {
      return errorJson(500, "Missing Stripe price configuration", {
        details: "STRIPE_PRICE_ID must be configured",
        requestId,
      });
    }

    const origin = event.headers.origin ?? event.headers.Origin;
    const appUrl = process.env.APP_URL || origin || APP_URL_FALLBACK;
    const successUrl = body.successUrl || `${appUrl}/?subscription=success`;
    const cancelUrl = body.cancelUrl || `${appUrl}/?subscription=canceled`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user.userId,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          supabaseUserId: user.userId,
        },
      },
    });

    if (!session.url) {
      return errorJson(500, "Stripe did not return a checkout URL", {
        requestId,
      });
    }

    return json(200, {
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    return handleRouteError(error, "Failed to create checkout session", requestId);
  }
};

