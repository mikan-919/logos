import { createLogosApi } from "@logos/backend";
import type { Database } from "@logos/db";
import { Hono } from "hono";
import type { Kysely } from "kysely";
import type { createAuth } from "./auth.ts";

export function createTagmemoApp(db: Kysely<Database>, auth: ReturnType<typeof createAuth>) {
  const app = new Hono();
  app.all("/api/auth/*", (c) => auth.handler(c.req.raw));
  app.route(
    "/api",
    createLogosApi({
      db,
      authenticate: async (request) => {
        const session = await auth.api.getSession({ headers: request.headers });
        return session ? { userId: session.user.id, appId: "tagmemo" } : null;
      },
    }),
  );
  return app;
}
