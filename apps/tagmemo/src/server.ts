import { PostgresDialect, Kysely } from "kysely";
import { Migrator } from "kysely/migration";
import pg from "pg";
import { serveStatic } from "hono/bun";
import type { Database } from "@logos/db";
import * as initialMigration from "../../../packages/db/src/migrations/20260926_initial.ts";
import { createTagmemoApp } from "./app.ts";

const databaseUrl = process.env.DATABASE_URL;
const userId = process.env.TAGMEMO_USER_ID;
if (!databaseUrl || !userId) {
  throw new Error("DATABASE_URL と TAGMEMO_USER_ID を設定してください");
}

const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool: new pg.Pool({ connectionString: databaseUrl }) }),
});
const migrator = new Migrator({
  db,
  provider: { getMigrations: async () => ({ "20260926_initial": initialMigration }) },
});
const { error } = await migrator.migrateToLatest();
if (error) {
  await db.destroy();
  throw error;
}

const app = createTagmemoApp(db, userId);
app.use("/*", serveStatic({ root: "./dist" }));
app.get("/", serveStatic({ path: "./dist/index.html" }));

export default { hostname: "127.0.0.1", port: Number(process.env.PORT ?? 3000), fetch: app.fetch };
