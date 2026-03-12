import type { APIGatewayProxyEventV2WithLambdaAuthorizer } from "aws-lambda";

export type AuthContext = {
  userId: string;
  userEmail: string;
};

export type AuthorizedEvent = APIGatewayProxyEventV2WithLambdaAuthorizer<AuthContext>;

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

type AuthorizerShape = {
  lambda?: Partial<AuthContext>;
  userId?: string;
  userEmail?: string;
};

export function getAuthUser(event: AuthorizedEvent): AuthContext {
  const authorizer = event.requestContext.authorizer as AuthorizerShape | undefined;
  const lambdaContext = authorizer?.lambda;

  const userId = readString(lambdaContext?.userId) ?? readString(authorizer?.userId);
  const userEmail =
    readString(lambdaContext?.userEmail) ?? readString(authorizer?.userEmail) ?? "";

  if (!userId) {
    console.error("Missing Lambda authorizer user context", {
      authorizerKeys: authorizer ? Object.keys(authorizer) : [],
      hasLambdaContext: Boolean(lambdaContext),
    });
    throw new UnauthorizedError("Missing authorized user context");
  }

  return {
    userId,
    userEmail,
  };
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

