import { expect, test, vi } from "vite-plus/test";
import { createTag, deleteMemo, loadData, saveMemo } from "../src/data.js";
import { setup } from "./helpers.ts";

test("タグを付けたメモを API 経由で保存・取得・削除できる", async () => {
  const { db, app, cookie, origin } = await setup();
  vi.stubGlobal("fetch", (path, options = {}) =>
    app.request(`${origin}${path}`, {
      ...options,
      headers: { ...options.headers, Cookie: cookie },
    }),
  );
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
