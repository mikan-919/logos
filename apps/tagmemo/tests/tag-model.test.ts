import { expect, test } from "vite-plus/test";
import {
  isDisplayedTag,
  relatedOrder,
  shouldInferTags,
  tagCandidates,
  updateTagScores,
} from "../src/tag-model.ts";

test("全タグの候補は確率に関係なく名前順で、欠けた確率は0になる", () => {
  const tags = [
    { id: "c", name: "C" },
    { id: "a", name: "A" },
    { id: "b", name: "B" },
  ];
  expect(
    tagCandidates(
      {
        tagScores: [
          { id: "c", score: 1 },
          { id: "a", score: 0.49 },
          { id: "deleted", score: 1 },
        ],
      },
      tags,
    ),
  ).toEqual([
    { id: "a", name: "A", score: 0.49 },
    { id: "b", name: "B", score: 0 },
    { id: "c", name: "C", score: 1 },
  ]);
});

test("50%以上だけを表示し、Jevの次の確率で付与判断が変わる", () => {
  const tags = [{ id: "low" }, { id: "boundary" }, { id: "high" }];
  const first = updateTagScores([], tags, { low: 0.4999, boundary: 0.5, high: 0.8 });
  expect(first.filter(isDisplayedTag).map((tag) => tag.id)).toEqual(["boundary", "high"]);
  const next = updateTagScores(first, tags, { low: 0.6, boundary: 0.49, high: 0.2 });
  expect(next.filter(isDisplayedTag).map((tag) => tag.id)).toEqual(["low"]);
});

test("上書き・保存済み・0の順に完全な確率表を作り、削除タグを除く", () => {
  const tags = [{ id: "on" }, { id: "off" }, { id: "saved" }, { id: "new" }];
  expect(
    updateTagScores(
      [
        { id: "on", score: 1 },
        { id: "off", score: 0 },
        { id: "saved", score: 0.3 },
        { id: "deleted", score: 1 },
      ],
      tags,
      { on: 0, off: 0.7 },
    ),
  ).toEqual([
    { id: "on", score: 0 },
    { id: "off", score: 0.7 },
    { id: "saved", score: 0.3 },
    { id: "new", score: 0 },
  ]);
});

test("関連順には表示境界未満の確率も使う", () => {
  const notes = [
    { id: "center", title: "", body: "", tagScores: [{ id: "a", score: 0.49 }] },
    { id: "unrelated", title: "", body: "", tagScores: [{ id: "a", score: 0 }] },
    { id: "related", title: "", body: "", tagScores: [{ id: "a", score: 0.4 }] },
  ];
  expect(relatedOrder(notes, "center").map((note) => note.id)).toEqual([
    "center",
    "related",
    "unrelated",
  ]);
});

test("未推定の文章は初回推定し、空の内容と同じ文章は推定しない", () => {
  expect(shouldInferTags(undefined, "本文")).toBe(true);
  expect(shouldInferTags(undefined, " \n ")).toBe(false);
  expect(shouldInferTags("本文", "本文")).toBe(false);
});

test("再推定は文字編集距離が長い方の文章の50%以上になった境界で行う", () => {
  expect(shouldInferTags("abcdef", "abcdeX")).toBe(false);
  expect(shouldInferTags("abcdef", "abcXYZ")).toBe(true);
  expect(shouldInferTags("abcd", "abcdxyz")).toBe(false);
  expect(shouldInferTags("abcd", "abcdwxyz")).toBe(true);
  expect(shouldInferTags("abcdwxyz", "abcd")).toBe(true);
  expect(shouldInferTags("😀😀😀😀", "😀😀😀😃")).toBe(false);
  expect(shouldInferTags("😀😀😀😀", "😀😀😃😃")).toBe(true);
});
