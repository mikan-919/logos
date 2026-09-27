import { derived, onMount, render, signal } from "irisout";
import { currentUser, signIn, signOut, signUp } from "./auth-client.js";
import { initialData } from "./bootstrap.js";
import { createTag, deleteMemo, editableExtras, loadData, saveMemo, updateExtra } from "./data.js";

export function App() {
  const notes = signal(initialData()?.notes ?? []);
  const tags = signal(initialData()?.tags ?? []);
  const types = signal(initialData()?.types ?? []);
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
  const user = signal(initialData()?.user ?? null);
  const checking = signal(!initialData());
  const authMode = signal("signin");
  const email = signal("");
  const password = signal("");
  const displayName = signal("");

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
      <div class="auth-loading" data-hidden={!checking()}>
        ログイン状態を確認しています
      </div>
      <section class="auth-screen" data-hidden={checking() || Boolean(user())} aria-label="認証">
        <form class="auth-card" onSubmit={submitAuth}>
          <div class="brand">
            <span class="brand-mark">✳</span>
            <span>TagMemo</span>
          </div>
          <p class="eyebrow">Logos</p>
          <h1>{authMode() === "signup" ? "アカウントを作成" : "ログイン"}</h1>
          <p class="auth-description">メモとタグを、あなたのアカウントに保存します。</p>
          <label for="auth-name" data-hidden={authMode() !== "signup"}>
            名前
          </label>
          <input
            id="auth-name"
            type="text"
            autocomplete="name"
            required
            disabled={authMode() !== "signup"}
            data-hidden={authMode() !== "signup"}
            value={displayName()}
            onInput={(event) => displayName(event.currentTarget.value)}
          />
          <label for="auth-email">メールアドレス</label>
          <input
            id="auth-email"
            type="email"
            autocomplete="email"
            required
            value={email()}
            onInput={(event) => email(event.currentTarget.value)}
          />
          <label for="auth-password">パスワード</label>
          <input
            id="auth-password"
            type="password"
            autocomplete={authMode() === "signup" ? "new-password" : "current-password"}
            minlength="8"
            required
            value={password()}
            onInput={(event) => password(event.currentTarget.value)}
          />
          <p class="status" role="alert">
            {status()}
          </p>
          <button class="primary" type="submit" disabled={busy()}>
            {authMode() === "signup" ? "登録する" : "ログイン"}
          </button>
          <button class="quiet auth-switch" type="button" onClick={switchAuth}>
            {authMode() === "signup" ? "ログインに戻る" : "アカウントを作成"}
          </button>
        </form>
      </section>
      <div class="app-content" data-hidden={!user()}>
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
          <button class="quiet logout" type="button" onClick={logout}>
            ログアウト
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
                  disabled={Boolean(tag.pending)}
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
                  disabled={busy()}
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
                    <button
                      type="button"
                      disabled={Boolean(note.pending)}
                      onClick={() => openEditor(note.id)}
                    >
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
              <button class="danger" type="button" data-hidden={!editingId()} onClick={removeMemo}>
                削除
              </button>
              <span class="spacer"></span>
              <button
                class="quiet"
                type="button"
                data-hidden={extras().length === 0}
                onClick={openExtras}
              >
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
      </div>
    </div>,
  );

  onMount(() => {
    if (initialData()) {
      user(initialData().user);
      checking(false);
    } else {
      currentUser()
        .then((nextUser) => {
          user(nextUser);
          if (nextUser) {
            loadData()
              .then((data) => {
                applyData(data);
                checking(false);
              })
              .catch((error) => {
                checking(false);
                fail(error);
              });
          } else {
            checking(false);
          }
        })
        .catch((error) => {
          checking(false);
          fail(error);
        });
    }
  });

  function switchAuth() {
    authMode(authMode() === "signin" ? "signup" : "signin");
    status("");
  }
  function submitAuth(event) {
    event.preventDefault();
    busy(true);
    const action =
      authMode() === "signup"
        ? signUp(displayName(), email(), password())
        : signIn(email(), password());
    action
      .then(() => {
        window.location.reload();
      })
      .catch((error) => fail(error));
  }
  function logout() {
    signOut()
      .then(() => {
        user(null);
        notes([]);
        tags([]);
        status("");
      })
      .catch((error) => fail(error));
  }

  function fail(error) {
    status(error.message ?? String(error));
    busy(false);
  }
  function applyData(data) {
    notes(data.notes);
    tags(data.tags);
    types(data.types);
    status("");
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
    if (busy() || !newTag().trim()) return;
    const name = newTag().trim();
    const previousTags = tags();
    busy(true);
    status("");
    tags([...previousTags, { id: crypto.randomUUID(), name, pending: true }]);
    newTag("");
    createTag(name)
      .then(() => {
        loadData()
          .then((data) => applyData(data))
          .catch((error) => fail(error))
          .finally(() => busy(false));
      })
      .catch((error) => {
        tags(previousTags);
        newTag(name);
        fail(error);
      });
  }
  function save(event) {
    event.preventDefault();
    if (busy() || !title().trim()) return;
    const note = currentNote();
    const previousNotes = notes();
    const nextTitle = title().trim();
    const nextBody = body();
    const nextTagIds = [...draftTags()];
    const tagLabels = tags()
      .filter((tag) => nextTagIds.includes(tag.id))
      .map((tag) => ({ id: tag.id, name: tag.name }));
    const pendingNote = {
      id: note?.id ?? crypto.randomUUID(),
      title: nextTitle,
      body: nextBody,
      tagIds: nextTagIds,
      tagLabels,
      components: note?.components ?? [],
      pending: !note,
    };
    busy(true);
    status("");
    notes(
      note
        ? previousNotes.map((item) => (item.id === note.id ? pendingNote : item))
        : [...previousNotes, pendingNote],
    );
    closeEditor();
    saveMemo(note, nextTitle, nextBody, nextTagIds)
      .then(() => {
        loadData()
          .then((data) => applyData(data))
          .catch((error) => fail(error))
          .finally(() => busy(false));
      })
      .catch((error) => {
        notes(previousNotes);
        const dialog = document.getElementById("memo-dialog");
        if (dialog instanceof HTMLDialogElement) dialog.showModal();
        fail(error);
      });
  }
  function removeMemo() {
    if (busy() || !editingId() || !confirm("このメモを削除しますか？")) return;
    const previousNotes = notes();
    const id = editingId();
    busy(true);
    status("");
    notes(previousNotes.filter((note) => note.id !== id));
    closeEditor();
    deleteMemo(id)
      .then(() => {
        loadData()
          .then((data) => applyData(data))
          .catch((error) => fail(error))
          .finally(() => busy(false));
      })
      .catch((error) => {
        notes(previousNotes);
        const dialog = document.getElementById("memo-dialog");
        if (dialog instanceof HTMLDialogElement) dialog.showModal();
        fail(error);
      });
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
    if (busy() || !activeExtra()) return;
    const previousNotes = notes();
    const id = editingId();
    const extra = activeExtra();
    const value = { ...extraValue() };
    busy(true);
    status("");
    notes(
      previousNotes.map((note) =>
        note.id === id
          ? {
              ...note,
              components: note.components.map((item) =>
                item.type_key === extra.type_key ? { ...item, value } : item,
              ),
            }
          : note,
      ),
    );
    closeExtras();
    updateExtra(id, extra, value)
      .then(() => {
        loadData()
          .then((data) => applyData(data))
          .catch((error) => fail(error))
          .finally(() => busy(false));
      })
      .catch((error) => {
        notes(previousNotes);
        const dialog = document.getElementById("components-dialog");
        if (dialog instanceof HTMLDialogElement) dialog.showModal();
        fail(error);
      });
  }
}
