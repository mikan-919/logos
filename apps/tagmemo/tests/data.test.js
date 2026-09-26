import { PGlite } from "@electric-sql/pglite";
import { expect, test, vi } from "vite-plus/test";
import { Kysely, PGliteDialect } from "kysely";
import { up } from "../../../packages/db/src/migrations/20260926_initial.ts";
import { createTagmemoApp } from "../src/app.ts";
import { createTag, deleteMemo, loadData, saveMemo } from "../src/data.js";

test("タグを付けたメモを API 経由で保存・取得・削除できる", async () => {
  const db = new Kysely({ dialect: new PGliteDialect({ pglite: new PGlite() }) });
  await up(db);
  const app = createTagmemoApp(db, "00000000-0000-4000-8000-000000000001");
  vi.stubGlobal("fetch", (path, options) => app.request(path, options));
  try {
    await loadData();
    const tagId = await createTag("研究");
    const memoId = await saveMemo(null, "設計メモ", "本文", [tagId]);
    const loaded = await loadData();
    expect(loaded.tags).toEqual([{ id: tagId, name: "研究" }]);
    expect(loaded.notes[0]).toMatchObject({
      id: memoId,
      title: "設計メモ",
      body: "本文",
      tagIds: [tagId],
    });
    await deleteMemo(memoId);
    expect((await loadData()).notes).toEqual([]);
  } finally {
    vi.unstubAllGlobals();
    await db.destroy();
  }
});
