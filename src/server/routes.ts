// REST ハンドラ。Engine を共有バックエンドとして CLI と Web UI の両方に提供する。
// ADR-0002: Component型ベースのフィルタ（?has=Type）を採用。

import type { Engine } from "../core/engine.ts";
import type { Entity } from "../core/types.ts";

function serializeEntity(engine: Engine, e: Entity) {
  return {
    id: e.id,
    status: e.status,
    components: [...e.components.values()].map((c) => ({
      type: c.type,
      service: engine.getSchema(c.type)?.service ?? null,
      fields: c.fields,
    })),
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function handleApi(engine: Engine, req: Request, url: URL): Promise<Response> {
  const path = url.pathname.replace(/^\/api/, "");
  const method = req.method;

  // GET /entities  (?has=Type)
  if (method === "GET" && path === "/entities") {
    const has = url.searchParams.get("has") ?? undefined;
    return json(engine.store.query(has).map((e) => serializeEntity(engine, e)));
  }

  // GET /entities/:id
  const entMatch = path.match(/^\/entities\/([^/]+)$/);
  if (method === "GET" && entMatch) {
    const e = engine.store.getEntity(entMatch[1]!);
    if (!e) return json({ error: "not found" }, 404);
    return json(serializeEntity(engine, e));
  }

  // POST /components  { type, fields }
  if (method === "POST" && path === "/components") {
    const body = (await req.json()) as { type: string; fields: Record<string, unknown> };
    const e = engine.createComponent(body.type, body.fields);
    return json(serializeEntity(engine, e), 201);
  }

  // POST /merge  { a, b }
  if (method === "POST" && path === "/merge") {
    const body = (await req.json()) as { a: string; b: string };
    const result = engine.merge(body.a, body.b);
    if (!result.ok) return json({ error: "merge conflict", conflictType: result.conflictType }, 409);
    return json(serializeEntity(engine, result.entity));
  }

  // PATCH /components/:entityId/:type  { ...fields }
  const patchMatch = path.match(/^\/components\/([^/]+)\/([^/]+)$/);
  if (method === "PATCH" && patchMatch) {
    const body = (await req.json()) as Record<string, unknown>;
    engine.editComponent(patchMatch[1]!, patchMatch[2]!, body);
    const e = engine.store.getEntity(patchMatch[1]!);
    return json(e ? serializeEntity(engine, e) : { ok: true });
  }

  // POST /mock/edit  { service, externalId, fields }  または  { edits: [...] }
  if (method === "POST" && path === "/mock/edit") {
    const body = (await req.json()) as
      | { service: string; externalId: string; fields: Record<string, unknown> }
      | { edits: { service: string; externalId: string; fields: Record<string, unknown> }[] };
    const edits = "edits" in body ? body.edits : [body];
    engine.ingestExternalBatch(edits);
    return json({ ok: true });
  }

  // GET /conflicts
  if (method === "GET" && path === "/conflicts") {
    return json(engine.listConflicts());
  }

  // POST /conflicts/:id/resolve  { winnerType }
  const resMatch = path.match(/^\/conflicts\/([^/]+)\/resolve$/);
  if (method === "POST" && resMatch) {
    const body = (await req.json()) as { winnerType: string };
    engine.resolveConflict(resMatch[1]!, body.winnerType);
    return json({ ok: true });
  }

  // GET /log
  if (method === "GET" && path === "/log") {
    return json(engine.recentLogs(Number(url.searchParams.get("n") ?? 50)));
  }

  return json({ error: "no route" }, 404);
}
