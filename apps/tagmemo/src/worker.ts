import { connectDatabase } from "@logos/db";
import { createTagmemoApp } from "./app.ts";
import { createAuth } from "./auth.ts";
import { migrate } from "./migrate.ts";

interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
}

let application: Promise<ReturnType<typeof createTagmemoApp>> | undefined;

async function initialize(env: Env) {
  for (const key of [
    "TURSO_DATABASE_URL",
    "TURSO_AUTH_TOKEN",
    "BETTER_AUTH_URL",
    "BETTER_AUTH_SECRET",
  ] as const) {
    if (!env[key]) throw new Error(`${key} を設定してください`);
  }
  if (!env.TURSO_DATABASE_URL.startsWith("libsql://")) {
    throw new Error("TURSO_DATABASE_URL には Turso の libsql:// 接続先を設定してください");
  }
  const db = await connectDatabase(env.TURSO_DATABASE_URL, env.TURSO_AUTH_TOKEN);
  try {
    const auth = createAuth(db, env.BETTER_AUTH_URL, env.BETTER_AUTH_SECRET);
    await migrate(db, auth);
    return createTagmemoApp(db, auth);
  } catch (error) {
    await db.destroy();
    throw error;
  }
}

export default {
  async fetch(request: Request, env: Env) {
    application ??= initialize(env).catch((error) => {
      application = undefined;
      throw error;
    });
    return (await application).fetch(request);
  },
};
