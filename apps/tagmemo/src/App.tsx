import { derived, onMount, render, signal } from "irisout";
import { currentUser, signOut } from "./auth-client.ts";
import { initialData } from "./bootstrap.ts";
import { emptyDraft, keepEditedNote } from "./memo-state.ts";
import {
  deleteMemo,
  editableExtras,
  inferTagScores,
  loadData,
  saveMemo,
  writeMemoBody,
} from "./data.ts";
import { changedCharacters, relatedOrder, tagCandidates } from "./tag-model.ts";
import { setupWysiwyg } from "./wysiwyg.ts";
import { AuthFlow } from "./components/AuthFlow.tsx";
import { ExtrasFlow } from "./components/ExtrasFlow.tsx";
import { LibraryPanel } from "./components/LibraryPanel.tsx";
import { NoteStream } from "./components/NoteStream.tsx";
import { StreamDock } from "./components/StreamDock.tsx";
import { StreamTopbar } from "./components/StreamTopbar.tsx";
import { TagStateDrawer } from "./components/TagStateDrawer.tsx";

const first = initialData();
const initialNotes = (first?.notes ?? []).map((note) => ({
  ...note,
  tagStates: note.tagStates ?? note.tagIds.map((id) => ({ id, state: "on", score: 1 })),
}));
const editorState = { current: null, timer: null, suppressScrollUntil: 0, draftSerial: 0 };
const inferenceThreshold = 100;
const inferredText = new Map<string, string>();
const inferredTags = new Map<string, string>();
const scoresByNote = new Map<string, Record<string, number>>();
const inferenceIds = new Map<string, number>();
const pendingInference = new Map<string, { text: string; tags: string; reportError: boolean }>();

