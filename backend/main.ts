import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { router } from "./router.ts";

const handler = new OpenAPIHandler(router);

Deno.serve({ port: 8000 }, async (request) => {
  const url = new URL(request.url);

  if (url.pathname.startsWith("/api")) {
    const { matched, response } = await handler.handle(request, {
      prefix: "/api",
      context: {},
    });
    if (matched) return response;
  }

  return new Response("Not Found", { status: 404 });
});

console.log("Server running on http://localhost:8000");
