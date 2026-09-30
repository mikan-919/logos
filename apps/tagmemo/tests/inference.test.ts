import { expect, test, vi } from "vite-plus/test";
import { inferTagScores } from "../src/data.ts";
import worker from "../src/worker.ts";
import { setup } from "../../logos/tests/helpers.ts";

test("100件を超えるタグでも全タグのJev結果を取得する", async () => {
  const tags = Array.from({ length: 101 }, (_, i) => ({ id: `tag-${i}`, name: `タグ${i}` }));
  const env = {
    LOGOS: { fetch: async () => Response.json({ user: { id: "user" } }) },
    ASSETS: { fetch: async () => new Response(null, { status: 404 }) },
    TYPESAFE_API_KEY: "test-key",
  };
  vi.stubGlobal("fetch", async (path: string, init: RequestInit = {}) => {
    if (path === "/infer-tags") {
      return worker.fetch(new Request(`http://localhost${path}`, init), env);
    }
    if (path !== "https://api.typesafe.ai/v1/systemone") throw new Error(`Unexpected URL: ${path}`);
    if (typeof init.body !== "string") throw new Error("Expected JSON request body");
    const input = JSON.parse(init.body);
    return Response.json({
      answers: Object.fromEntries(
        Object.keys(input.questions).map((key) => [
          key,
          { type: "noul", noul: key === "tag_99" ? 0.9 : 0.3 },
        ]),
      ),
    });
  });
  try {
    const scores = await inferTagScores("タイトル", "本文", tags);
    expect(Object.keys(scores).sort()).toEqual(tags.map((tag) => tag.id).sort());
    expect(scores["tag-0"]).toBe(0.3);
    expect(scores["tag-99"]).toBe(0.9);
    expect(scores["tag-100"]).toBe(0.3);
  } finally {
    vi.unstubAllGlobals();
  }
});

test("タグの推定結果が欠けている場合は全件推定済みとして扱わない", async () => {
  vi.stubGlobal("fetch", async () => Response.json({ scores: { a: 0.8 } }));
  try {
    await expect(
      inferTagScores("タイトル", "本文", [
        { id: "a", name: "A" },
        { id: "b", name: "B" },
      ]),
    ).rejects.toThrow("タグの推定結果が不足しているか不正です");
  } finally {
    vi.unstubAllGlobals();
  }
});

test("推定POSTの本文ヘッダーを認証GETへ転送せず、ログイン状態を維持する", async () => {
  const { app, db, cookie, origin } = await setup();
  const env = {
    TYPESAFE_API_KEY: "test-key",
    ASSETS: { fetch: async () => new Response(null, { status: 404 }) },
    LOGOS: {
      fetch: async (request: Request) => {
        // Emulate an empty body stream when POST body framing survives an internal GET.
        if (!request.headers.has("Content-Length")) return app.fetch(request);
        const transported = new Request(request.url, {
          method: "POST",
          headers: request.headers,
          body: new Uint8Array(),
        });
        Object.defineProperty(transported, "method", { value: request.method });
        return app.fetch(transported);
      },
    },
  };
  vi.stubGlobal("fetch", async () =>
    Response.json({ answers: { tag_0: { type: "noul", noul: 0.7 } } }),
  );
  try {
    const body = JSON.stringify({
      title: "分類",
      body: "本文",
      tags: [{ id: "tag", name: "研究" }],
    });
    const headers = {
      "Content-Type": "application/json",
      "Content-Length": String(Buffer.byteLength(body)),
      Cookie: cookie,
      Origin: origin,
    };
    const response = await worker.fetch(
      new Request(`${origin}/infer-tags`, { method: "POST", headers, body }),
      env,
    );
    expect(await response.json()).toEqual({ scores: { tag: 0.7 } });
    expect(response.status).toBe(200);
    const anonymous = await worker.fetch(
      new Request(`${origin}/infer-tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      }),
      env,
    );
    expect(anonymous.status).toBe(401);
  } finally {
    vi.unstubAllGlobals();
    await db.destroy();
  }
});
