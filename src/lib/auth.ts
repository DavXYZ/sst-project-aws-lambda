import type { APIGatewayProxyEventV2WithLambdaAuthorizer } from "aws-lambda";

export type AuthContext = {
  userId: string;
  userEmail: string;
};

export type AuthorizedEvent = APIGatewayProxyEventV2WithLambdaAuthorizer<AuthContext>;

export function getAuthUser(event: AuthorizedEvent): AuthContext {
  return {
    userId: event.requestContext.authorizer.lambda.userId,
    userEmail: event.requestContext.authorizer.lambda.userEmail,
  };
}
