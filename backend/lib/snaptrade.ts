// SnapTrade APIクライアント
// HMAC-SHA256署名ロジックはiOS SnapTradeAPI.swiftから移植
// consumerKeyはこのファイル（バックエンド）のみで管理し、iOSには露出しない

const BASE_URL = "https://api.snaptrade.com/api/v1";

function requireEnv(key: string): string {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

const CLIENT_ID = requireEnv("SNAPTRADE_CLIENT_ID");
const CONSUMER_KEY = requireEnv("SNAPTRADE_CONSUMER_KEY");

type QueryParams = [string, string][];

// Swift の JSONSerialization.data(.sortedKeys) と同等: 全キーを再帰的にアルファベット順でソートしてJSON化
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

// HMAC-SHA256署名を生成する
// SnapTradeの署名仕様:
//   署名対象 = JSON.stringify({ content: <body|null>, path: "/api/v1" + path, query: sortedQueryString })
//   ※ キーはアルファベット順（sortedKeys）
//   ※ クエリパラメータも署名前にアルファベット順にソートする
async function generateSignature(
  path: string,
  queryParams: QueryParams,
  body: unknown,
): Promise<{ signature: string; timestamp: string; sortedParams: QueryParams }> {
  const timestamp = String(Math.floor(Date.now() / 1000));

  // timestamp と clientId をクエリに追加してアルファベット順にソート
  // SnapTradeサーバーは全クエリパラメータを署名検証に使用する
  const sortedParams = ([
    ...queryParams,
    ["clientId", CLIENT_ID] as [string, string],
    ["timestamp", timestamp] as [string, string],
  ] as QueryParams).sort(([a], [b]) => a.localeCompare(b));

  const queryString = sortedParams
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  // 署名対象のJSONを構築
  const sigObject = {
    content: body ?? null,
    path: "/api/v1" + path,
    query: queryString,
  };

  // 全キーを再帰的にアルファベット順でソート
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

// SnapTrade APIへのリクエストを送信する
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

// POST /snapTrade/login - ブローカー接続ポータルURLを取得
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

// GET /accounts - 連携済み口座一覧を取得
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
