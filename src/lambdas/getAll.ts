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
    console.log("Get all items by user:", user.userId);

    const supabase = getSupabaseClient();
    let { data, error, count } = await supabase
      .from("items")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (error && shouldRetryWithoutCreatedAtOrdering(error)) {
      console.warn("Retrying /items query without created_at ordering", error);
      ({ data, error, count } = await supabase
        .from("items")
        .select("*", { count: "exact" }));
    }

    if (error) {
      console.error("Supabase select all error", error);
      return errorJson(500, "Failed to fetch items", {
        details: `${error.code ?? "DB_ERROR"}: ${error.message}`,
        requestId,
      });
    }

    return json(200, { items: data ?? [], count: count ?? 0 });
  } catch (error) {
    return handleRouteError(error, "Failed to fetch items", requestId);
  }
};

function shouldRetryWithoutCreatedAtOrdering(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}): boolean {
  if (error.code !== "42703" && error.code !== "PGRST204") {
    return false;
  }

  const raw = [error.message, error.details, error.hint]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ")
    .toLowerCase();

  return raw.includes("created_at");
}

