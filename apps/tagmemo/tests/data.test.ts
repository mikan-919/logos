import { expect, test, vi } from "vite-plus/test";
import {
  createTag,
  deleteMemo,
  loadData,
  mergeOrDeleteTag,
  saveMemo,
  writeMemoBody,
} from "../src/data.ts";
import { registerComponentTypes } from "../src/register-types.ts";
import { setup } from "../../logos/tests/helpers.ts";

async function withApi(run: () => Promise<void>) {
  const { db, app, cookie, origin } = await setup();
  vi.stubGlobal("fetch", (path: string, options: RequestInit = {}) =>
    app.request(`${origin}${path}`, {
      ...options,
      headers: { ...Object.fromEntries(new Headers(options.headers)), Cookie: cookie },
    }),
  );
  try {
    await registerComponentTypes(fetch);
    await run();
  } finally {
    vi.unstubAllGlobals();
    await db.destroy();
  }
}

async function legacyMemo(
  attached: string[],
  states?: { id: string; state: "on" | "off" | "auto"; score: number }[],
) {
  for (const key of ["tagmemo.tags", "tagmemo.tag-states"]) {
    const response = await fetch("/api/component-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, ownerApp: "tagmemo", schema: { type: "object" } }),
    });
    expect(response.status).toBe(201);
  }
  const id = await saveMemo(null, "旧メモ", "旧本文", []);
  const removed = await fetch(`/api/entities/${id}/components/tagmemo.tag-scores?revision=1`, {
    method: "DELETE",
  });
  expect(removed.status).toBe(204);
  const parts = [
    { typeKey: "tagmemo.tags", value: { entities: attached } },
    ...(states
      ? [
          {
            typeKey: "tagmemo.tag-states",
            value: { entities: states.map((tag) => tag.id), states },
          },
        ]
      : []),
  ];
  for (const part of parts) {
    const response = await fetch(`/api/entities/${id}/components`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(part),
    });
    expect(response.status).toBe(201);
  }
  return id;
}

function probabilityMap(scores: { id: string; score: number }[]) {
  return Object.fromEntries(scores.map((tag) => [tag.id, tag.score]));
}

test("高確率・境界・低確率・0を確率表としてAPIに保存し、表示判断を導出する", async () => {
  await withApi(async () => {
    const high = await createTag("高確率");
    const boundary = await createTag("50%");
    const low = await createTag("低確率");
    const zero = await createTag("0%");
    const scores = [
      { id: high, score: 0.9 },
      { id: boundary, score: 0.5 },
      { id: low, score: 0.49 },
      { id: zero, score: 0 },
    ];
    const id = await saveMemo(null, "分類", "本文", scores);
    const note = (await loadData()).notes.find((item) => item.id === id)!;
    expect(probabilityMap(note.tagScores)).toEqual(probabilityMap(scores));
    expect(note.tagLabels.map((tag) => tag.id).sort()).toEqual([high, boundary].sort());
    const entity = await (await fetch(`/api/entities/${id}`)).json();
    expect(entity.components.map((item: { type_key: string }) => item.type_key).sort()).toEqual([
      "logos.name",
      "tagmemo.memo",
      "tagmemo.tag-scores",
    ]);
    const saved = entity.components.find(
      (item: { type_key: string }) => item.type_key === "tagmemo.tag-scores",
    );
    expect(saved.value.entities.sort()).toEqual([high, boundary, low, zero].sort());
    expect(probabilityMap(saved.value.scores)).toEqual(probabilityMap(scores));
    await deleteMemo(id);
    expect((await loadData()).notes).toEqual([]);
  });
});

