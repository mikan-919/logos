import { serveStatic } from "hono/bun";
import { connectDatabase } from "@logos/db";
import { createTagmemoApp } from "./app.ts";
import { createAuth } from "./auth.ts";
import { migrate } from "./migrate.ts";

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
app.use("/*", serveStatic({ root: "./dist" }));
app.get("/", serveStatic({ path: "./dist/index.html" }));

export default { hostname: "127.0.0.1", port: Number(process.env.PORT ?? 3000), fetch: app.fetch };
