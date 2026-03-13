/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "sstproject",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripePriceId = process.env.STRIPE_PRICE_ID;

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !supabaseServiceRoleKey ||
      !stripeSecretKey ||
      !stripePriceId
    ) {
      throw new Error(
        "SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, and STRIPE_PRICE_ID must be set",
      );
    }

    // Simple API Gateway v2 with five lambda routes.
    const api = new sst.aws.ApiGatewayV2("api");

    // Create Lambda authorizer for Supabase JWT validation
    const authorizer = api.addAuthorizer({
      name: "supabaseAuthorizer",
      lambda: {
        function: {
          handler: "src/authorizer.handler",
          environment: {
            SUPABASE_URL: supabaseUrl,
            SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
          },
        },
        ttl: "0 seconds",
      },
    });

    const routeArgs = {
      auth: {
        lambda: authorizer.id,
      },
    };

    const functionEnv = {
      environment: {
        SUPABASE_URL: supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
        STRIPE_SECRET_KEY: stripeSecretKey,
        STRIPE_PRICE_ID: stripePriceId,
      },
    };

    api.route("POST /items", {
      handler: "src/lambdas/create.handler",
      ...functionEnv,
    }, routeArgs);

    api.route("GET /items", {
      handler: "src/lambdas/getAll.handler",
      ...functionEnv,
    }, routeArgs);

    api.route("GET /items/{id}", {
      handler: "src/lambdas/getById.handler",
      ...functionEnv,
    }, routeArgs);

    api.route("PUT /items/{id}", {
      handler: "src/lambdas/update.handler",
      ...functionEnv,
    }, routeArgs);

    api.route("DELETE /items/{id}", {
      handler: "src/lambdas/delete.handler",
      ...functionEnv,
    }, routeArgs);

    api.route("POST /subscriptions/create-checkout", {
      handler: "src/lambdas/stripe/createCheckout.handler",
      ...functionEnv,
    }, routeArgs);

    api.route("POST /subscriptions/portal", {
      handler: "src/lambdas/stripe/createPortal.handler",
      ...functionEnv,
    }, routeArgs);

    api.route("GET /subscriptions/status", {
      handler: "src/lambdas/stripe/getSubscriptionStatus.handler",
      ...functionEnv,
    }, routeArgs);

    api.route("POST /webhooks/stripe", {
      handler: "src/lambdas/stripe/webhook.handler",
      environment: {
        SUPABASE_URL: supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
        STRIPE_SECRET_KEY: stripeSecretKey,
        STRIPE_WEBHOOK_SECRET: stripeWebhookSecret ?? "",
      },
    });

    const web = new sst.aws.StaticSite("web", {
      path: "web",
      build: {
        command: "npm run build",
        output: "dist",
      },
      dev: {
        command: "npm run dev -- --host --port 5173",
        url: "http://localhost:5173",
      },
      environment: {
        VITE_API_URL: api.url,
        VITE_SUPABASE_URL: supabaseUrl,
        VITE_SUPABASE_ANON_KEY: supabaseAnonKey,
        VITE_STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY ?? "",
      },
    });

    return {
      api: api.url,
      web: web.url,
    };
  }
});