test("新規・更新の保存は全現在タグを含み、省略は0にして削除済みIDを除く", async () => {
  await withApi(async () => {
    const a = await createTag("A");
    const b = await createTag("B");
    const id = await saveMemo(null, "空の分類", "本文", []);
    const first = (await loadData()).notes.find((note) => note.id === id)!;
    expect(probabilityMap(first.tagScores)).toEqual({ [a]: 0, [b]: 0 });
    const c = await createTag("後から追加");
    await saveMemo(first, "更新", "本文", [
      { id: a, score: 1 },
      { id: b, score: 0 },
      { id: crypto.randomUUID(), score: 1 },
    ]);
    const next = (await loadData()).notes.find((note) => note.id === id)!;
    expect(probabilityMap(next.tagScores)).toEqual({ [a]: 1, [b]: 0, [c]: 0 });
    await saveMemo(next, "再更新", "本文", [{ id: b, score: 0.8 }]);
    expect(probabilityMap((await loadData()).notes[0].tagScores)).toEqual({
      [a]: 0,
      [b]: 0.8,
      [c]: 0,
    });
  });
});

test("編集した本文を表示用の文章とHTMLに分けて取得できる", async () => {
  await withApi(async () => {
    const html = '<p>前半<span class="summary-node">要約</span>後半</p>';
    await saveMemo(null, "本文", writeMemoBody("前半と後半", html), []);
    expect((await loadData()).notes[0]).toMatchObject({ body: "前半と後半", bodyHtml: html });
  });
});

test("前回推定した文章は保存後も残り、本文や手動確率の変更では基準を書き換えない", async () => {
  await withApi(async () => {
    const tag = await createTag("研究");
    const id = await saveMemo(null, "題名", "本文", [{ id: tag, score: 0 }]);
    let note = (await loadData()).notes.find((item) => item.id === id)!;
    expect(note.inferredText).toBeUndefined();
    const baseline = "題名\n本文";
    await saveMemo(note, "題名", "本文", [{ id: tag, score: 0.8 }], baseline);
    note = (await loadData()).notes.find((item) => item.id === id)!;
    expect(note.inferredText).toBe(baseline);
    await saveMemo(note, "題名", "本文を編集", [{ id: tag, score: 1 }]);
    note = (await loadData()).notes.find((item) => item.id === id)!;
    expect(note).toMatchObject({
      body: "本文を編集",
      inferredText: baseline,
      tagScores: [{ id: tag, score: 1 }],
    });
    const nextBaseline = "題名\n本文を編集";
    await saveMemo(note, "題名", note.body, [{ id: tag, score: 0.6 }], nextBaseline);
    expect((await loadData()).notes.find((item) => item.id === id)?.inferredText).toBe(
      nextBaseline,
    );
  });
});

test("旧オンは1・オフは0・自動は確率に変換し、読込では変更せず保存時に旧Componentを削除する", async () => {
  await withApi(async () => {
    const on = await createTag("手動オン");
    const off = await createTag("手動オフ");
    const low = await createTag("旧自動低確率");
    const boundary = await createTag("旧自動50%");
    const missing = await createTag("未記録");
    const id = await legacyMemo(
      [on, off, boundary],
      [
        { id: on, state: "on", score: 0.2 },
        { id: off, state: "off", score: 0.9 },
        { id: low, state: "auto", score: 0.49 },
        { id: boundary, state: "auto", score: 0.5 },
      ],
    );
    const before = await (await fetch(`/api/entities/${id}`)).json();
    const loaded = await loadData();
    const note = loaded.notes[0];
    expect(probabilityMap(note.tagScores)).toEqual({
      [on]: 1,
      [off]: 0,
      [low]: 0.49,
      [boundary]: 0.5,
      [missing]: 0,
    });
    expect(note.tagLabels.map((tag) => tag.id).sort()).toEqual([on, boundary].sort());
    expect(await (await fetch(`/api/entities/${id}`)).json()).toEqual(before);
    await saveMemo(note, note.title, note.body, note.tagScores);
    const after = await (await fetch(`/api/entities/${id}`)).json();
    expect(after.components.map((item: { type_key: string }) => item.type_key).sort()).toEqual([
      "logos.name",
      "tagmemo.memo",
      "tagmemo.tag-scores",
    ]);
    const migrated = (await loadData()).notes[0];
    expect(migrated.title).toBe("旧メモ");
    expect(migrated.body).toBe("旧本文");
    expect(probabilityMap(migrated.tagScores)).toEqual(probabilityMap(note.tagScores));
    await saveMemo(migrated, migrated.title, migrated.body, migrated.tagScores);
    expect(probabilityMap((await loadData()).notes[0].tagScores)).toEqual(
      probabilityMap(note.tagScores),
    );
  });
});

