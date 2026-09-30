import type { TagScore } from "./data.ts";

type Tag = { id: string; name: string };
type Note = {
  id: string;
  title: string;
  body: string;
  createdAt?: string;
  tagScores: TagScore[];
};

export function isDisplayedTag(tag: TagScore) {
  return tag.score >= 0.5;
}

export function updateTagScores(
  current: TagScore[],
  tags: { id: string; name?: string }[],
  scores: Record<string, number> = {},
): TagScore[] {
  const byId = new Map(current.map((tag) => [tag.id, tag]));
  let changed = current.length !== tags.length;
  const next = tags.map((tag) => {
    const existing = byId.get(tag.id);
    const score = scores[tag.id] ?? existing?.score ?? 0;
    if (existing && existing.score === score) return existing;
    changed = true;
    return { id: tag.id, score };
  });
  return changed ? next : current;
}

export function tagCandidates(note: Pick<Note, "tagScores">, tags: Tag[]) {
  const scores = new Map(note.tagScores.map((entry) => [entry.id, entry.score]));
  return tags
    .map((tag) => ({ ...tag, score: scores.get(tag.id) ?? 0 }))
    .sort((a, b) => a.name.localeCompare(b.name, "ja") || a.id.localeCompare(b.id));
}

export function shouldInferTags(before: string | undefined, after: string): boolean {
  if (!after.trim()) return false;
  if (before === undefined) return true;
  if (before === after) return false;
  const a = Array.from(before);
  const b = Array.from(after);
  const limit = Math.ceil(Math.max(a.length, b.length) / 2);
  if (limit === 0) return false;
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let end = 0;
  while (
    end < a.length - start &&
    end < b.length - start &&
    a[a.length - end - 1] === b[b.length - end - 1]
  )
    end++;
  const n = a.length - start - end;
  const m = b.length - start - end;
  if (Math.abs(n - m) >= limit) return true;
  // ponytail: exact bounded Levenshtein is quadratic for large rewrites; move to a worker if needed.
  let previous = new Uint32Array(m + 1).fill(limit);
  let row = new Uint32Array(m + 1).fill(limit);
  for (let j = 0; j <= Math.min(m, limit - 1); j++) previous[j] = j;
  for (let i = 1; i <= n; i++) {
    row[0] = Math.min(i, limit);
    const left = Math.max(1, i - limit + 1);
    const right = Math.min(m, i + limit - 1);
    if (left > 1) row[left - 1] = limit;
    if (right < m) row[right + 1] = limit;
    for (let j = left; j <= right; j++) {
      row[j] = Math.min(
        previous[j] + 1,
        row[j - 1] + 1,
        previous[j - 1] + (a[start + i - 1] === b[start + j - 1] ? 0 : 1),
      );
    }
    const swap = previous;
    previous = row;
    row = swap;
  }
  return previous[m] >= limit;
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
  for (const tag of a.tagScores) {
    const other = b.tagScores.find((item) => item.id === tag.id);
    if (other) score += 4 * Math.min(tag.score, other.score);
  }
  const aWords = words(`${a.title} ${a.body}`);
  const bWords = words(`${b.title} ${b.body}`);
  for (const word of aWords) if (bWords.has(word)) score += word.length > 5 ? 1.5 : 1;
  return score;
}
