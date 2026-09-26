import { PGlite } from "@electric-sql/pglite";
import type { Database } from "@logos/db";
import { expect, test } from "vite-plus/test";
import { Kysely, PGliteDialect } from "kysely";
import { up } from "../../../packages/db/src/migrations/20260926_initial.ts";
import { createTagmemoApp } from "../src/app.ts";

test("TagMemo の API は Entity にメモとタグを保存する", async () => {
  const db = new Kysely<Database>({ dialect: new PGliteDialect({ pglite: new PGlite() }) });
  try {
    await up(db as unknown as Kysely<unknown>);
    const app = createTagmemoApp(db, "00000000-0000-4000-8000-000000000001");
    const request = (path: string, method = "GET", data?: unknown) =>
      app.request(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: data === undefined ? undefined : JSON.stringify(data),
      });
    for (const [key, schema] of [
      [
        "logos.name",
        { type: "object", properties: { value: { type: "string" } }, required: ["value"] },
      ],
      [
        "tagmemo.memo",
        { type: "object", properties: { body: { type: "string" } }, required: ["body"] },
      ],
    ] as const) {
      expect((await request("/api/component-types", "POST", { key, schema })).status).toBe(201);
    }
    const entity = await (await request("/api/entities", "POST")).json();
    expect(
      (
        await request(`/api/entities/${entity.id}/components`, "POST", {
          typeKey: "logos.name",
          value: { value: "設計メモ" },
        })
      ).status,
    ).toBe(201);
    expect(
      (
        await request(`/api/entities/${entity.id}/components`, "POST", {
          typeKey: "tagmemo.memo",
          value: { body: "本文" },
        })
      ).status,
    ).toBe(201);
    expect((await (await request("/api/entities?has=tagmemo.memo")).json()).ids).toEqual([
      entity.id,
    ]);
    const stored = await (await request(`/api/entities/${entity.id}`)).json();
    expect(stored.components.map((item: { type_key: string }) => item.type_key)).toEqual([
      "logos.name",
      "tagmemo.memo",
    ]);
  } finally {
    await db.destroy();
  }
});