test("旧付与ID一覧も1として移行し、未付与タグは0にする", async () => {
  await withApi(async () => {
    const attached = await createTag("旧タグ");
    const missing = await createTag("未付与");
    await legacyMemo([attached]);
    const note = (await loadData()).notes[0];
    expect(probabilityMap(note.tagScores)).toEqual({ [attached]: 1, [missing]: 0 });
    await saveMemo(note, note.title, note.body, note.tagScores);
    expect(probabilityMap((await loadData()).notes[0].tagScores)).toEqual({
      [attached]: 1,
      [missing]: 0,
    });
  });
});

test("新しい確率表がある場合は残存する旧手動状態を真実として扱わない", async () => {
  await withApi(async () => {
    const tag = await createTag("移行途中");
    const id = await legacyMemo([tag], [{ id: tag, state: "on", score: 1 }]);
    const response = await fetch(`/api/entities/${id}/components`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        typeKey: "tagmemo.tag-scores",
        value: { entities: [tag], scores: [{ id: tag, score: 0 }] },
      }),
    });
    expect(response.status).toBe(201);
    const note = (await loadData()).notes[0];
    expect(note.tagScores).toEqual([{ id: tag, score: 0 }]);
    expect(note.tagLabels).toEqual([]);
    await saveMemo(note, note.title, note.body, note.tagScores);
    expect((await loadData()).notes[0].tagScores).toEqual([{ id: tag, score: 0 }]);
  });
});

test("タグ統合は低確率を含む最大確率を保ち、全メモから元タグを除いて削除できる", async () => {
  await withApi(async () => {
    const source = await createTag("元タグ");
    const target = await createTag("統合先");
    const other = await createTag("別タグ");
    const a = await saveMemo(null, "元が高い", writeMemoBody("本文", "<p>本文</p>"), [
      { id: source, score: 0.49 },
      { id: target, score: 0.2 },
      { id: other, score: 0.1 },
    ]);
    const b = await saveMemo(null, "先が高い", "本文", [
      { id: source, score: 0.4 },
      { id: target, score: 0.8 },
    ]);
    const c = await legacyMemo(
      [source],
      [
        { id: source, state: "off", score: 0.9 },
        { id: target, state: "auto", score: 0 },
      ],
    );
    await mergeOrDeleteTag((await loadData()).notes, source, target);
    const merged = await loadData();
    expect(merged.tags.map((tag) => tag.id).sort()).toEqual([target, other].sort());
    expect(probabilityMap(merged.notes.find((note) => note.id === a)!.tagScores)).toEqual({
      [target]: 0.49,
      [other]: 0.1,
    });
    expect(merged.notes.find((note) => note.id === a)!.bodyHtml).toBe("<p>本文</p>");
    expect(probabilityMap(merged.notes.find((note) => note.id === b)!.tagScores)).toEqual({
      [target]: 0.8,
      [other]: 0,
    });
    expect(probabilityMap(merged.notes.find((note) => note.id === c)!.tagScores)).toEqual({
      [target]: 0,
      [other]: 0,
    });
    expect((await fetch(`/api/entities/${source}`)).status).toBe(404);
    await mergeOrDeleteTag(merged.notes, target, null);
    const deleted = await loadData();
    expect(
      deleted.notes.every((note) => probabilityMap(note.tagScores)[target] === undefined),
    ).toBe(true);
    expect(probabilityMap(deleted.notes.find((note) => note.id === a)!.tagScores)).toEqual({
      [other]: 0.1,
    });
    expect((await fetch(`/api/entities/${target}`)).status).toBe(404);
  });
});
