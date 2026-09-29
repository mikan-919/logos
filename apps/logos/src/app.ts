import { createLogosApi } from "@logos/backend";
import type { Database } from "@logos/db";
import { Hono } from "hono";
import type { Kysely } from "kysely";
import type { createAuth } from "./auth.ts";
import { createLogosMcp } from "./mcp.ts";

export function createLogosApp(db: Kysely<Database>, auth: ReturnType<typeof createAuth>) {
  const app = new Hono();
  app.all("/api/auth/*", (c) => auth.handler(c.req.raw));
  app.all("/mcp", async (c) => {
    const origin = c.req.header("Origin");
    if (origin && origin !== new URL(c.req.url).origin) {
      return c.json({ error: "Origin が一致しません" }, 403);
    }
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "認証が必要です" }, 401);
    const api = createLogosApi({
      db,
      authenticate: () => ({ userId: session.user.id, appId: "logos" }),
    });
    return createLogosMcp(api).fetch(c.req.raw);
  });
  app.route(
    "/api",
    createLogosApi({
      db,
      authenticate: async (request) => {
        const session = await auth.api.getSession({ headers: request.headers });
        return session ? { userId: session.user.id, appId: "logos" } : null;
      },
    }),
  );
  return app;
}
