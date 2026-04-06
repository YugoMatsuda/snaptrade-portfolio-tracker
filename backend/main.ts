import { RPCHandler } from "@orpc/server/fetch";
import { router } from "./router.ts";

const handler = new RPCHandler(router);

Deno.serve({ port: 8000 }, async (request) => {
  const url = new URL(request.url);

  if (url.pathname.startsWith("/rpc")) {
    const { matched, response } = await handler.handle(request, {
      prefix: "/rpc",
      context: {},
    });
    if (matched) return response;
  }

  return new Response("Not Found", { status: 404 });
});

console.log("Server running on http://localhost:8000");
