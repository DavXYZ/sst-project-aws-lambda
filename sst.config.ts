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

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      throw new Error(
        "SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY must be set",
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
      },
    });

    return {
      api: api.url,
      web: web.url,
    };
  }
});
