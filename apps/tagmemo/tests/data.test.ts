import { expect, test, vi } from "vite-plus/test";
import { createTag, deleteMemo, loadData, saveMemo, writeMemoBody } from "../src/data.ts";
import { registerComponentTypes } from "../src/register-types.ts";
import { setup } from "../../logos/tests/helpers.ts";

test("タグを付けたメモを API 経由で保存・取得・削除できる", async () => {
  const { db, app, cookie, origin } = await setup();
  vi.stubGlobal("fetch", (path: string, options: RequestInit = {}) =>
    app.request(`${origin}${path}`, {
      ...options,
      headers: { ...Object.fromEntries(new Headers(options.headers)), Cookie: cookie },
    }),
  );
  try {
    await registerComponentTypes(fetch);
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

test("編集した本文を表示用の文章と HTML に分けて取得できる", async () => {
  const { db, app, cookie, origin } = await setup();
  vi.stubGlobal("fetch", (path: string, options: RequestInit = {}) =>
    app.request(`${origin}${path}`, {
      ...options,
      headers: { ...Object.fromEntries(new Headers(options.headers)), Cookie: cookie },
    }),
  );
  try {
    await registerComponentTypes(fetch);
    const html = '<p>前半<span class="summary-node">要約</span>後半</p>';
    await saveMemo(null, "本文", writeMemoBody("前半と後半", html), []);
    expect((await loadData()).notes[0]).toMatchObject({ body: "前半と後半", bodyHtml: html });
  } finally {
    vi.unstubAllGlobals();
    await db.destroy();
  }
});

test("タグのオフ・自動・オンと確信度を DB に保存して再取得できる", async () => {
  const { db, app, cookie, origin } = await setup();
  vi.stubGlobal("fetch", (path: string, options: RequestInit = {}) =>
    app.request(`${origin}${path}`, {
      ...options,
      headers: { ...Object.fromEntries(new Headers(options.headers)), Cookie: cookie },
    }),
  );
  try {
    await registerComponentTypes(fetch);
    const on = await createTag("手動");
    const auto = await createTag("自動");
    const low = await createTag("低確率");
    const off = await createTag("除外");
    const states = [
      { id: on, state: "on" as const, score: 1 },
      { id: auto, state: "auto" as const, score: 0.72 },
      { id: low, state: "auto" as const, score: 0.49 },
      { id: off, state: "off" as const, score: 0 },
    ];
    const id = await saveMemo(null, "分類", "本文", [on, auto, low], states);
    const note = (await loadData()).notes.find((item) => item.id === id);
    expect(note?.tagStates).toEqual(states);
    expect(note?.tagIds).toEqual([on, auto]);
    expect(note?.tagLabels).toEqual([
      { id: on, name: "手動" },
      { id: auto, name: "自動" },
    ]);
  } finally {
    vi.unstubAllGlobals();
    await db.destroy();
  }
});

test("旧形式のタグID一覧を手動オンとして読み取れる", async () => {
  const { db, app, cookie, origin } = await setup();
  vi.stubGlobal("fetch", (path: string, options: RequestInit = {}) =>
    app.request(`${origin}${path}`, {
      ...options,
      headers: { ...Object.fromEntries(new Headers(options.headers)), Cookie: cookie },
    }),
  );
  try {
    await registerComponentTypes(fetch);
    const tagId = await createTag("旧タグ");
    const id = await saveMemo(null, "旧メモ", "本文", [tagId]);
    const removed = await fetch(`/api/entities/${id}/components/tagmemo.tag-states?revision=1`, {
      method: "DELETE",
    });
    expect(removed.status).toBe(204);
    expect((await loadData()).notes[0].tagStates).toEqual([{ id: tagId, state: "on", score: 1 }]);
  } finally {
    vi.unstubAllGlobals();
    await db.destroy();
  }
});
