// Logos プロトタイプサーバー: REST API + Web UI 静的配信。

import { buildApp } from "../app.ts";
import { handleApi } from "./routes.ts";

const engine = buildApp();
const WEB_DIR = new URL("../../web/", import.meta.url).pathname;
const PORT = Number(process.env.PORT ?? 3000);

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname.startsWith("/api")) {
      try {
        return await handleApi(engine, req, url);
      } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
    }

    // 静的配信
    const rel = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const file = Bun.file(WEB_DIR + rel);
    if (await file.exists()) return new Response(file);
    return new Response("not found", { status: 404 });
  },
});

console.log(`Logos prototype running at http://localhost:${server.port}`);
console.log(`  Web UI : http://localhost:${server.port}/`);
console.log(`  API    : http://localhost:${server.port}/api/entities`);
