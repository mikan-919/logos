import type { TagState } from "./data.ts";

type Tag = { id: string; name: string };
type Note = {
  id: string;
  title: string;
  body: string;
  createdAt?: string;
  tagStates: TagState[];
};

const rules: [string, string[]][] = [
  ["programming", ["code", "runtime", "compiler", "api", "実装"]],
  ["ui", ["ui", "画面", "デザイン", "wysiwyg"]],
  ["llm", ["llm", "model", "モデル", "jev", "ai"]],
  ["research", ["研究", "論文", "調べ"]],
  ["idea", ["アイデア", "idea", "構想"]],
  ["tagmemo", ["tagmemo", "タグ"]],
  ["compiler", ["compiler", "コンパイラ", "静的解析"]],
  ["navigation", ["navigation", "関連", "スクロール", "移動"]],
];

export function tagCandidates(note: Note, tags: Tag[]) {
  const text = `${note.title} ${note.body}`.toLocaleLowerCase();
  const values = new Map(note.tagStates.map((entry) => [entry.id, { ...entry }]));
  for (const tag of tags) {
    const rule = rules.find(([name]) => name === tag.name.toLocaleLowerCase());
    const inferred = rule
      ? Math.min(
          0.96,
          0.26 + rule[1].reduce((sum, word) => sum + (text.includes(word) ? 0.22 : 0), 0),
        )
      : 0.28;
    const existing = values.get(tag.id);
    if (existing?.state === "auto") existing.score = Math.max(existing.score, inferred);
    else if (!existing && inferred >= 0.28)
      values.set(tag.id, { id: tag.id, state: "auto", score: inferred });
  }
  const rank = { on: 0, auto: 1, off: 2 };
  return [...values.values()]
    .map((entry) => ({ ...entry, name: tags.find((tag) => tag.id === entry.id)?.name ?? "" }))
    .filter((entry) => entry.name)
    .sort(
      (a, b) =>
        rank[a.state] - rank[b.state] || b.score - a.score || a.name.localeCompare(b.name, "ja"),
    );
}

function words(text: string) {
  return new Set(
    text.toLocaleLowerCase().match(/[a-z0-9_+-]{3,}|[\u3040-\u30ff\u3400-\u9fff]{2,}/g) ?? [],
  );
}

export function relatedOrder<T extends Note>(notes: T[], centerId: string): T[] {
  if (!centerId) return [...notes];
  const center = notes.find((note) => note.id === centerId);
  if (!center) return [...notes];
  const remaining = notes.filter((note) => note.id !== centerId);
  const order = [center];
  let current = center;
  while (remaining.length) {
    const index = remaining
      .map((candidate, i) => ({ i, score: relevance(current, candidate) }))
      .sort((a, b) => b.score - a.score || a.i - b.i)[0].i;
    current = remaining.splice(index, 1)[0];
    order.push(current);
  }
  return order;
}

function relevance(a: Note, b: Note) {
  let score = 0;
  for (const tag of a.tagStates) {
    if (tag.state === "off") continue;
    const other = b.tagStates.find((item) => item.id === tag.id && item.state !== "off");
    if (other)
      score +=
        4 * Math.min(tag.state === "on" ? 1 : tag.score, other.state === "on" ? 1 : other.score);
  }
  const aWords = words(`${a.title} ${a.body}`);
  const bWords = words(`${b.title} ${b.body}`);
  for (const word of aWords) if (bWords.has(word)) score += word.length > 5 ? 1.5 : 1;
  return score;
}
