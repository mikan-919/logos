import { expect, test } from "vite-plus/test";
import { filterNotes } from "../src/filter-notes.ts";

test("タグの検索とタグなし判定は全タグ表の存在ではなく50%境界を見る", () => {
  const notes = [
    {
      id: "low",
      title: "低確率",
      body: "",
      tagScores: [
        { id: "a", score: 0.4999 },
        { id: "b", score: 0 },
      ],
      tagLabels: [],
    },
    {
      id: "boundary",
      title: "境界",
      body: "",
      tagScores: [
        { id: "a", score: 0.5 },
        { id: "b", score: 0 },
      ],
      tagLabels: [{ id: "a", name: "A" }],
    },
    {
      id: "high",
      title: "高確率",
      body: "",
      tagScores: [
        { id: "a", score: 0.9 },
        { id: "b", score: 0.2 },
      ],
      tagLabels: [{ id: "a", name: "A" }],
    },
  ];
  expect(filterNotes(notes, "untagged", "", "", "").map((note) => note.id)).toEqual(["low"]);
  expect(filterNotes(notes, "tag", "a", "", "").map((note) => note.id)).toEqual([
    "boundary",
    "high",
  ]);
  expect(filterNotes(notes, "tag", "b", "", "")).toEqual([]);
});
