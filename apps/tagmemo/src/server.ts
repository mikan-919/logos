import { serveStatic } from "hono/bun";
import { readFile } from "node:fs/promises";
import { connectDatabase } from "@logos/db";
import { createTagmemoApp } from "./app.ts";
import { createAuth } from "./auth.ts";
import { loadInitialData } from "./initial-data.ts";
import { migrate } from "./migrate.ts";
import { renderInitialHtml } from "./render-initial.ts";

const databaseUrl = process.env.TURSO_DATABASE_URL ?? "file:./tagmemo.db";
const baseURL = process.env.BETTER_AUTH_URL;
const secret = process.env.BETTER_AUTH_SECRET;
if (!baseURL || !secret)
  throw new Error("BETTER_AUTH_URL と BETTER_AUTH_SECRET を設定してください");

const db = await connectDatabase(databaseUrl, process.env.TURSO_AUTH_TOKEN);
const auth = createAuth(db, baseURL, secret);
try {
  await migrate(db, auth);
} catch (error) {
  await db.destroy();
  throw error;
}

const app = createTagmemoApp(db, auth);
app.get("/", async (c) => {
  const html = await readFile("./dist/client/index.html", "utf8");
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.html(html);
  const data = await loadInitialData(db, session.user.id);
  c.header("Cache-Control", "private, no-store");
  c.header("Vary", "Cookie");
  return c.html(renderInitialHtml(html, data));
});
app.use("/*", serveStatic({ root: "./dist/client" }));

export default { hostname: "127.0.0.1", port: Number(process.env.PORT ?? 3000), fetch: app.fetch };
