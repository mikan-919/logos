import { derived, onMount, render, signal } from "irisout";
import { currentUser, signIn, signOut, signUp } from "./auth-client.ts";
import { initialData } from "./bootstrap.ts";
import {
  createTag,
  deleteMemo,
  editableExtras,
  inferTagScores,
  loadData,
  mergeOrDeleteTag,
  renameTag,
  saveMemo,
  updateExtra,
  writeMemoBody,
} from "./data.ts";
import { filterNotes } from "./filter-notes.ts";
import { relatedOrder, tagCandidates } from "./tag-model.ts";
import { setupWysiwyg } from "./wysiwyg.ts";
import { AuthScreen } from "./components/AuthScreen.tsx";
import { ExtrasDialog } from "./components/ExtrasDialog.tsx";
import { NoteStream } from "./components/NoteStream.tsx";
import { StreamDock } from "./components/StreamDock.tsx";
import { StreamLibrary } from "./components/StreamLibrary.tsx";
import { StreamTopbar } from "./components/StreamTopbar.tsx";
import { TagStateDrawer } from "./components/TagStateDrawer.tsx";

const first = initialData();
const initialNotes = (first?.notes ?? []).map((note) => ({
  ...note,
  tagStates: note.tagStates ?? note.tagIds.map((id) => ({ id, state: "on", score: 1 })),
}));
const editorState = { current: null, timer: null, suppressScrollUntil: 0 };

