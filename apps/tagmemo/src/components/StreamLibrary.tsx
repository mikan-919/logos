import { render } from "irisout";
import { Icon } from "./Icon.tsx";

export function StreamLibrary({
  open,
  mode,
  filter,
  selectedTag,
  sort,
  query,
  notes,
  allNotes,
  tags,
  activeId,
  onClose,
  onMode,
  onFilter,
  onTagFilter,
  onSort,
  onQuery,
  onSelect,
  onCreateTag,
  onRenameTag,
  onMergeTag,
  onDeleteTag,
}) {
  render(
    <div
      class="stream-library-overlay"
      data-hidden={!open()}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section class="stream-library" aria-label="ライブラリ">
        <header class="stream-library-head">
          <div class="stream-library-modes">
            <button
              class={mode() === "notes" ? "active" : ""}
              type="button"
              onClick={() => onMode("notes")}
            >
              メモ
            </button>
            <button
              class={mode() === "tags" ? "active" : ""}
              type="button"
              onClick={() => onMode("tags")}
            >
              タグ管理
            </button>
          </div>
          <label class="stream-library-search">
            <Icon name="search" />
            <input
              type="search"
              placeholder="メモとタグを検索"
              value={query()}
              onInput={(event) => onQuery(event.currentTarget.value)}
            />
          </label>
          <button class="stream-library-close" type="button" aria-label="閉じる" onClick={onClose}>
            <Icon name="x" />
          </button>
        </header>
        <div class="stream-library-body" data-hidden={mode() !== "notes"}>
          <aside class="stream-library-sidebar">
            <p>ライブラリ</p>
            <button
              class={filter() === "all" ? "active" : ""}
              type="button"
              onClick={() => onFilter("all")}
            >
              <span>すべてのメモ</span>
              <small>{allNotes().length}</small>
            </button>
            <button
              class={filter() === "recent" ? "active" : ""}
              type="button"
              onClick={() => onFilter("recent")}
            >
              <span>最近</span>
              <small>7日</small>
            </button>
            <button
              class={filter() === "untagged" ? "active" : ""}
              type="button"
              onClick={() => onFilter("untagged")}
            >
              <span>タグなし</span>
              <small>{allNotes().filter((note) => note.tagIds.length === 0).length}</small>
            </button>
            <p>タグ</p>
            {tags().map((tag) => (
              <button
                key={tag.id}
                class={filter() === "tag" && selectedTag() === tag.id ? "active" : ""}
                type="button"
                onClick={() => onTagFilter(tag.id)}
              >
                <span>#{tag.name}</span>
                <small>{allNotes().filter((note) => note.tagIds.includes(tag.id)).length}</small>
              </button>
            ))}
          </aside>
          <section class="stream-library-results">
            <header>
              <h2>
                {filter() === "tag"
                  ? `#${tags().find((tag) => tag.id === selectedTag())?.name ?? "タグ"}`
                  : ({ all: "すべてのメモ", recent: "最近", untagged: "タグなし" }[filter()] ??
                    "すべてのメモ")}
              </h2>
              <div class="stream-library-sorts">
                <button
                  class={sort() === "updated" ? "active" : ""}
                  type="button"
                  onClick={() => onSort("updated")}
                >
                  更新順
                </button>
                <button
                  class={sort() === "created" ? "active" : ""}
                  type="button"
                  onClick={() => onSort("created")}
                >
                  作成順
                </button>
                <button
                  class={sort() === "title" ? "active" : ""}
                  type="button"
                  onClick={() => onSort("title")}
                >
                  名前順
                </button>
              </div>
            </header>
            <div class="stream-library-grid">
              {notes().map((note) => (
                <button
                  key={note.id}
                  class={
                    activeId() === note.id ? "stream-library-card active" : "stream-library-card"
                  }
                  type="button"
                  onClick={() => onSelect(note.id)}
                >
                  <strong>{note.title || "無題"}</strong>
                  <span>{note.body}</span>
                  <footer>
                    <span>
                      {note.tagLabels.slice(0, 3).map((tag) => (
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
                  </footer>
                </button>
              ))}
              {notes().length === 0 && (
                <p class="stream-library-empty">該当するメモはありません。</p>
              )}
            </div>
          </section>
        </div>
        <section class="stream-tag-admin" data-hidden={mode() !== "tags"}>
          <header>
            <div>
              <h2>タグ</h2>
              <p>作成、改名、統合、削除と使用状況。</p>
            </div>
            <button type="button" onClick={onCreateTag}>
              <Icon name="plus" /> 新しいタグ
            </button>
          </header>
          <div class="stream-tag-stats">
            <div>
              <strong>{tags().length}</strong>
              <span>タグ</span>
            </div>
            <div>
              <strong>{allNotes().reduce((sum, note) => sum + note.tagIds.length, 0)}</strong>
              <span>付与数</span>
            </div>
            <div>
              <strong>
                {allNotes().reduce(
                  (sum, note) =>
                    sum + (note.tagStates?.filter((tag) => tag.state === "on").length ?? 0),
                  0,
                )}
              </strong>
              <span>手動</span>
            </div>
          </div>
          <div class="stream-tag-table">
            {tags().map((tag) => (
              <div key={tag.id} class="stream-tag-table-row">
                <div>
                  <strong>#{tag.name}</strong>
                  <small>
                    {
                      allNotes().filter((note) =>
                        note.tagStates?.some(
                          (entry) => entry.id === tag.id && entry.state === "on",
                        ),
                      ).length
                    }{" "}
                    手動 ·{" "}
                    {
                      allNotes().filter((note) =>
                        note.tagStates?.some(
                          (entry) => entry.id === tag.id && entry.state === "auto",
                        ),
                      ).length
                    }{" "}
                    自動
                  </small>
                </div>
                <div class="stream-tag-usage">
                  <span
                    style={`width:${allNotes().length ? (allNotes().filter((note) => note.tagIds.includes(tag.id)).length / allNotes().length) * 100 : 0}%`}
                  ></span>
                </div>
                <span>{allNotes().filter((note) => note.tagIds.includes(tag.id)).length} 件</span>
                <div class="stream-tag-actions">
                  <button
                    type="button"
                    aria-label={`${tag.name}を改名`}
                    onClick={() => onRenameTag(tag)}
                  >
                    <Icon name="pencil" />
                  </button>
                  <button
                    type="button"
                    aria-label={`${tag.name}を統合`}
                    onClick={() => onMergeTag(tag)}
                  >
                    <Icon name="combine" />
                  </button>
                  <button
                    type="button"
                    aria-label={`${tag.name}を削除`}
                    onClick={() => onDeleteTag(tag)}
                  >
                    <Icon name="x" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>,
  );
}
