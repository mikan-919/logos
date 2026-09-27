import { betterAuth } from "better-auth";
import type { Database } from "@logos/db";
import type { Kysely } from "kysely";

export function createAuth(db: Kysely<Database>, baseURL: string, secret: string) {
  return betterAuth({
    database: { db, type: "sqlite" },
    baseURL,
    secret,
    emailAndPassword: { enabled: true },
    advanced: { database: { generateId: "uuid" } },
  });
}
