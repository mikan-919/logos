import { isDisplayedTag } from "./tag-model.ts";
import type { TagScore } from "./data.ts";

type FilterNote = {
  title: string;
  body: string;
  tagScores: TagScore[];
  tagLabels: { name: string }[];
  createdAt?: string;
  updatedAt?: string;
};

export function filterNotes<T extends FilterNote>(
  notes: T[],
  view: string,
  selectedTag: string,
  search: string,
  sort: string,
) {
  const now = Date.now();
  const query = search.trim().toLocaleLowerCase();
  const result = notes.filter((note) => {
    if (view === "recent" && note.updatedAt && now - Date.parse(note.updatedAt) > 7 * 86400000)
      return false;
    if (view === "untagged" && note.tagScores.some(isDisplayedTag)) return false;
    if (
      view === "tag" &&
      !note.tagScores.some((tag) => tag.id === selectedTag && isDisplayedTag(tag))
    )
      return false;
    return (
      !query ||
      `${note.title} ${note.body} ${note.tagLabels.map((tag) => tag.name).join(" ")}`
        .toLocaleLowerCase()
        .includes(query)
    );
  });
  if (sort === "title") result.sort((a, b) => a.title.localeCompare(b.title, "ja"));
  if (sort === "created")
    result.sort((a, b) => Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? ""));
  if (sort === "updated")
    result.sort((a, b) => Date.parse(b.updatedAt ?? "") - Date.parse(a.updatedAt ?? ""));
  return result;
}
