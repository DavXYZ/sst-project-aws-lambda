import Stripe from "stripe";

let cachedClient: Stripe | undefined;

export class MissingStripeConfigError extends Error {
  constructor(message = "STRIPE_SECRET_KEY is required") {
    super(message);
    this.name = "MissingStripeConfigError";
  }
}

export function getStripeClient(): Stripe {
  if (cachedClient) {
    return cachedClient;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new MissingStripeConfigError();
  }

  cachedClient = new Stripe(stripeSecretKey);

  return cachedClient;
}

export function isSubscriptionActive(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

