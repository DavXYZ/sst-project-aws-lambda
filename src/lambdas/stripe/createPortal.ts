import type { APIGatewayProxyResultV2 } from "aws-lambda";
import { getAuthUser } from "../../lib/auth";
import type { AuthorizedEvent } from "../../lib/auth";
import { errorJson, handleRouteError, json } from "../../lib/http";
import { getStripeClient } from "../../lib/stripe";
import { getSupabaseClient } from "../../lib/supabase";

const APP_URL_FALLBACK = "http://localhost:5173";

export const handler = async (
  event: AuthorizedEvent,
): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext.requestId;

  try {
    const user = getAuthUser(event);
    const stripe = getStripeClient();
    const supabase = getSupabaseClient();

    const { data: customer, error: customerError } = await supabase
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.userId)
      .maybeSingle();

    if (customerError) {
      return errorJson(500, "Failed to load billing profile", {
        details: `${customerError.code ?? "DB_ERROR"}: ${customerError.message}`,
        requestId,
      });
    }

    if (!customer?.stripe_customer_id) {
      return errorJson(404, "No billing account found", {
        details: "Create a subscription before opening the billing portal",
        requestId,
      });
    }

    let body: { returnUrl?: string } = {};
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

    const origin = event.headers.origin ?? event.headers.Origin;
    const appUrl = process.env.APP_URL || origin || APP_URL_FALLBACK;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: body.returnUrl || `${appUrl}/`,
    });

    return json(200, {
      url: portalSession.url,
    });
  } catch (error) {
    return handleRouteError(error, "Failed to create billing portal session", requestId);
  }
};

