import type { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { MissingSupabaseConfigError } from "./supabase";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
};

export function json(
  statusCode: number,
  payload: unknown,
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  };
}

export function noContent(): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode: 204,
  };
}

export function handleRouteError(
  error: unknown,
  fallbackMessage: string,
): APIGatewayProxyStructuredResultV2 {
  if (error instanceof MissingSupabaseConfigError) {
    console.error("Missing Supabase runtime configuration", error);
    return json(500, { error: "Server configuration error" });
  }

  console.error("Unhandled route error", error);
  return json(500, { error: fallbackMessage });
}
