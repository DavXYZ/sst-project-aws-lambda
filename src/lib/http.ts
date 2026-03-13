import type { APIGatewayProxyStructuredResultV2 } from "aws-lambda";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
};

export type ApiErrorBody = {
  error: string;
  message: string;
  details?: string;
  requestId?: string;
};

export class RouteError extends Error {
  readonly statusCode: number;
  readonly details?: string;

  constructor(statusCode: number, message: string, details?: string) {
    super(message);
    this.name = "RouteError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

function hasErrorName(error: unknown, expectedName: string): error is Error {
  return error instanceof Error && error.name === expectedName;
}

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

export function errorJson(
  statusCode: number,
  message: string,
  options?: { details?: string; requestId?: string },
): APIGatewayProxyStructuredResultV2 {
  const body: ApiErrorBody = {
    // Keep legacy `error` key for existing clients while adding `message`.
    error: message,
    message,
    ...(options?.details ? { details: options.details } : {}),
    ...(options?.requestId ? { requestId: options.requestId } : {}),
  };

  return json(statusCode, body);
}

export function noContent(): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode: 204,
  };
}

export function handleRouteError(
  error: unknown,
  fallbackMessage: string,
  requestId?: string,
): APIGatewayProxyStructuredResultV2 {
  if (error instanceof RouteError) {
    return errorJson(error.statusCode, error.message, {
      details: error.details,
      requestId,
    });
  }

  if (hasErrorName(error, "MissingAuthContextError")) {
    return errorJson(401, "Unauthorized", {
      details: error.message,
      requestId,
    });
  }

  if (hasErrorName(error, "MissingSupabaseConfigError")) {
    return errorJson(500, "Server configuration error", {
      details: error.message,
      requestId,
    });
  }

  if (hasErrorName(error, "MissingStripeConfigError")) {
    return errorJson(500, "Server configuration error", {
      details: error.message,
      requestId,
    });
  }

  if (error instanceof Error) {
    console.error("Unhandled route error:", error);
    return errorJson(500, fallbackMessage, {
      details: error.message,
      requestId,
    });
  }

  console.error("Unhandled non-Error route failure:", error);
  return errorJson(500, fallbackMessage, {
    details: "Unknown runtime failure",
    requestId,
  });
}

