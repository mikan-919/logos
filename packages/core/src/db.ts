import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sql } from "drizzle-orm";
import * as schema from "./db/schema";

export function createDb(path: string = "logos.db") {
  const sqlite = new Database(path);
  const db = drizzle(sqlite, { schema });

  // create tables if not exists (no migration tooling needed for now)
  db.run(sql`
    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS components (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      origin TEXT NOT NULL,
      authority TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(entity_id, type)
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS change_log (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL,
      component_type TEXT NOT NULL,
      op TEXT NOT NULL,
      data_before TEXT,
      data_after TEXT,
      origin TEXT NOT NULL,
      at INTEGER NOT NULL
    )
  `);

  return db;
}

export type Db = ReturnType<typeof createDb>;
