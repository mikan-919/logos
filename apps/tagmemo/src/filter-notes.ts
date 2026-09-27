export function filterNotes(notes, view, selectedTag, search, sort) {
  const now = Date.now();
  const query = search.trim().toLocaleLowerCase();
  const result = notes.filter((note) => {
    if (view === "recent" && note.updatedAt && now - Date.parse(note.updatedAt) > 7 * 86400000)
      return false;
    if (view === "untagged" && note.tagIds.length) return false;
    if (view === "tag" && !note.tagIds.includes(selectedTag)) return false;
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
