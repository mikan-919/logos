export function keepEditedNote(notes, selectedId, edited, states, tags) {
  if (!edited || !selectedId) return notes;
  const tagIds = states.filter((tag) => tag.state !== "off").map((tag) => tag.id);
  const tagLabels = tags
    .filter((tag) => tagIds.includes(tag.id))
    .map((tag) => ({ id: tag.id, name: tag.name }));
  return notes.map((note) =>
    note.id === selectedId
      ? {
          ...note,
          title: edited.title || "無題",
          body: edited.text,
          bodyHtml: edited.html,
          tagStates: states,
          tagIds,
          tagLabels,
        }
      : note,
  );
}

export function emptyDraft() {
  return {
    id: "",
    title: "",
    body: "",
    bodyHtml: "",
    tagIds: [],
    tagStates: [],
    tagLabels: [],
    components: [],
    pending: true,
  };
}
