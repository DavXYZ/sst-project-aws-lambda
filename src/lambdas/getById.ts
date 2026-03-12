import type { APIGatewayProxyResultV2 } from "aws-lambda";
import { getAuthUser } from "../lib/auth";
import type { AuthorizedEvent } from "../lib/auth";
import { json } from "../lib/http";
import { getSupabaseClient } from "../lib/supabase";

export const handler = async (
  event: AuthorizedEvent
): Promise<APIGatewayProxyResultV2> => {
  const user = getAuthUser(event);
  console.log("Get item by user:", user.userId);

  const id = event.pathParameters?.id;

  if (!id) {
    return json(400, { error: "id is required" });
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Supabase select by id error", error);
    return json(500, { error: "Failed to fetch item" });
  }

  if (!data) {
    return json(404, { error: "Item not found" });
  }

  return json(200, data);
};

