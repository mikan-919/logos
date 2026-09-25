import { expect, test } from "vite-plus/test";
import {
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  type Dialect,
} from "kysely";
import type { Migration } from "kysely/migration";
import { down, up } from "../src/migrations/20260926_initial.ts";

const migration: Migration = { up, down };

test("initial migration compiles PostgreSQL schema and rollback", async () => {
  const statements: string[] = [];
  const dialect: Dialect = {
    createAdapter: () => new PostgresAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: (db) => new PostgresIntrospector(db),
    createQueryCompiler: () => new PostgresQueryCompiler(),
  };
  const db = new Kysely<unknown>({
    dialect,
    log: (event) => {
      if (event.level === "query") statements.push(event.query.sql);
    },
  });

  await migration.up(db);
  expect(statements.some((query) => query.includes('create table "components"'))).toBe(true);
  expect(statements.some((query) => query.includes("components_value_object"))).toBe(true);
  expect(statements.some((query) => query.includes("entity_permissions_by_user"))).toBe(true);

  await migration.down?.(db);
  expect(statements.at(-1)).toContain('drop table "entities"');
  await db.destroy();
});
