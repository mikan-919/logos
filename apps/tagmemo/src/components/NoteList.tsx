import { render } from "irisout";

export function NoteList({ notes, title, selectedId, sort, onSort, onSelect, visible }) {
  render(
    <aside class={visible() ? "spa-listpane open" : "spa-listpane"} aria-label="メモ一覧">
      <div class="spa-listhead">
        <h2>{title()}</h2>
        <p>{notes().length} 件のメモ</p>
      </div>
      <div class="spa-listfilters" aria-label="並び順">
        <button
          class={sort() === "updated" ? "active" : ""}
          type="button"
          onClick={() => {
            onSort("updated");
          }}
        >
          更新順
        </button>
        <button
          class={sort() === "created" ? "active" : ""}
          type="button"
          onClick={() => {
            onSort("created");
          }}
        >
          作成順
        </button>
        <button
          class={sort() === "title" ? "active" : ""}
          type="button"
          onClick={() => {
            onSort("title");
          }}
        >
          名前順
        </button>
      </div>
      <div class="spa-notes">
        {notes().length === 0 && <p class="spa-list-empty">該当するメモはありません</p>}
        {notes().map((note) => (
          <button
            key={note.id}
            type="button"
            class={selectedId() === note.id ? "spa-note active" : "spa-note"}
            onClick={() => {
              onSelect(note.id);
            }}
          >
            <strong>{note.title || "無題"}</strong>
            <span class="spa-note-snippet">{note.body}</span>
            <span class="spa-note-meta">
              <span>
                {note.tagLabels.map((tag) => (
                  <small key={tag.id}>#{tag.name}</small>
                ))}
              </span>
              <time>
                {note.updatedAt
                  ? new Date(note.updatedAt).toLocaleDateString("ja-JP", {
                      month: "numeric",
                      day: "numeric",
                    })
                  : ""}
              </time>
            </span>
          </button>
        ))}
      </div>
    </aside>,
  );
}
