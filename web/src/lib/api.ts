export type Item = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionStatus = {
  subscribed: boolean;
  status: string | null;
  priceId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

const baseUrl = import.meta.env.VITE_API_URL;

if (!baseUrl) {
  throw new Error("VITE_API_URL is required");
}

async function request<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (init?.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json().catch(() => null)) as
    | { error?: string }
    | T
    | null;

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && body.error
        ? body.error
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body as T;
}

export async function getItems(accessToken: string) {
  return request<{ items: Item[]; count: number }>("/items", accessToken);
}

export async function createItem(
  accessToken: string,
  payload: { name: string; description?: string },
) {
  return request<Item>("/items", accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateItem(
  accessToken: string,
  id: string,
  payload: { name?: string; description?: string },
) {
  return request<Item>(`/items/${id}`, accessToken, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteItem(accessToken: string, id: string) {
  return request<void>(`/items/${id}`, accessToken, {
    method: "DELETE",
  });
}

export async function getSubscriptionStatus(accessToken: string) {
  return request<SubscriptionStatus>("/subscriptions/status", accessToken);
}

export async function createCheckoutSession(accessToken: string) {
  return request<{ url: string; sessionId: string }>(
    "/subscriptions/create-checkout",
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
}

export async function createBillingPortalSession(accessToken: string) {
  return request<{ url: string }>("/subscriptions/portal", accessToken, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

