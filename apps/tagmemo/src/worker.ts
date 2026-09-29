import { loadInitialData } from "./initial-data.ts";
import { registerComponentTypes } from "./register-types.ts";
import { renderInitialHtml } from "./render-initial.tsx";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  LOGOS: { fetch(request: Request): Promise<Response> };
  TYPESAFE_API_KEY?: string;
}

async function inferTags(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  const session = await env.LOGOS.fetch(
    new Request(new URL("/api/auth/get-session", request.url), { headers: request.headers }),
  );
  if (!session.ok) return new Response(null, { status: 502 });
  if (!(await session.json())) return new Response(null, { status: 401 });
  if (!env.TYPESAFE_API_KEY)
    return Response.json({ error: "タグ推定用の API 鍵が設定されていません" }, { status: 503 });
  const input: unknown = await request.json().catch(() => null);
  if (
    !input ||
    typeof input !== "object" ||
    !("title" in input) ||
    typeof input.title !== "string" ||
    input.title.length > 200 ||
    !("body" in input) ||
    typeof input.body !== "string" ||
    input.body.length > 20000 ||
    !("tags" in input) ||
    !Array.isArray(input.tags) ||
    input.tags.length > 100 ||
    input.tags.some(
      (tag) =>
        !tag ||
        typeof tag.id !== "string" ||
        typeof tag.name !== "string" ||
        !tag.id ||
        !tag.name ||
        tag.name.length > 100,
    )
  )
    return Response.json({ error: "タグ推定の入力が不正です" }, { status: 400 });
  if (input.tags.length === 0) return Response.json({ scores: {} });

  const questions = Object.fromEntries(
    input.tags.map((tag: { id: string; name: string }, index: number) => [
      `tag_${index}`,
      { type: "noul", instructions: `このメモの内容は「${tag.name}」というタグに該当しますか？` },
    ]),
  );
  const response = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.TYPESAFE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "jev-latest",
      state: { title: input.title, body: input.body },
      questions,
    }),
  }).catch(() => null);
  if (!response) return Response.json({ error: "Jev に接続できません" }, { status: 502 });
  if (!response.ok)
    return Response.json({ error: "Jev によるタグ推定に失敗しました" }, { status: 502 });
  const result = (await response.json().catch(() => null)) as {
    answers?: Record<string, { type?: string; noul?: number }>;
  } | null;
  const scores: Record<string, number> = {};
  for (const [index, tag] of input.tags.entries()) {
    const answer = result?.answers?.[`tag_${index}`];
    if (
      answer?.type !== "noul" ||
      typeof answer.noul !== "number" ||
      !Number.isFinite(answer.noul) ||
      answer.noul < 0 ||
      answer.noul > 1
    )
      return Response.json({ error: "Jev の応答が不正です" }, { status: 502 });
    scores[tag.id] = answer.noul;
  }
  return Response.json({ scores }, { headers: { "Cache-Control": "no-store" } });
}

export default {
  async fetch(request: Request, env: Env) {
    const path = new URL(request.url).pathname;
    if (path === "/infer-tags") return inferTags(request, env);
    if (path.startsWith("/api/")) return env.LOGOS.fetch(request);
    if (
      request.method === "GET" &&
      (path === "/tagmemo" || path === "/tagmemo/" || path === "/tagmemo/index.html")
    ) {
      return Response.redirect(new URL("/", request.url), 302);
    }
    if (request.method !== "GET" || (path !== "/" && path !== "/index.html")) {
      return env.ASSETS.fetch(request);
    }
    const asset = await env.ASSETS.fetch(new Request(new URL("/tagmemo/index.html", request.url)));
    if (!asset.ok) return asset;
    const fetcher: typeof fetch = (path, init) => {
      const headers = new Headers(request.headers);
      for (const [key, value] of new Headers(init?.headers)) headers.set(key, value);
      return env.LOGOS.fetch(new Request(new URL(String(path), request.url), { ...init, headers }));
    };
    const sessionResponse = await fetcher("/api/auth/get-session");
    if (!sessionResponse.ok) return sessionResponse;
    const session = (await sessionResponse.json()) as { user: { id: string } } | null;
    if (!session) return asset;
    await registerComponentTypes(fetcher);
    const data = await loadInitialData(fetcher, session.user);
    const headers = new Headers(asset.headers);
    headers.set("Cache-Control", "private, no-store");
    headers.append("Vary", "Cookie");
    headers.delete("Content-Length");
    headers.delete("ETag");
    return new Response(renderInitialHtml(await asset.text(), data), {
      status: asset.status,
      headers,
    });
  },
};
