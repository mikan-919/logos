import { Migrator } from "kysely/migration";
import { getMigrations } from "better-auth/db/migration";
import * as initialMigration from "@logos/db/migrations/initial";
import type { Database } from "@logos/db";
import type { Kysely } from "kysely";
import type { createAuth } from "./auth.ts";
import { nameType } from "./component-types.ts";

export async function migrate(db: Kysely<Database>, auth: ReturnType<typeof createAuth>) {
  await (await getMigrations(auth.options)).runMigrations();
  const migrator = new Migrator({
    db,
    provider: { getMigrations: async () => ({ "20260926_initial": initialMigration }) },
  });
  const { error } = await migrator.migrateToLatest();
  if (error) throw error;
  await db
    .insertInto("component_types")
    .values({
      key: nameType.key,
      owner_app: nameType.ownerApp,
      schema: JSON.stringify(nameType.schema),
    })
    .onConflict((conflict) => conflict.column("key").doNothing())
    .execute();
}
