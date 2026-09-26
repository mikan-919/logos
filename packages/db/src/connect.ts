import { createClient } from "@libsql/client";
import { Kysely } from "kysely";
import { LibSQLDialect } from "kysely-turso/libsql";
import type { Database } from "./schema.ts";

export async function connectDatabase(url: string, authToken?: string) {
  const client = createClient({ url, authToken });
  await client.execute("PRAGMA foreign_keys = ON");
  return new Kysely<Database>({ dialect: new LibSQLDialect({ client }) });
}
