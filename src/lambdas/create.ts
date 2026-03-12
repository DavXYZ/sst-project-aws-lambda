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
    console.log("Create item by user:", user.userId);

    let body: { name?: string; description?: string };

    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "Invalid JSON body" });
    }

    if (!body.name?.trim()) {
      return json(400, { error: "name is required" });
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("items")
      .insert({
        name: body.name.trim(),
        description: body.description ?? null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Supabase insert error", error);
      return json(500, { error: "Failed to create item" });
    }

    return json(201, data);
  } catch (error) {
    return handleRouteError(error, "Failed to create item");
  }
};

