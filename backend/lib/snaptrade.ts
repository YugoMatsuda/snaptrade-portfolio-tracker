// SnapTrade APIクライアント
// HMAC-SHA256署名ロジックはiOS SnapTradeAPI.swiftから移植
// consumerKeyはこのファイル（バックエンド）のみで管理し、iOSには露出しない

const BASE_URL = "https://api.snaptrade.com/api/v1";
const CLIENT_ID = Deno.env.get("SNAPTRADE_CLIENT_ID") ?? "";
const CONSUMER_KEY = Deno.env.get("SNAPTRADE_CONSUMER_KEY") ?? "";

type QueryParams = [string, string][];

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
  const sortedParams: QueryParams = [
    ...queryParams,
    ["clientId", CLIENT_ID],
    ["timestamp", timestamp],
  ].sort(([a], [b]) => a.localeCompare(b));

  const queryString = sortedParams
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  // 署名対象のJSONを構築（iOS側と同じ構造）
  const sigObject = {
    content: body ?? null,
    path: "/api/v1" + path,
    query: queryString,
  };

  // JSON.stringify with sorted keys (iOS側の .sortedKeys オプションと同等)
  const sigString = JSON.stringify(sigObject, Object.keys(sigObject).sort());

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

// GET /accounts/{accountId}/holdings
export async function fetchHoldings(
  userId: string,
  userSecret: string,
  accountId: string,
) {
  return request("GET", `/accounts/${accountId}/holdings`, [
    ["userId", userId] as [string, string],
    ["userSecret", userSecret] as [string, string],
  ]);
}
