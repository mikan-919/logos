import { isDisplayedTag, tagCandidates, updateTagScores } from "./tag-model.ts";

export function keepEditedNote(notes, selectedId, edited, scores, tags) {
  if (!edited || !selectedId) return notes;
  const tagScores = updateTagScores(scores, tags);
  const tagLabels = tagCandidates({ tagScores }, tags)
    .filter(isDisplayedTag)
    .map((tag) => ({ id: tag.id, name: tag.name }));
  return notes.map((note) =>
    note.id === selectedId
      ? {
          ...note,
          title: edited.title || "無題",
          body: edited.text,
          bodyHtml: edited.html,
          tagScores,
          tagLabels,
        }
      : note,
  );
}

export function emptyDraft(tags) {
  return {
    id: "",
    title: "",
    body: "",
    bodyHtml: "",
    tagScores: updateTagScores([], tags),
    tagLabels: [],
    components: [],
    pending: true,
  };
}
