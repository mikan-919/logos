import { Migrator } from "kysely/migration";
import { serveStatic } from "hono/bun";
import { getMigrations } from "better-auth/db/migration";
import { connectDatabase } from "@logos/db";
import * as initialMigration from "@logos/db/migrations/initial";
import { createTagmemoApp } from "./app.ts";
import { createAuth } from "./auth.ts";

const databaseUrl = process.env.TURSO_DATABASE_URL ?? "file:./tagmemo.db";
const baseURL = process.env.BETTER_AUTH_URL;
const secret = process.env.BETTER_AUTH_SECRET;
if (!baseURL || !secret)
  throw new Error("BETTER_AUTH_URL と BETTER_AUTH_SECRET を設定してください");

const db = await connectDatabase(databaseUrl, process.env.TURSO_AUTH_TOKEN);
const auth = createAuth(db, baseURL, secret);
await (await getMigrations(auth.options)).runMigrations();
const migrator = new Migrator({
  db,
  provider: { getMigrations: async () => ({ "20260926_initial": initialMigration }) },
});
const { error } = await migrator.migrateToLatest();
if (error) {
  await db.destroy();
  throw error;
}

const app = createTagmemoApp(db, auth);
app.use("/*", serveStatic({ root: "./dist" }));
app.get("/", serveStatic({ path: "./dist/index.html" }));

export default { hostname: "127.0.0.1", port: Number(process.env.PORT ?? 3000), fetch: app.fetch };
