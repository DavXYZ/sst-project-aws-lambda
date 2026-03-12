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
        ttl: "5 minutes",
      },
    });

    const routeArgs = {
      environment: {
        SUPABASE_URL: supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
      },
      auth: {
        lambda: authorizer.id,
      },
    };

    api.route("POST /items", {
      ...routeArgs,
      handler: "src/lambdas/create.handler",
    });

    api.route("GET /items", {
      ...routeArgs,
      handler: "src/lambdas/getAll.handler",
    });

    api.route("GET /items/{id}", {
      ...routeArgs,
      handler: "src/lambdas/getById.handler",
    });

    api.route("PUT /items/{id}", {
      ...routeArgs,
      handler: "src/lambdas/update.handler",
    });

    api.route("DELETE /items/{id}", {
      ...routeArgs,
      handler: "src/lambdas/delete.handler",
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
      },
    });

    return {
      api: api.url,
      web: web.url,
    };
  }
});
