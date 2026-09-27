import { connectDatabase } from "@logos/db";
import { createLogosApp } from "./app.ts";
import { createAuth } from "./auth.ts";
import { loadInitialData } from "../../tagmemo/src/initial-data.ts";
import { migrate } from "./migrate.ts";
import { renderInitialHtml } from "../../tagmemo/src/render-initial.ts";

interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  ASSETS: { fetch(request: Request): Promise<Response> };
}

let application: ReturnType<typeof initialize> | undefined;

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
    return { app: createLogosApp(db, auth), auth, db };
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
    const { app, auth, db } = await application;
    const path = new URL(request.url).pathname;
    if (
      request.method === "GET" &&
      (path === "/" || path === "/index.html" || path === "/tagmemo")
    ) {
      return Response.redirect(new URL("/tagmemo/", request.url), 302);
    }
    if (request.method === "GET" && (path === "/tagmemo/" || path === "/tagmemo/index.html")) {
      const asset = await env.ASSETS.fetch(
        new Request(new URL("/tagmemo/index.html", request.url)),
      );
      if (!asset.ok) return asset;
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) return asset;
      const data = await loadInitialData(db, session.user.id);
      const headers = new Headers(asset.headers);
      headers.set("Cache-Control", "private, no-store");
      headers.append("Vary", "Cookie");
      headers.delete("Content-Length");
      headers.delete("ETag");
      return new Response(renderInitialHtml(await asset.text(), data), {
        status: asset.status,
        headers,
      });
    }
    return app.fetch(request);
  },
};
