// SnapTrade API client
// HMAC-SHA256 signing logic ported from iOS SnapTradeAPI.swift
// consumerKey is managed only in this file (backend) and is never exposed to iOS

const BASE_URL = "https://api.snaptrade.com/api/v1";

function requireEnv(key: string): string {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

const CLIENT_ID = requireEnv("SNAPTRADE_CLIENT_ID");
const CONSUMER_KEY = requireEnv("SNAPTRADE_CONSUMER_KEY");

type QueryParams = [string, string][];

// Equivalent to Swift's JSONSerialization.data(.sortedKeys): recursively sorts all keys alphabetically and serializes to JSON
function sortedStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(sortedStringify).join(",") + "]";
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return "{" + keys.map((k) => `${JSON.stringify(k)}:${sortedStringify(obj[k])}`).join(",") + "}";
}

// Generates an HMAC-SHA256 signature
// SnapTrade signing specification:
//   Signing target = JSON.stringify({ content: <body|null>, path: "/api/v1" + path, query: sortedQueryString })
//   * Keys must be in alphabetical order (sortedKeys)
//   * Query parameters must also be sorted alphabetically before signing
async function generateSignature(
  path: string,
  queryParams: QueryParams,
  body: unknown,
): Promise<{ signature: string; timestamp: string; sortedParams: QueryParams }> {
  const timestamp = String(Math.floor(Date.now() / 1000));

  // Append timestamp and clientId to the query params and sort alphabetically
  // The SnapTrade server uses all query parameters for signature verification
  const sortedParams = ([
    ...queryParams,
    ["clientId", CLIENT_ID] as [string, string],
    ["timestamp", timestamp] as [string, string],
  ] as QueryParams).sort(([a], [b]) => a.localeCompare(b));

  const queryString = sortedParams
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  // Build the JSON object to be signed
  const sigObject = {
    content: body ?? null,
    path: "/api/v1" + path,
    query: queryString,
  };

  // Recursively sort all keys in alphabetical order
  const sigString = sortedStringify(sigObject);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(CONSUMER_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(sigString),
  );
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

  return { signature, timestamp, sortedParams };
}

// Sends a request to the SnapTrade API
async function request<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  queryParams: QueryParams = [],
  body?: unknown,
): Promise<T> {
  const bodyString = body ? JSON.stringify(body) : undefined;

  const { signature, sortedParams } = await generateSignature(
    path,
    queryParams,
    body ?? null,
  );

  const url = new URL(BASE_URL + path);
  for (const [k, v] of sortedParams) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      "Signature": signature,
    },
    body: bodyString,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`SnapTrade API error ${res.status}: ${detail}`);
  }

  return res.json() as Promise<T>;
}

// DELETE /snapTrade/deleteUser
export async function deleteUser(userId: string): Promise<void> {
  await request<unknown>("DELETE", "/snapTrade/deleteUser", [
    ["userId", userId],
  ]);
}

// DELETE /authorizations/{authorizationId}
export async function deleteAuthorization(
  userId: string,
  userSecret: string,
  authorizationId: string,
): Promise<void> {
  await request<unknown>("DELETE", `/authorizations/${authorizationId}`, [
    ["userId", userId],
    ["userSecret", userSecret],
  ]);
}

// POST /snapTrade/registerUser
export async function registerUser(
  userId: string,
): Promise<{ userId: string; userSecret: string }> {
  return await request<{ userId: string; userSecret: string }>(
    "POST",
    "/snapTrade/registerUser",
    [],
    { userId },
  );
}

// POST /snapTrade/login - Retrieves the broker connection portal URL
export async function getConnectionPortalUrl(
  userId: string,
  userSecret: string,
  customRedirect: string,
): Promise<{ redirectURI: string }> {
  return await request<{ redirectURI: string }>(
    "POST",
    "/snapTrade/login",
    [
      ["userId", userId],
      ["userSecret", userSecret],
    ],
    { connectionType: "read", customRedirect },
  );
}

// GET /accounts - Retrieves the list of linked brokerage accounts
export async function fetchAccounts<T>(
  userId: string,
  userSecret: string,
): Promise<T> {
  return await request<T>("GET", "/accounts", [
    ["userId", userId],
    ["userSecret", userSecret],
  ]);
}

// GET /accounts/{accountId}/activities
export async function fetchActivities<T>(
  userId: string,
  userSecret: string,
  accountId: string,
): Promise<T> {
  return await request<T>("GET", `/accounts/${accountId}/activities`, [
    ["userId", userId],
    ["userSecret", userSecret],
  ] as QueryParams);
}

// GET /authorizations - Retrieves the list of connections and their disabled status
type SnapTradeAuthorization = {
  id: string;
  disabled: boolean | null;
  disabled_date: string | null;
};

export async function fetchAuthorizations(
  userId: string,
  userSecret: string,
): Promise<SnapTradeAuthorization[]> {
  return await request<SnapTradeAuthorization[]>("GET", "/authorizations", [
    ["userId", userId],
    ["userSecret", userSecret],
  ]);
}

// POST /snapTrade/login (reconnect) - Retrieves the re-authentication portal URL for an existing connection
export async function getReconnectPortalUrl(
  userId: string,
  userSecret: string,
  authorizationId: string,
  customRedirect: string,
): Promise<{ redirectURI: string }> {
  return await request<{ redirectURI: string }>(
    "POST",
    "/snapTrade/login",
    [
      ["userId", userId],
      ["userSecret", userSecret],
    ],
    { connectionType: "read", customRedirect, reconnect: authorizationId },
  );
}

// GET /accounts/{accountId}/holdings
export async function fetchHoldings<T>(
  userId: string,
  userSecret: string,
  accountId: string,
): Promise<T> {
  return await request<T>("GET", `/accounts/${accountId}/holdings`, [
    ["userId", userId],
    ["userSecret", userSecret],
  ] as QueryParams);
}
