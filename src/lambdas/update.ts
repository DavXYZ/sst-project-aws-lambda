import type { APIGatewayProxyResultV2 } from "aws-lambda";
import { getAuthUser } from "../lib/auth";
import type { AuthorizedEvent } from "../lib/auth";
import { json } from "../lib/http";
import { getSupabaseClient } from "../lib/supabase";

export const handler = async (
  event: AuthorizedEvent
): Promise<APIGatewayProxyResultV2> => {
  const user = getAuthUser(event);
  console.log("Update item by user:", user.userId);

  const id = event.pathParameters?.id;

  if (!id) {
    return json(400, { error: "id is required" });
  }

  let body: { name?: string; description?: string };
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const updates: { name?: string; description?: string; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (body.name !== undefined) {
    if (!body.name.trim()) {
      return json(400, { error: "name cannot be empty" });
    }
    updates.name = body.name.trim();
  }

  if (body.description !== undefined) {
    updates.description = body.description;
  }

  if (body.name === undefined && body.description === undefined) {
    return json(400, { error: "Provide name or description to update" });
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("items")
    .update(updates)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("Supabase update error", error);
    return json(500, { error: "Failed to update item" });
  }

  if (!data) {
    return json(404, { error: "Item not found" });
  }

  return json(200, data);
};

