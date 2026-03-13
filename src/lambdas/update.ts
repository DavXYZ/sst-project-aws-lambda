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
    console.log("Update item by user:", user.userId);

    const id = event.pathParameters?.id;

    if (!id) {
      return errorJson(400, "id is required", {
        details: "Path parameter 'id' is missing",
        requestId,
      });
    }

    let body: { name?: string; description?: string };
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return errorJson(400, "Invalid JSON body", {
        details: "Request body must be valid JSON",
        requestId,
      });
    }

    const updates: { name?: string; description?: string; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return errorJson(400, "name cannot be empty", {
          details: "If provided, 'name' must contain non-whitespace characters",
          requestId,
        });
      }
      updates.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description;
    }

    if (body.name === undefined && body.description === undefined) {
      return errorJson(400, "Provide name or description to update", {
        details: "Body must include at least one of: name, description",
        requestId,
      });
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
      return errorJson(500, "Failed to update item", {
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
    return handleRouteError(error, "Failed to update item", requestId);
  }
};

