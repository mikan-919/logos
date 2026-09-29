import { derived, render, signal } from "irisout";
import { createTag, loadData, mergeOrDeleteTag, renameTag } from "../data.ts";
import { filterNotes } from "../filter-notes.ts";
import { StreamLibrary } from "./StreamLibrary.tsx";

export function LibraryPanel({
  open,
  mode,
  notes,
  tags,
  activeId,
  busy,
  status,
  onClose,
  onSelect,
  onApplyData,
  onFail,
}) {
  const filter = signal("all");
  const selectedTag = signal("");
  const sort = signal("updated");
  const query = signal("");
  const visibleNotes = derived(() =>
    filterNotes(notes(), filter(), selectedTag(), query(), sort()),
  );

  render(
    <StreamLibrary
      open={open}
      mode={mode}
      filter={filter}
      selectedTag={selectedTag}
      sort={sort}
      query={query}
      notes={visibleNotes}
      allNotes={notes}
      tags={tags}
      activeId={activeId}
      onClose={onClose}
      onMode={mode}
      onFilter={(value) => {
        filter(value);
        selectedTag("");
      }}
      onTagFilter={(id) => {
        selectedTag(id);
        filter("tag");
      }}
      onSort={sort}
      onQuery={query}
      onSelect={onSelect}
      onCreateTag={addTag}
      onRenameTag={renameExistingTag}
      onMergeTag={mergeTag}
      onDeleteTag={deleteTag}
    />,
  );

  function addTag() {
    const name = prompt("新しいタグ名")?.trim().replace(/^#/, "");
    if (!name || tags().some((tag) => tag.name.toLocaleLowerCase() === name.toLocaleLowerCase()))
      return;
    busy(true);
    createTag(name)
      .then(() => loadData())
      .then(onApplyData)
      .catch(onFail)
      .finally(() => busy(false));
  }

  function renameExistingTag(tag) {
    const name = prompt("タグを改名", tag.name)?.trim().replace(/^#/, "");
    if (
      !name ||
      name === tag.name ||
      tags().some((other) => other.id !== tag.id && other.name === name)
    )
      return;
    busy(true);
    renameTag(tag.id, name)
      .then(() => loadData())
      .then(onApplyData)
      .catch(onFail)
      .finally(() => busy(false));
  }

  function mergeTag(tag) {
    const name = prompt(`#${tag.name} の統合先タグ名`)?.trim().replace(/^#/, "");
    const target = tags().find((item) => item.name === name && item.id !== tag.id);
    if (!target) status("統合先の既存タグを指定してください");
    else {
      busy(true);
      mergeOrDeleteTag(notes(), tag.id, target.id)
        .then(() => loadData())
        .then(onApplyData)
        .catch(onFail)
        .finally(() => busy(false));
    }
  }

  function deleteTag(tag) {
    if (!confirm(`#${tag.name} を削除しますか？`)) return;
    busy(true);
    mergeOrDeleteTag(notes(), tag.id, null)
      .then(() => loadData())
      .then(onApplyData)
      .catch(onFail)
      .finally(() => busy(false));
  }
}