export function App() {
  const notes = signal(initialNotes);
  const tags = signal(first?.tags ?? []);
  const types = signal(first?.types ?? []);
  const user = signal(first?.user ?? null);
  const checking = signal(!first);
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
  const libraryOpen = signal(false);
  const libraryMode = signal("notes");
  const drawerOpen = signal(false);
  const tagQuery = signal("");
  const accountOpen = signal(false);
  const extraKey = signal("");
  const extraValue = signal({});

  const currentNote = derived(
    () => draftNew() ?? notes().find((note) => note.id === selectedId()) ?? null,
  );
  const currentKey = derived(() =>
    currentNote() ? selectedId() || `draft:${editorState.draftSerial}` : null,
  );
  const streamNotes = derived(() =>
    draftNew()
      ? [draftNew(), ...relatedOrder(notes(), streamSeed())]
      : relatedOrder(notes(), streamSeed()),
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
      <AuthFlow checking={checking} user={user} status={status} busy={busy} onFail={fail} />
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
          scrollSuppressed={() => performance.now() < editorState.suppressScrollUntil}
          activeId={selectedId}
          onActivate={activateNote}
          activeTitle={activeTitle}
          onDirty={markDirty}
          onRemoveTag={(id) => setTagState({ id, score: 0 }, "off")}
          onAddTag={() => openTagDrawer(true)}
          onDelete={removeMemo}
          onExtras={openExtras}
          extrasCount={() => extras().length}
        />
        <StreamDock onLibrary={openLibrary} onTags={toggleDrawer} onNew={newMemo} />
        <LibraryPanel
          open={libraryOpen}
          mode={libraryMode}
          notes={notes}
          tags={tags}
          activeId={selectedId}
          busy={busy}
          status={status}
          onClose={() => libraryOpen(false)}
          onSelect={selectFromLibrary}
          onApplyData={applyData}
          onFail={fail}
        />
        <TagStateDrawer
          open={drawerOpen}
          note={currentNote}
          candidates={candidates}
          inferring={inferring}
          query={tagQuery}
          busy={busy}
          selectedId={selectedId}
          draftNew={draftNew}
          onApplyData={applyData}
          onRefreshTags={inferCurrentTags}
          onFail={fail}
          onClose={() => drawerOpen(false)}
          onState={setTagState}
        />
        <p class="stream-status" role="status" data-hidden={!status()}>
          {status()}
        </p>
      </div>
      <ExtrasFlow
        extras={extras}
        activeExtra={activeExtra}
        extraKey={extraKey}
        extraValue={extraValue}
        booleanFields={booleanFields}
        textFields={textFields}
        selectedId={selectedId}
        status={status}
        busy={busy}
        onApplyData={applyData}
        onFail={fail}
      />
    </div>,
  );

  onMount(() => {
    editorState.current = setupWysiwyg();
    editorState.current.sync(streamNotes());
    if (first) checking(false);
    else
      currentUser()
        .then((nextUser) => {
          user(nextUser);
          if (nextUser)
            loadData()
              .then((data) => {
                applyData(data);
                checking(false);
              })
              .catch(fail);
          else checking(false);
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
  function logout() {
    clearTimeout(editorState.timer);
    signOut()
      .then(() => {
        user(null);
        notes([]);
        tags([]);
        inferredText.clear();
        inferredTags.clear();
        scoresByNote.clear();
        inferenceIds.clear();
        pendingInference.clear();
        status("");
      })
      .catch(fail);
  }
  function applyData(data) {
    const edited = dirty() && selectedId() ? editorState.current?.get() : null;
    const nextNotes = keepEditedNote(data.notes, selectedId(), edited, tagStates(), tags());
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
    if (!note || !tags().length) {
      if (note) {
        const key = note.id || `draft:${editorState.draftSerial}`;
        inferenceIds.set(key, (inferenceIds.get(key) ?? 0) + 1);
        pendingInference.delete(key);
      }
      inferredScores({});
      inferring(false);
    } else {
      const key = note.id || `draft:${editorState.draftSerial}`;
      const value = useEditor && note.id === selectedId() ? editorState.current?.get() : null;
      const title = value?.title ?? note.title;
      const body = value?.text ?? note.body;
      if (
        inferredText.get(key) === `${title}\n${body}` &&
        inferredTags.get(key) === JSON.stringify(tags()) &&
        scoresByNote.has(key)
      ) {
        inferenceIds.set(key, (inferenceIds.get(key) ?? 0) + 1);
        pendingInference.delete(key);
        inferredScores(scoresByNote.get(key));
        inferring(false);
      } else {
        requestTagInference(key, title, body, true);
      }
    }
  }
  function requestTagInference(key: string, title: string, body: string, reportError: boolean) {
    if (!tags().length) return;
    const tagList = [...tags()];
    const tagSignature = JSON.stringify(tagList);
    const text = `${title}\n${body}`;
    const pending = pendingInference.get(key);
    if (pending?.text === text && pending.tags === tagSignature) {
      pending.reportError ||= reportError;
      return;
    }
    const request = { text, tags: tagSignature, reportError };
    pendingInference.set(key, request);
    const id = (inferenceIds.get(key) ?? 0) + 1;
    inferenceIds.set(key, id);
    if (currentKey() === key) {
      inferredScores({});
      inferring(true);
    }
    inferTagScores(title, body, tagList)
      .then((scores) => {
        if (inferenceIds.get(key) !== id) return;
        inferredText.set(key, text);
        inferredTags.set(key, tagSignature);
        scoresByNote.set(key, scores);
        if (currentKey() === key) inferredScores(scores);
      })
      .catch((error) => {
        if (request.reportError && inferenceIds.get(key) === id && currentKey() === key)
          status(error?.message ?? "タグの推定に失敗しました");
      })
      .finally(() => {
        if (pendingInference.get(key) === request) pendingInference.delete(key);
        if (inferenceIds.get(key) === id && currentKey() === key) inferring(false);
      });
  }
  function activateNote(id, force = false) {
    if (!force && selectedId() === id && !draftNew()) return;
    if (dirty()) save();
    const note = notes().find((item) => item.id === id);
    if (note) {
      draftNew(null);
      selectedId(id);
      activeTitle(note.title);
      tagStates(note.tagStates ?? []);
      if (drawerOpen()) inferCurrentTags(note, false);
      else {
        inferredScores({});
        inferring(false);
      }
      accountOpen(false);
    }
  }
  function selectFromLibrary(id) {
    const note = notes().find((item) => item.id === id);
    if (!note) return;
    streamSeed(id);
    activateNote(id, true);
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
    editorState.draftSerial++;
    inferredScores({});
    inferring(false);
    const note = emptyDraft();
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
      const key = existing?.id || `draft:${editorState.draftSerial}`;
      const baseline = inferredText.get(key) ?? `${currentNote().title}\n${currentNote().body}`;
      inferredText.set(key, baseline);
      const savedText = `${title}\n${value.text}`;
      const states = [...tagStates()];
      const ids = states.filter((item) => item.state !== "off").map((item) => item.id);
      dirty(false);
      busy(true);
      status("");
      saveMemo(existing, title, writeMemoBody(value.text, value.html), ids, states)
        .then((id) => {
          if (draft) {
            inferredText.set(id, inferredText.get(key) ?? baseline);
            const cached = scoresByNote.get(key);
            if (cached) scoresByNote.set(id, cached);
            const signature = inferredTags.get(key);
            if (signature) inferredTags.set(id, signature);
            inferredText.delete(key);
            inferredTags.delete(key);
            scoresByNote.delete(key);
            inferenceIds.delete(key);
            pendingInference.delete(key);
          }
          if (draft && draftNew() === draft) {
            selectedId(id);
            draftNew(null);
            streamSeed(id);
          }
          loadData()
            .then((data) => {
              applyData(data);
              busy(false);
              if (
                changedCharacters(
                  inferredText.get(id) ?? baseline,
                  savedText,
                  inferenceThreshold,
                ) >= inferenceThreshold
              )
                requestTagInference(id, title, value.text, false);
            })
            .catch((error) => {
              dirty(true);
              fail(error);
            });
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
  function openExtras() {
    const firstExtra = extras()[0];
    if (!firstExtra) return;
    extraKey(firstExtra.type_key);
    extraValue({ ...firstExtra.value });
    (document.getElementById("components-dialog") as HTMLDialogElement)?.showModal();
  }
}
