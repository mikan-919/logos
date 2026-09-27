import { loadInitialData } from "./initial-data.ts";
import { registerComponentTypes } from "./register-types.ts";
import { renderInitialHtml } from "./render-initial.tsx";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  LOGOS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env) {
    const path = new URL(request.url).pathname;
    if (path.startsWith("/api/")) return env.LOGOS.fetch(request);
    if (
      request.method === "GET" &&
      (path === "/" || path === "/index.html" || path === "/tagmemo")
    ) {
      return Response.redirect(new URL("/tagmemo/", request.url), 302);
    }
    if (request.method !== "GET" || (path !== "/tagmemo/" && path !== "/tagmemo/index.html")) {
      return env.ASSETS.fetch(request);
    }
    const asset = await env.ASSETS.fetch(new Request(new URL("/tagmemo/index.html", request.url)));
    if (!asset.ok) return asset;
    const fetcher: typeof fetch = (path, init) => {
      const headers = new Headers(request.headers);
      for (const [key, value] of new Headers(init?.headers)) headers.set(key, value);
      return env.LOGOS.fetch(new Request(new URL(String(path), request.url), { ...init, headers }));
    };
    const sessionResponse = await fetcher("/api/auth/get-session");
    if (!sessionResponse.ok) return sessionResponse;
    const session = (await sessionResponse.json()) as { user: { id: string } } | null;
    if (!session) return asset;
    await registerComponentTypes(fetcher);
    const data = await loadInitialData(fetcher, session.user);
    const headers = new Headers(asset.headers);
    headers.set("Cache-Control", "private, no-store");
    headers.append("Vary", "Cookie");
    headers.delete("Content-Length");
    headers.delete("ETag");
    return new Response(renderInitialHtml(await asset.text(), data), {
      status: asset.status,
      headers,
    });
  },
};
