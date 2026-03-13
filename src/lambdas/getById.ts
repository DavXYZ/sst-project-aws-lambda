import type { APIGatewayProxyResultV2 } from "aws-lambda";
import { getAuthUser } from "../lib/auth";
import type { AuthorizedEvent } from "../lib/auth";
import { errorJson, handleRouteError, json } from "../lib/http";
import { getSupabaseClient } from "../lib/supabase";

export const handler = async (
  event: AuthorizedEvent
): Promise<APIGatewayProxyResultV2> => {
  const requestId = event.requestContext.requestId;

  try {
    const user = getAuthUser(event);
    console.log("Get item by user:", user.userId);

    const id = event.pathParameters?.id;

    if (!id) {
      return errorJson(400, "id is required", {
        details: "Path parameter 'id' is missing",
        requestId,
      });
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Supabase select by id error", error);
      return errorJson(500, "Failed to fetch item", {
        details: `${error.code ?? "DB_ERROR"}: ${error.message}`,
        requestId,
      });
    }

    if (!data) {
      return errorJson(404, "Item not found", {
        details: `No item found for id '${id}'`,
        requestId,
      });
    }

    return json(200, data);
  } catch (error) {
    return handleRouteError(error, "Failed to fetch item", requestId);
  }
};