export function App() {
  const notes = signal(initialNotes);
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
  const dirty = signal(false);
  const selectedId = signal(first?.notes[0]?.id ?? "");
  const activeTitle = signal(first?.notes[0]?.title ?? "");
  const streamSeed = signal(first?.notes[0]?.id ?? "");
  const draftNew = signal(null);
  const tagStates = signal(
    first?.notes[0]?.tagStates ??
      first?.notes[0]?.tagIds?.map((id) => ({ id, state: "on", score: 1 })) ??
      [],
  );
  const inferredScores = signal({});
  const inferring = signal(false);
  let inferenceId = 0;
  const libraryOpen = signal(false);
  const libraryMode = signal("notes");
  const libraryFilter = signal("all");
  const libraryTag = signal("");
  const librarySort = signal("updated");
  const libraryQuery = signal("");
  const drawerOpen = signal(false);
  const tagQuery = signal("");
  const accountOpen = signal(false);
  const extraKey = signal("");
  const extraValue = signal({});

  const currentNote = derived(
    () => draftNew() ?? notes().find((note) => note.id === selectedId()) ?? null,
  );
  const streamNotes = derived(() =>
    draftNew()
      ? [draftNew(), ...relatedOrder(notes(), streamSeed())]
      : relatedOrder(notes(), streamSeed()),
  );
  const libraryNotes = derived(() =>
    filterNotes(notes(), libraryFilter(), libraryTag(), libraryQuery(), librarySort()),
  );
  const candidates = derived(() =>
    currentNote()
      ? tagCandidates({ ...currentNote(), tagStates: tagStates() }, tags(), inferredScores())
      : [],
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
      <div class="stream-app" data-hidden={!user()}>
        <StreamTopbar
          title={activeTitle}
          dirty={dirty}
          busy={busy}
          user={user}
          accountOpen={accountOpen}
          onLibrary={openLibrary}
          onSummary={() => editorState.current?.openSummary()}
          onTags={toggleDrawer}
          onSave={save}
          onAccount={() => accountOpen(!accountOpen())}
          onLogout={logout}
        />
        <NoteStream
          notes={streamNotes}
          onScroll={followScroll}
          activeId={selectedId}
          onActivate={activateNote}
          onTitleInput={editTitle}
          onBodyInput={editBody}
          onRemoveTag={(id) => setTagState({ id, score: 0 }, "off")}
          onAddTag={() => openTagDrawer(true)}
          onDelete={removeMemo}
          onExtras={openExtras}
          extrasCount={() => extras().length}
        />
        <StreamDock onLibrary={openLibrary} onTags={toggleDrawer} onNew={newMemo} />
        <StreamLibrary
          open={libraryOpen}
          mode={libraryMode}
          filter={libraryFilter}
          selectedTag={libraryTag}
          sort={librarySort}
          query={libraryQuery}
          notes={libraryNotes}
          allNotes={notes}
          tags={tags}
          activeId={selectedId}
          onClose={() => libraryOpen(false)}
          onMode={libraryMode}
          onFilter={(value) => {
            libraryFilter(value);
            libraryTag("");
          }}
          onTagFilter={(id) => {
            libraryTag(id);
            libraryFilter("tag");
          }}
          onSort={librarySort}
          onQuery={libraryQuery}
          onSelect={selectFromLibrary}
          onCreateTag={addTagFromLibrary}
          onRenameTag={renameTagFromLibrary}
          onMergeTag={mergeTagFromLibrary}
          onDeleteTag={deleteTagFromLibrary}
        />
        <TagStateDrawer
          open={drawerOpen}
          note={currentNote}
          candidates={candidates}
          inferring={inferring}
          query={tagQuery}
          busy={busy}
          onClose={() => drawerOpen(false)}
          onState={setTagState}
          onCreateTag={createTagForNote}
        />
        <p class="stream-status" role="status" data-hidden={!status()}>
          {status()}
        </p>
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
    editorState.current = setupWysiwyg();
    editorState.current.sync(streamNotes());
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
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openLibrary();
      }
      if (event.key === "Escape") {
        libraryOpen(false);
        drawerOpen(false);
        accountOpen(false);
      }
    });
  });

  function fail(error) {
    status(error?.message ?? String(error));
    busy(false);
    checking(false);
  }
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
      })
      .catch(fail);
  }
  function applyData(data) {
    const edited = dirty() && selectedId() ? editorState.current?.get() : null;
    const nextNotes = edited
      ? data.notes.map((note) =>
          note.id === selectedId()
            ? {
                ...note,
                title: edited.title || "無題",
                body: edited.text,
                bodyHtml: edited.html,
                tagStates: tagStates(),
                tagIds: tagStates()
                  .filter((tag) => tag.state !== "off")
                  .map((tag) => tag.id),
                tagLabels: tags()
                  .filter((tag) =>
                    tagStates().some((entry) => entry.id === tag.id && entry.state !== "off"),
                  )
                  .map((tag) => ({ id: tag.id, name: tag.name })),
              }
            : note,
        )
      : data.notes;
    notes(nextNotes);
    tags(data.tags);
    types(data.types);
    if (!draftNew()) {
      const selected = nextNotes.find((note) => note.id === selectedId()) ?? nextNotes[0];
      selectedId(selected?.id ?? "");
      if (!edited) {
        activeTitle(selected?.title ?? "");
        tagStates(selected?.tagStates ?? []);
      }
      if (!streamSeed()) streamSeed(selected?.id ?? "");
    }
    requestAnimationFrame(() => editorState.current?.sync(streamNotes()));
  }
  function openLibrary() {
    accountOpen(false);
    libraryMode("notes");
    libraryOpen(true);
  }
  function toggleDrawer() {
    if (drawerOpen()) drawerOpen(false);
    else openTagDrawer();
  }
  function openTagDrawer(focusSearch = false) {
    tagQuery("");
    drawerOpen(true);
    accountOpen(false);
    inferCurrentTags();
    if (focusSearch)
      requestAnimationFrame(() => document.getElementById("tag-drawer-search")?.focus());
  }
  function inferCurrentTags(note = currentNote(), useEditor = true) {
    const id = ++inferenceId;
    inferredScores({});
    inferring(false);
    if (!note || !tags().length) return;
    const value = useEditor && note.id === selectedId() ? editorState.current?.get() : null;
    inferring(true);
    inferTagScores(value?.title ?? note.title, value?.text ?? note.body, tags())
      .then((scores) => {
        if (id === inferenceId) inferredScores(scores);
      })
      .catch((error) => {
        if (id === inferenceId) status(error?.message ?? "タグの推定に失敗しました");
      })
      .finally(() => {
        if (id === inferenceId) inferring(false);
      });
  }
  function followScroll(event) {
    if (performance.now() < editorState.suppressScrollUntil) return;
    const root = event.currentTarget;
    const box = root.getBoundingClientRect();
    const target = box.top + box.height * 0.42;
    const nearest = [...root.querySelectorAll(".stream-note")]
      .filter((section) => {
        const rect = section.getBoundingClientRect();
        return rect.bottom >= box.top && rect.top <= box.bottom;
      })
      .map((section) => {
        const rect = section.getBoundingClientRect();
        return { section, gap: Math.max(rect.top - target, target - rect.bottom, 0) };
      })
      .sort((a, b) => a.gap - b.gap)[0]?.section;
    const id = nearest?.getAttribute("data-note-id");
    if (id && id !== "draft" && id !== selectedId()) activateNote(id);
  }
  function activateNote(id) {
    if (selectedId() === id && !draftNew()) return;
    if (dirty()) save();
    const note = notes().find((item) => item.id === id);
    if (note) {
      draftNew(null);
      selectedId(id);
      activeTitle(note.title);
      tagStates(note.tagStates ?? []);
      if (drawerOpen()) inferCurrentTags(note, false);
      accountOpen(false);
    }
  }
  function selectFromLibrary(id) {
    const note = notes().find((item) => item.id === id);
    if (!note) return;
    if (dirty()) save();
    streamSeed(id);
    draftNew(null);
    selectedId(id);
    activeTitle(note.title);
    tagStates(note.tagStates ?? []);
    if (drawerOpen()) inferCurrentTags(note, false);
    libraryOpen(false);
    editorState.suppressScrollUntil = performance.now() + 650;
    requestAnimationFrame(() => {
      editorState.current?.sync(streamNotes());
      document
        .querySelector(`.stream-note[data-note-id="${CSS.escape(id)}"]`)
        ?.scrollIntoView({ block: "start" });
    });
  }
  function newMemo() {
    if (dirty()) save();
    const note = {
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
    draftNew(note);
    selectedId("");
    activeTitle("");
    tagStates([]);
    libraryOpen(false);
    drawerOpen(false);
    editorState.suppressScrollUntil = performance.now() + 650;
    requestAnimationFrame(() => {
      editorState.current?.sync(streamNotes());
      document
        .querySelector(".stream-note[data-note-id='draft']")
        ?.scrollIntoView({ block: "start" });
      (
        document.querySelector(
          ".stream-note[data-note-id='draft'] .stream-title",
        ) as HTMLInputElement
      )?.focus();
    });
  }
  function editTitle(id, value) {
    if (id === selectedId()) {
      activeTitle(value);
      markDirty();
    }
  }
  function editBody(id) {
    if (id === selectedId()) markDirty();
  }
  function markDirty() {
    if (!currentNote()) return;
    dirty(true);
    clearTimeout(editorState.timer);
    editorState.timer = setTimeout(save, 650);
  }
  function setTagState(tag, state) {
    const note = currentNote();
    if (!note) return;
    const next = [
      ...tagStates().filter((item) => item.id !== tag.id),
      { id: tag.id, state, score: state === "on" ? 1 : state === "off" ? 0 : (tag.score ?? 0.5) },
    ];
    const ids = next.filter((item) => item.state !== "off").map((item) => item.id);
    const labels = tags()
      .filter((item) => ids.includes(item.id))
      .map((item) => ({ id: item.id, name: item.name }));
    tagStates(next);
    if (draftNew()) draftNew({ ...draftNew(), tagStates: next, tagIds: ids, tagLabels: labels });
    else
      notes(
        notes().map((item) =>
          item.id === note.id ? { ...item, tagStates: next, tagIds: ids, tagLabels: labels } : item,
        ),
      );
    markDirty();
  }
  async function createTagForNote(name) {
    if (busy() || !currentNote()) return false;
    const selected = selectedId();
    const draft = draftNew();
    busy(true);
    try {
      const id = await createTag(name);
      applyData(await loadData());
      busy(false);
      if (drawerOpen()) inferCurrentTags();
      if (selectedId() === selected && draftNew() === draft) setTagState({ id, score: 1 }, "on");
      return true;
    } catch (error) {
      fail(error);
      return false;
    }
  }
  function addTagFromLibrary() {
    const name = prompt("新しいタグ名")?.trim().replace(/^#/, "");
    if (!name || tags().some((tag) => tag.name.toLocaleLowerCase() === name.toLocaleLowerCase()))
      return;
    busy(true);
    createTag(name)
      .then(() => loadData())
      .then(applyData)
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
    if (title.length > 200) {
      status("タイトルは200文字以内にしてください");
    } else {
      const draft = draftNew();
      const existing = draft ? null : notes().find((note) => note.id === selectedId());
      const states = [...tagStates()];
      const ids = states.filter((item) => item.state !== "off").map((item) => item.id);
      dirty(false);
      busy(true);
      status("");
      saveMemo(existing, title, writeMemoBody(value.text, value.html), ids, states)
        .then(async (id) => {
          if (draft && draftNew() === draft) {
            selectedId(id);
            draftNew(null);
            streamSeed(id);
          }
          applyData(await loadData());
          busy(false);
          if (drawerOpen()) inferCurrentTags();
        })
        .catch((error) => {
          dirty(true);
          fail(error);
        });
    }
  }
  function removeMemo() {
    const id = selectedId();
    if (!id || busy() || !confirm("このメモを削除しますか？")) return;
    clearTimeout(editorState.timer);
    busy(true);
    deleteMemo(id)
      .then(() => loadData())
      .then((data) => {
        selectedId("");
        streamSeed("");
        applyData(data);
      })
      .catch(fail)
      .finally(() => busy(false));
  }
  function renameTagFromLibrary(tag) {
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
      .then(applyData)
      .catch(fail)
      .finally(() => busy(false));
  }
  function mergeTagFromLibrary(tag) {
    const name = prompt(`#${tag.name} の統合先タグ名`)?.trim().replace(/^#/, "");
    const target = tags().find((item) => item.name === name && item.id !== tag.id);
    if (!target) status("統合先の既存タグを指定してください");
    else {
      busy(true);
      mergeOrDeleteTag(notes(), tag.id, target.id)
        .then(() => loadData())
        .then(applyData)
        .catch(fail)
        .finally(() => busy(false));
    }
  }
  function deleteTagFromLibrary(tag) {
    if (!confirm(`#${tag.name} を削除しますか？`)) return;
    busy(true);
    mergeOrDeleteTag(notes(), tag.id, null)
      .then(() => loadData())
      .then(applyData)
      .catch(fail)
      .finally(() => busy(false));
  }
  function openExtras() {
    const firstExtra = extras()[0];
    if (!firstExtra) return;
    extraKey(firstExtra.type_key);
    extraValue({ ...firstExtra.value });
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
    busy(true);
    updateExtra(selectedId(), activeExtra(), { ...extraValue() })
      .then(async () => {
        closeExtras();
        applyData(await loadData());
        busy(false);
      })
      .catch(fail);
  }
}
