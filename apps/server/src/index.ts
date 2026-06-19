import { Hono } from "hono";
import { cors } from "hono/cors";
import { createDb } from "@logos/core/src/db";
import { createWorld } from "@logos/core/src/world";
import { createRotax, createRotaxRouter } from "@logos/rotax";

const db = createDb();
const world = createWorld(db);
const rotax = createRotax(world);

const app = new Hono()
  .use("*", cors({ origin: "http://localhost:5173" }))
  .route("/api/rotax", createRotaxRouter(rotax));

export type AppType = typeof app;

Bun.serve({
  port: 3001,
  fetch: app.fetch,
});

console.log("Server running on http://localhost:3001");
