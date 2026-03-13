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
    console.log("Create item by user:", user.userId);

    let body: { name?: string; description?: string };

    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return errorJson(400, "Invalid JSON body", {
        details: "Request body must be valid JSON",
        requestId,
      });
    }

    if (!body.name?.trim()) {
      return errorJson(400, "name is required", {
        details: "Provide a non-empty 'name' field",
        requestId,
      });
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
      return errorJson(500, "Failed to create item", {
        details: `${error.code ?? "DB_ERROR"}: ${error.message}`,
        requestId,
      });
    }

    return json(201, data);
  } catch (error) {
    return handleRouteError(error, "Failed to create item", requestId);
  }
};

