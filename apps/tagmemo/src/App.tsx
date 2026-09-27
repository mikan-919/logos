import { derived, onMount, render, signal } from "irisout";
import { currentUser, signIn, signOut, signUp } from "./auth-client.ts";
import { initialData } from "./bootstrap.ts";
import {
  createTag,
  deleteMemo,
  editableExtras,
  loadData,
  saveMemo,
  updateExtra,
  writeMemoBody,
} from "./data.ts";
import { setupWysiwyg } from "./wysiwyg.ts";
import { filterNotes } from "./filter-notes.ts";
import { AuthScreen } from "./components/AuthScreen.tsx";
import { ExtrasDialog } from "./components/ExtrasDialog.tsx";
import { InlineEditor } from "./components/InlineEditor.tsx";
import { NoteList } from "./components/NoteList.tsx";
import { SpaNavigation } from "./components/SpaNavigation.tsx";
import { SpaTopbar } from "./components/SpaTopbar.tsx";
import { TagDrawer } from "./components/TagDrawer.tsx";
import { TagsPage } from "./components/TagsPage.tsx";

const first = initialData();
const editorState = { current: null, timer: null };

export function App() {
  const notes = signal(first?.notes ?? []);
  const tags = signal(first?.tags ?? []);
  const types = signal(first?.types ?? []);
  const user = signal(first?.user ?? null);
  const checking = signal(!first);
  const authMode = signal("signin");
  const email = signal("");
  const password = signal("");
  const displayName = signal("");
  const status = signal("");
  const busy = signal(false);
  const view = signal("all");
  const selectedTag = signal("");
  const selectedId = signal(first?.notes[0]?.id ?? "");
  const draftNew = signal(null);
  const draftTags = signal(first?.notes[0]?.tagIds ?? []);
  const search = signal("");
  const sort = signal("updated");
  const listVisible = signal(true);
  const mobileNavOpen = signal(false);
  const drawerOpen = signal(false);
  const tagQuery = signal("");
  const newTag = signal("");
  const dirty = signal(false);
  const extraKey = signal("");
  const extraValue = signal({});

  const currentNote = derived(
    () => draftNew() ?? notes().find((note) => note.id === selectedId()) ?? null,
  );
  const filteredNotes = derived(() =>
    filterNotes(notes(), view(), selectedTag(), search(), sort()),
  );
  const listTitle = derived(() =>
    view() === "tag"
      ? `#${tags().find((tag) => tag.id === selectedTag())?.name ?? "タグ"}`
      : ({ all: "すべてのメモ", recent: "最近", untagged: "タグなし" }[view()] ?? "すべてのメモ"),
  );
  const extras = derived(() => editableExtras(currentNote(), types()));
  const activeExtra = derived(() => extras().find((item) => item.type_key === extraKey()));
  const booleanFields = derived(
    () => activeExtra()?.fields.filter((field) => field.type === "boolean") ?? [],
  );
  const textFields = derived(
    () => activeExtra()?.fields.filter((field) => field.type !== "boolean") ?? [],
  );

  render(
    <div class="tagmemo-root">
      <AuthScreen
        checking={checking}
        user={user}
        mode={authMode}
        email={email}
        password={password}
        displayName={displayName}
        status={status}
        busy={busy}
        onSubmit={submitAuth}
        onSwitch={switchAuth}
        onEmail={email}
        onPassword={password}
        onDisplayName={displayName}
      />
      <div class="spa-app" data-hidden={!user()}>
        <SpaNavigation
          notes={notes}
          tags={tags}
          view={view}
          selectedTag={selectedTag}
          mobileOpen={mobileNavOpen}
          onView={chooseView}
          onTag={chooseTag}
          onManage={() => {
            view("tags");
            mobileNavOpen(false);
          }}
          onNew={newMemo}
          onLogout={logout}
        />
        <section class="spa-shell">
          <SpaTopbar
            search={search}
            onSearch={updateSearch}
            onToggleList={toggleList}
            onSave={save}
            onSummarize={() => {
              editorState.current?.openSummary();
            }}
            onTags={() => {
              drawerOpen(true);
            }}
            onNew={newMemo}
            onLogout={logout}
            showingTags={() => view() === "tags"}
            busy={busy}
            dirty={dirty}
          />
          <div class={listVisible() ? "spa-work" : "spa-work list-hidden"}>
            <div data-hidden={view() === "tags"} class="spa-notes-work">
              <NoteList
                notes={filteredNotes}
                title={listTitle}
                selectedId={selectedId}
                sort={sort}
                onSort={sort}
                onSelect={selectNote}
                visible={listVisible}
              />
              <InlineEditor
                note={currentNote}
                tags={tags}
                draftTags={draftTags}
                onTitleInput={markDirty}
                onInput={markDirty}
                onToggleTag={toggleTag}
                onOpenTagPicker={() => {
                  drawerOpen(true);
                }}
                onDelete={removeMemo}
                onExtras={openExtras}
                extrasCount={() => extras().length}
              />
            </div>
            <div data-hidden={view() !== "tags"} class="spa-tags-work">
              <TagsPage
                tags={tags}
                notes={notes}
                query={tagQuery}
                onQuery={tagQuery}
                newTag={newTag}
                onNewTag={newTag}
                onCreate={addTag}
                onOpenTag={chooseTag}
              />
            </div>
            <TagDrawer
              open={drawerOpen}
              tags={tags}
              draftTags={draftTags}
              onClose={() => {
                drawerOpen(false);
              }}
              onToggleTag={toggleTag}
            />
          </div>
          <p class="spa-status" role="status" data-hidden={!status()}>
            {status()}
          </p>
        </section>
      </div>
      <ExtrasDialog
        extras={extras}
        activeExtra={activeExtra}
        extraKey={extraKey}
        extraValue={extraValue}
        booleanFields={booleanFields}
        textFields={textFields}
        status={status}
        busy={busy}
        onClose={closeExtras}
        onChoose={chooseExtra}
        onField={setExtraField}
        onSave={saveExtra}
      />
    </div>,
  );

  onMount(() => {
    if (window.matchMedia("(max-width: 650px)").matches) listVisible(false);
    editorState.current = setupWysiwyg();
    const selected = notes().find((note) => note.id === selectedId());
    editorState.current.set(selected?.title ?? "", selected?.body ?? "", selected?.bodyHtml ?? "");
    if (first) checking(false);
    else
      currentUser()
        .then(async (nextUser) => {
          user(nextUser);
          if (nextUser) applyData(await loadData());
          checking(false);
        })
        .catch(fail);
    document.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        save();
      }
    });
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
    action.then(() => window.location.reload()).catch(fail);
  }
  function logout() {
    clearTimeout(editorState.timer);
    signOut()
      .then(() => {
        user(null);
        notes([]);
        tags([]);
        status("");
        mobileNavOpen(false);
      })
      .catch(fail);
  }
  function fail(error) {
    status(error?.message ?? String(error));
    busy(false);
    checking(false);
  }
  function applyData(data) {
    notes(data.notes);
    tags(data.tags);
    types(data.types);
    status("");
    if (!selectedId() && !draftNew() && data.notes.length) {
      selectedId(data.notes[0].id);
      editorState.current?.set(data.notes[0].title, data.notes[0].body, data.notes[0].bodyHtml);
      draftTags(data.notes[0].tagIds);
    }
  }
  function chooseView(next) {
    view(next);
    selectedTag("");
    drawerOpen(false);
    mobileNavOpen(false);
    if (window.innerWidth <= 650) listVisible(true);
  }
  function chooseTag(id) {
    selectedTag(id);
    view("tag");
    drawerOpen(false);
    mobileNavOpen(false);
    if (window.innerWidth <= 650) listVisible(true);
  }
  function toggleList() {
    if (window.innerWidth <= 650) mobileNavOpen(!mobileNavOpen());
    else listVisible(!listVisible());
  }
  function updateSearch(value) {
    search(value);
    if (view() === "tags") tagQuery(value);
  }
  function selectNote(id) {
    if (selectedId() === id && !draftNew()) return;
    clearTimeout(editorState.timer);
    if (dirty()) save();
    const note = notes().find((item) => item.id === id);
    if (note) {
      draftNew(null);
      selectedId(id);
      draftTags(note.tagIds);
      editorState.current.set(note.title, note.body, note.bodyHtml);
      dirty(false);
      drawerOpen(false);
      listVisible(false);
    }
  }
  function newMemo() {
    clearTimeout(editorState.timer);
    if (dirty()) save();
    const note = {
      id: "",
      title: "",
      body: "",
      bodyHtml: "",
      tagIds: [],
      tagLabels: [],
      components: [],
      pending: true,
    };
    draftNew(note);
    selectedId("");
    draftTags([]);
    view("all");
    drawerOpen(false);
    mobileNavOpen(false);
    listVisible(false);
    editorState.current.set("", "", "");
    dirty(false);
    document.getElementById("memo-title")?.focus();
  }
  function markDirty() {
    if (!currentNote()) return;
    dirty(true);
    clearTimeout(editorState.timer);
    editorState.timer = setTimeout(save, 650);
  }
  function toggleTag(id) {
    draftTags((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
    markDirty();
  }
  function addTag(event) {
    event.preventDefault();
    const name = newTag().trim();
    if (!name || busy()) return;
    busy(true);
    createTag(name)
      .then(() => loadData())
      .then((data) => {
        applyData(data);
        newTag("");
      })
      .catch(fail)
      .finally(() => busy(false));
  }
  function save() {
    clearTimeout(editorState.timer);
    if (!editorState.current || !currentNote() || !dirty()) return;
    if (busy()) {
      editorState.timer = setTimeout(save, 650);
      return;
    }
    const value = editorState.current.get();
    const title = value.title || "無題";
    if (title.length > 200) status("タイトルは200文字以内にしてください");
    else {
      const prior = notes();
      const draft = draftNew();
      const existing = draft ? null : notes().find((note) => note.id === selectedId());
      const ids = [...draftTags()];
      const pending = {
        ...currentNote(),
        title,
        body: value.text,
        bodyHtml: value.html,
        tagIds: ids,
        tagLabels: tags()
          .filter((tag) => ids.includes(tag.id))
          .map((tag) => ({ id: tag.id, name: tag.name })),
        pending: true,
      };
      notes(
        existing
          ? prior.map((note) => (note.id === existing.id ? pending : note))
          : [pending, ...prior],
      );
      dirty(false);
      busy(true);
      status("");
      saveMemo(existing, title, writeMemoBody(value.text, value.html), ids)
        .then((id) => {
          if (!existing && draftNew() === draft) {
            selectedId(id);
            draftNew(null);
          }
          loadData()
            .then(applyData)
            .catch(fail)
            .finally(() => busy(false));
        })
        .catch((error) => {
          notes(prior);
          dirty(true);
          fail(error);
          busy(false);
        });
    }
  }
  function removeMemo() {
    const id = selectedId();
    if (!id || busy() || !confirm("このメモを削除しますか？")) return;
    clearTimeout(editorState.timer);
    const prior = notes();
    notes(prior.filter((note) => note.id !== id));
    selectedId("");
    draftNew(null);
    busy(true);
    deleteMemo(id)
      .then(() => loadData())
      .then(applyData)
      .catch((error) => {
        notes(prior);
        selectedId(id);
        fail(error);
      })
      .finally(() => busy(false));
  }
  function openExtras() {
    const first = extras()[0];
    if (!first) return;
    extraKey(first.type_key);
    extraValue({ ...first.value });
    (document.getElementById("components-dialog") as HTMLDialogElement)?.showModal();
  }
  function closeExtras() {
    (document.getElementById("components-dialog") as HTMLDialogElement)?.close();
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
    const prior = notes();
    const id = selectedId();
    const extra = activeExtra();
    const value = { ...extraValue() };
    busy(true);
    updateExtra(id, extra, value)
      .then(() => {
        closeExtras();
        loadData()
          .then(applyData)
          .catch(fail)
          .finally(() => busy(false));
      })
      .catch((error) => {
        notes(prior);
        fail(error);
        busy(false);
      });
  }
}
