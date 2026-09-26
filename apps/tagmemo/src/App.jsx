import { derived, onMount, render, signal } from "irisout";
import { createTag, deleteMemo, editableExtras, loadData, saveMemo, updateExtra } from "./data.js";

export function App() {
  const notes = signal([]);
  const tags = signal([]);
  const types = signal([]);
  const selectedTag = signal("");
  const search = signal("");
  const status = signal("");
  const busy = signal(false);
  const newTag = signal("");
  const editingId = signal("");
  const title = signal("");
  const body = signal("");
  const draftTags = signal([]);
  const extraKey = signal("");
  const extraValue = signal({});

  const visibleNotes = derived(() =>
    notes().filter(
      (note) =>
        (!selectedTag() || note.tagIds.includes(selectedTag())) &&
        `${note.title} ${note.body}`.toLocaleLowerCase().includes(search().toLocaleLowerCase()),
    ),
  );
  const currentNote = derived(() => notes().find((note) => note.id === editingId()));
  const extras = derived(() => editableExtras(currentNote(), types()));
  const activeExtra = derived(() => extras().find((item) => item.type_key === extraKey()));
  const booleanFields = derived(
    () => activeExtra()?.fields.filter((field) => field.type === "boolean") ?? [],
  );
  const textFields = derived(
    () => activeExtra()?.fields.filter((field) => field.type !== "boolean") ?? [],
  );
  const viewTitle = derived(
    () => tags().find((tag) => tag.id === selectedTag())?.name ?? "すべてのメモ",
  );

  render(
    <div class="shell">
      <header class="topbar">
        <div class="brand">
          <span class="brand-mark">✳</span>
          <span>TagMemo</span>
        </div>
        <label class="search">
          <span>検索</span>
          <input
            type="search"
            placeholder="メモを検索"
            value={search()}
            onInput={(event) => search(event.currentTarget.value)}
          />
        </label>
        <button class="primary" type="button" onClick={() => openEditor("")}>
          ＋ メモを作成
        </button>
      </header>
      <div class="workspace">
        <aside class="sidebar" aria-label="タグ">
          <p class="eyebrow">ライブラリ</p>
          <button
            class={selectedTag() ? "nav-item" : "nav-item active"}
            type="button"
            onClick={() => selectedTag("")}
          >
            <span>すべてのメモ</span>
            <span>{notes().length}</span>
          </button>
          <div class="sidebar-heading">
            <p class="eyebrow">タグ</p>
            <span>{tags().length}</span>
          </div>
          <div class="tag-list">
            {tags().map((tag) => (
              <button
                key={tag.id}
                class={selectedTag() === tag.id ? "tag-item active" : "tag-item"}
                type="button"
                onClick={() => selectedTag(tag.id)}
              >
                <span class="tag-name">{tag.name}</span>
              </button>
            ))}
          </div>
          <form class="new-tag-form" onSubmit={addTag}>
            <label for="new-tag-name">タグを追加</label>
            <div>
              <input
                id="new-tag-name"
                maxlength="80"
                placeholder="タグ名"
                required
                value={newTag()}
                onInput={(event) => newTag(event.currentTarget.value)}
              />
              <button type="submit" aria-label="タグを追加" disabled={busy()}>
                ＋
              </button>
            </div>
          </form>
        </aside>
        <main class="main">
          <div class="main-heading">
            <div>
              <p class="eyebrow">あなたのノート</p>
              <h1>{viewTitle()}</h1>
            </div>
            <span class="count">
              <span>{visibleNotes().length}</span>
              <span> 件</span>
            </span>
          </div>
          <p class="status" role="status" aria-live="polite">
            {status()}
          </p>
          <div class="memo-list">
            {visibleNotes().length === 0 && (
              <div class="empty">
                <strong>メモがありません</strong>
                <span>メモを作成して、タグで整理できます。</span>
              </div>
            )}
            {visibleNotes().map((note) => (
              <article key={note.id} class="memo-card">
                <h2>{note.title}</h2>
                <p>{note.body}</p>
                <div class="card-footer">
                  <div class="chips">
                    {note.tagLabels.map((tag) => (
                      <span key={tag.id} class="chip">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                  <button type="button" onClick={() => openEditor(note.id)}>
                    編集
                  </button>
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>

      <dialog id="memo-dialog" class="editor-dialog">
        <form class="editor-form" onSubmit={save}>
          <div class="dialog-head">
            <div>
              <p class="eyebrow">TagMemo</p>
              <h2>{editingId() ? "メモを編集" : "メモを作成"}</h2>
            </div>
            <button class="icon-button" type="button" aria-label="閉じる" onClick={closeEditor}>
              ×
            </button>
          </div>
          <label for="memo-title">タイトル</label>
          <input
            id="memo-title"
            maxlength="200"
            required
            placeholder="何について書きますか"
            value={title()}
            onInput={(event) => title(event.currentTarget.value)}
          />
          <label for="memo-body">本文</label>
          <textarea
            id="memo-body"
            rows="10"
            placeholder="メモを書き始める"
            value={body()}
            onInput={(event) => body(event.currentTarget.value)}
          ></textarea>
          <p class="status" role="alert">
            {status()}
          </p>
          <fieldset>
            <legend>タグ</legend>
            <div class="tag-options">
              {tags().map((tag) => (
                <label key={tag.id} class="tag-option">
                  <input
                    type="checkbox"
                    checked={draftTags().includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                  />
                  <span>{tag.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div class="dialog-actions">
            <button class="danger" type="button" hidden={!editingId()} onClick={removeMemo}>
              削除
            </button>
            <span class="spacer"></span>
            <button class="quiet" type="button" hidden={extras().length === 0} onClick={openExtras}>
              <span>{extras().length}</span>
              <span> components</span>
            </button>
            <button class="primary" type="submit" disabled={busy()}>
              保存
            </button>
          </div>
        </form>
      </dialog>

      <dialog id="components-dialog" class="components-dialog">
        <form class="editor-form" onSubmit={saveExtra}>
          <div class="dialog-head">
            <div>
              <p class="eyebrow">関連データ</p>
              <h2>Component</h2>
            </div>
            <button class="icon-button" type="button" aria-label="閉じる" onClick={closeExtras}>
              ×
            </button>
          </div>
          <label for="component-select">編集する Component</label>
          <select
            id="component-select"
            value={extraKey()}
            onChange={(event) => chooseExtra(event.currentTarget.value)}
          >
            {extras().map((item) => (
              <option key={item.type_key} value={item.type_key}>
                {item.type_key}
              </option>
            ))}
          </select>
          <div class="component-fields">
            {booleanFields().map((field) => (
              <label key={field.name} class="checkbox-row">
                <input
                  type="checkbox"
                  checked={Boolean(extraValue()[field.name])}
                  onChange={(event) => setExtraField(field.name, event.currentTarget.checked)}
                />
                <span>{field.name}</span>
              </label>
            ))}
            {textFields().map((field) => (
              <label key={field.name}>
                <span>{field.name}</span>
                <input
                  type={field.type === "string" ? "text" : "number"}
                  step={field.type === "integer" ? "1" : "any"}
                  value={extraValue()[field.name] ?? ""}
                  onInput={(event) =>
                    setExtraField(
                      field.name,
                      field.type === "string"
                        ? event.currentTarget.value
                        : Number(event.currentTarget.value),
                    )
                  }
                />
              </label>
            ))}
          </div>
          <p class="status" role="alert">
            {status()}
          </p>
          <div class="dialog-actions">
            <span class="spacer"></span>
            <button class="primary" type="submit" disabled={busy()}>
              変更を保存
            </button>
          </div>
        </form>
      </dialog>
    </div>,
  );

  onMount(() => {
    reload();
  });

  function fail(error) {
    status(error.message ?? String(error));
    busy(false);
  }
  function reload() {
    loadData()
      .then((data) => {
        notes(data.notes);
        tags(data.tags);
        types(data.types);
        status("");
      })
      .catch(fail);
  }
  function openEditor(id) {
    const note = notes().find((item) => item.id === id);
    editingId(id);
    title(note?.title ?? "");
    body(note?.body ?? "");
    draftTags(note?.tagIds ?? []);
    const dialog = document.getElementById("memo-dialog");
    if (dialog instanceof HTMLDialogElement) dialog.showModal();
  }
  function closeEditor() {
    const dialog = document.getElementById("memo-dialog");
    if (dialog instanceof HTMLDialogElement) dialog.close();
  }
  function toggleTag(id) {
    draftTags((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }
  function addTag(event) {
    event.preventDefault();
    if (!newTag().trim()) return;
    busy(true);
    createTag(newTag())
      .then(() => {
        newTag("");
        reload();
      })
      .catch(fail)
      .finally(() => busy(false));
  }
  function save(event) {
    event.preventDefault();
    if (!title().trim()) return;
    busy(true);
    saveMemo(currentNote(), title(), body(), draftTags())
      .then(() => {
        closeEditor();
        reload();
      })
      .catch(fail)
      .finally(() => busy(false));
  }
  function removeMemo() {
    if (!editingId() || !confirm("このメモを削除しますか？")) return;
    busy(true);
    deleteMemo(editingId())
      .then(() => {
        closeEditor();
        reload();
      })
      .catch(fail)
      .finally(() => busy(false));
  }
  function openExtras() {
    const first = extras()[0];
    if (!first) return;
    extraKey(first.type_key);
    extraValue({ ...first.value });
    const dialog = document.getElementById("components-dialog");
    if (dialog instanceof HTMLDialogElement) dialog.showModal();
  }
  function closeExtras() {
    const dialog = document.getElementById("components-dialog");
    if (dialog instanceof HTMLDialogElement) dialog.close();
  }
  function chooseExtra(key) {
    extraKey(key);
    extraValue({ ...extras().find((item) => item.type_key === key)?.value });
  }
  function setExtraField(name, value) {
    extraValue((current) => ({ ...current, [name]: value }));
  }
  function saveExtra(event) {
    event.preventDefault();
    if (!activeExtra()) return;
    busy(true);
    updateExtra(editingId(), activeExtra(), extraValue())
      .then(() => {
        closeExtras();
        reload();
      })
      .catch(fail)
      .finally(() => busy(false));
  }
}
