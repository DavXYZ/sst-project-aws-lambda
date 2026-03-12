import type { APIGatewayProxyResultV2 } from "aws-lambda";
import { getAuthUser } from "../lib/auth";
import type { AuthorizedEvent } from "../lib/auth";
import { handleRouteError, json, noContent } from "../lib/http";
import { getSupabaseClient } from "../lib/supabase";

export const handler = async (
  event: AuthorizedEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);
    console.log("Delete item by user:", user.userId);

    const id = event.pathParameters?.id;

    if (!id) {
      return json(400, { error: "id is required" });
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("items")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Supabase delete error", error);
      return json(500, { error: "Failed to delete item" });
    }

    if (!data) {
      return json(404, { error: "Item not found" });
    }

    return noContent();
  } catch (error) {
    return handleRouteError(error, "Failed to delete item");
  }
};

