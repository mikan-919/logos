import { createLogosApi } from "@logos/backend";
import type { Database } from "@logos/db";
import { Hono } from "hono";
import type { Kysely } from "kysely";

export function createTagmemoApp(db: Kysely<Database>, userId: string) {
  const app = new Hono();
  app.route("/api", createLogosApi({ db, authenticate: () => ({ userId, appId: "tagmemo" }) }));
  return app;
}
