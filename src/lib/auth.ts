import type { APIGatewayProxyEventV2WithLambdaAuthorizer } from "aws-lambda";

export type AuthContext = {
  userId: string;
  userEmail: string;
};

export type AuthorizedEvent = APIGatewayProxyEventV2WithLambdaAuthorizer<AuthContext>;

export class MissingAuthContextError extends Error {
  constructor(message = "Missing authorizer user context") {
    super(message);
    this.name = "MissingAuthContextError";
  }
}

export function getAuthUser(event: AuthorizedEvent): AuthContext {
  const rawAuthorizer = event.requestContext.authorizer as
    | (AuthContext & { lambda?: AuthContext })
    | undefined;

  // API Gateway can place Lambda context either at authorizer.lambda or authorizer root.
  const context = rawAuthorizer?.lambda ?? rawAuthorizer;
  const userId = context?.userId;
  const userEmail = context?.userEmail;

  if (!userId) {
    const authorizerKeys = rawAuthorizer
      ? Object.keys(rawAuthorizer)
          .filter((key) => key !== "jwt")
          .join(",") || "none"
      : "none";
    const lambdaKeys = rawAuthorizer?.lambda
      ? Object.keys(rawAuthorizer.lambda).join(",") || "none"
      : "none";

    throw new MissingAuthContextError(
      `Missing authorizer userId (authorizer keys: ${authorizerKeys}; lambda keys: ${lambdaKeys})`
    );
  }

  return {
    userId,
    userEmail: typeof userEmail === "string" ? userEmail : "",
  };
}
