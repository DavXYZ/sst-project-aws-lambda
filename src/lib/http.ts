import type { APIGatewayProxyStructuredResultV2 } from "aws-lambda";

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
