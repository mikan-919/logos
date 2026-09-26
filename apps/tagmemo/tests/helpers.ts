import { connectDatabase } from "@logos/db";
import { getMigrations } from "better-auth/db/migration";
import { up } from "../../../packages/db/src/migrations/20260926_initial.ts";
import type { Kysely } from "kysely";
import { createAuth } from "../src/auth.ts";
import { createTagmemoApp } from "../src/app.ts";

const origin = "http://localhost:3000";

export async function setup() {
  const db = await connectDatabase("file::memory:");
  const auth = createAuth(db, origin, "test-secret-at-least-thirty-two-characters");
  await (await getMigrations(auth.options)).runMigrations();
  await up(db as unknown as Kysely<unknown>);
  const app = createTagmemoApp(db, auth);
  const signup = await app.request(`${origin}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify({
      name: "試験利用者",
      email: "test@example.com",
      password: "password1234",
    }),
  });
  const cookie = signup.headers.get("set-cookie")?.split(";")[0];
  if (signup.status !== 200 || !cookie) {
    throw new Error(`登録に失敗しました: ${signup.status} ${await signup.text()}`);
  }
  return { db, app, cookie, origin };
}
