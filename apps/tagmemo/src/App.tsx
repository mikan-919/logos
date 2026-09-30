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
import {
  shouldInferTags,
  updateTagScores,
  isDisplayedTag,
  relatedOrder,
  tagCandidates,
} from "./tag-model.ts";
import { setupWysiwyg } from "./wysiwyg.ts";
import { AuthFlow } from "./components/AuthFlow.tsx";
import { ExtrasFlow } from "./components/ExtrasFlow.tsx";
import { LibraryPanel } from "./components/LibraryPanel.tsx";
import { NoteStream } from "./components/NoteStream.tsx";
import { StreamDock } from "./components/StreamDock.tsx";
import { StreamTopbar } from "./components/StreamTopbar.tsx";
import { TagScoreDrawer } from "./components/TagScoreDrawer.tsx";

const first = initialData();
const initialNotes = first?.notes ?? [];
const editorState = { current: null, timer: null, suppressScrollUntil: 0, draftSerial: 0 };
const inferredText = new Map<string, string>();
const inferenceIds = new Map<string, number>();
const pendingInference = new Map<
  string,
  { text: string; tags: string; overrides: Record<string, number> }
>();

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
  const tagScores = signal(first?.notes[0]?.tagScores ?? []);
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
  const candidates = derived(() => tagCandidates({ tagScores: tagScores() }, tags()));
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
          onRemoveTag={(id) => setTagScore({ id }, 0)}
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
        <TagScoreDrawer
          open={drawerOpen}
          note={currentNote}
          candidates={candidates}
          inferring={inferring}
          query={tagQuery}
          busy={busy}
          selectedId={selectedId}
          draftNew={draftNew}
          onApplyData={applyData}
          onFail={fail}
          onClose={() => drawerOpen(false)}
          onScore={setTagScore}
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
    // Irisout 0.3.4 updates signals in lifecycle listeners, not nested helper Promise callbacks.
    document.addEventListener("tagmemo:inference", (event) => {
      const result = (event as CustomEvent).detail;
      if (inferenceIds.get(result.key) !== result.id || currentKey() !== result.key) return;
      if (result.scores) {
        inferredText.set(result.key, result.text);
        applyInferredScores(result.scores);
      }
      inferring(false);
    });
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
        inferenceIds.clear();
        pendingInference.clear();
        status("");
      })
      .catch(fail);
  }
  function applyData(data) {
    const edited = dirty() && selectedId() ? editorState.current?.get() : null;
    const nextNotes = keepEditedNote(data.notes, selectedId(), edited, tagScores(), data.tags);
    notes(nextNotes);
    tags(data.tags);
    types(data.types);
    if (!draftNew()) {
      const selected = nextNotes.find((note) => note.id === selectedId()) ?? nextNotes[0];
      selectedId(selected?.id ?? "");
      if (!edited) activeTitle(selected?.title ?? "");
      tagScores(selected?.tagScores ?? []);
      if (!streamSeed()) streamSeed(selected?.id ?? "");
    } else {
      const scores = updateTagScores(tagScores(), data.tags);
      tagScores(scores);
      draftNew({
        ...draftNew(),
        tagScores: scores,
        tagLabels: tagCandidates({ tagScores: scores }, data.tags)
          .filter(isDisplayedTag)
          .map((tag) => ({ id: tag.id, name: tag.name })),
      });
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
    if (focusSearch)
      requestAnimationFrame(() => document.getElementById("tag-drawer-search")?.focus());
  }
  function requestTagInference(key: string, title: string, body: string) {
    if (!tags().length) return;
    const tagList = tags();
    const tagSignature = JSON.stringify(tagList);
    const text = `${title}\n${body}`;
    const pending = pendingInference.get(key);
    if (pending?.text === text && pending.tags === tagSignature) return;
    const request = { text, tags: tagSignature, overrides: {} };
    pendingInference.set(key, request);
    const id = (inferenceIds.get(key) ?? 0) + 1;
    inferenceIds.set(key, id);
    if (currentKey() === key) {
      inferring(true);
    }
    inferTagScores(title, body, tagList)
      .then((scores) => {
        if (inferenceIds.get(key) !== id) return;
        document.dispatchEvent(
          new CustomEvent("tagmemo:inference", {
            detail: {
              key,
              id,
              scores: { ...scores, ...request.overrides },
              text,
            },
          }),
        );
      })
      .catch(() => {
        document.dispatchEvent(new CustomEvent("tagmemo:inference", { detail: { key, id } }));
      })
      .finally(() => {
        if (pendingInference.get(key) === request) pendingInference.delete(key);
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
      tagScores(note.tagScores);
      inferring(pendingInference.has(id));
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
    inferring(false);
    const note = emptyDraft(tags());
    draftNew(note);
    selectedId("");
    activeTitle("");
    tagScores(note.tagScores);
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
  function applyInferredScores(scores) {
    const next = updateTagScores(tagScores(), tags(), scores);
    if (next !== tagScores()) applyTagScores(next);
    else markDirty();
  }
  function setTagScore(tag, score) {
    if (!currentNote()) return;
    const pending = pendingInference.get(currentKey());
    if (pending) pending.overrides[tag.id] = score;
    const next = updateTagScores(tagScores(), tags(), { [tag.id]: score });
    if (next !== tagScores()) applyTagScores(next);
  }
  function applyTagScores(next) {
    const note = currentNote();
    if (!note) return;
    const labels = tagCandidates({ tagScores: next }, tags())
      .filter(isDisplayedTag)
      .map((tag) => ({ id: tag.id, name: tag.name }));
    tagScores(next);
    if (draftNew()) draftNew({ ...draftNew(), tagScores: next, tagLabels: labels });
    else notes(keepEditedNote(notes(), note.id, editorState.current.get(), next, tags()));
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
      const baseline = inferredText.get(key) ?? existing?.inferredText;
      const savedText = `${title}\n${value.text}`;
      const scores = tagScores();
      dirty(false);
      busy(true);
      status("");
      saveMemo(existing, title, writeMemoBody(value.text, value.html), scores, baseline)
        .then((id) => {
          if (draft) {
            const inferred = inferredText.get(key);
            if (inferred !== undefined) inferredText.set(id, inferred);
            inferredText.delete(key);
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
                (value.text.trim() || (value.title.trim() && value.title.trim() !== "無題")) &&
                shouldInferTags(inferredText.get(id) ?? baseline, savedText)
              )
                requestAnimationFrame(() => requestTagInference(id, title, value.text));
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
