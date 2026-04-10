import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { router } from "./router.ts";
import { getAuthContext } from "./middleware/auth.ts";

const handler = new OpenAPIHandler(router);

Deno.serve({ port: 8000 }, async (request) => {
  const url = new URL(request.url);

  if (url.pathname.startsWith("/api")) {
    let context = {};
    try {
      context = await getAuthContext(request);
    } catch {
      return new Response("Unauthorized", { status: 401 });
    }

    const { matched, response } = await handler.handle(request, {
      prefix: "/api",
      context,
    });
    if (matched) return response;
  }

  return new Response("Not Found", { status: 404 });
});

console.log("Server running on http://localhost:8000");
