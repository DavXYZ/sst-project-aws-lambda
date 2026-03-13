import type { APIGatewayProxyResultV2 } from "aws-lambda";
import { getAuthUser } from "../../lib/auth";
import type { AuthorizedEvent } from "../../lib/auth";
import { handleRouteError, json } from "../../lib/http";
import { getSubscriptionStatusForUser } from "./shared";

export const handler = async (
  event: AuthorizedEvent,
): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext.requestId;

  try {
    const user = getAuthUser(event);
    const status = await getSubscriptionStatusForUser(user.userId);

    return json(200, status);
  } catch (error) {
    return handleRouteError(error, "Failed to load subscription status", requestId);
  }
};

