import type {
  APIGatewayRequestAuthorizerEventV2,
  APIGatewaySimpleAuthorizerWithContextResult,
} from "aws-lambda";
import { createClient } from "@supabase/supabase-js";

type AuthContext = {
  userId: string;
  userEmail: string;
};

type AuthResult = APIGatewaySimpleAuthorizerWithContextResult<AuthContext>;

export const handler = async (
  event: APIGatewayRequestAuthorizerEventV2
): Promise<AuthResult> => {
  try {
    const token = extractBearerToken(event);

    if (!token) {
      console.log("No Bearer token provided");
      return deny();
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Missing Supabase environment variables");
      return deny();
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      console.log("Invalid or expired token:", error?.message ?? "No user");
      return deny();
    }

    console.log("Authorized user:", data.user.id);

    return allow({
      userId: data.user.id,
      userEmail: data.user.email ?? "",
    });
  } catch (err) {
    console.error("Authorizer error:", err);
    return deny();
  }
};

function extractBearerToken(
  event: APIGatewayRequestAuthorizerEventV2
): string | undefined {
  const authHeader =
    event.headers?.authorization ?? event.headers?.Authorization;

  if (!authHeader) {
    return undefined;
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return undefined;
  }

  return token;
}

function allow(context: AuthContext): AuthResult {
  return {
    isAuthorized: true,
    context,
  };
}

function deny(): AuthResult {
  return {
    isAuthorized: false,
    context: {
      userId: "",
      userEmail: "",
    },
  };
}

