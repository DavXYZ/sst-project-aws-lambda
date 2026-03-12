import type { APIGatewayProxyResultV2 } from "aws-lambda";
import { getAuthUser } from "../lib/auth";
import type { AuthorizedEvent } from "../lib/auth";
import { handleRouteError, json } from "../lib/http";
import { getSupabaseClient } from "../lib/supabase";

export const handler = async (
  event: AuthorizedEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const user = getAuthUser(event);
    console.log("Get all items by user:", user.userId);

    const supabase = getSupabaseClient();
    const { data, error, count } = await supabase
      .from("items")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase select all error", error);
      return json(500, { error: "Failed to fetch items" });
    }

    return json(200, { items: data ?? [], count: count ?? 0 });
  } catch (error) {
    return handleRouteError(error, "Failed to fetch items");
  }
};

