import { render } from "irisout";
import { EditorSelectionMenu, EditorSummaryDialog } from "./EditorOverlays.tsx";
import { Icon } from "./Icon.tsx";

function NoteTag({ tag, note, activeId, onRemoveTag }) {
  render(
    <span
      key={tag.id}
      class={
        note.tagStates?.find((entry) => entry.id === tag.id)?.state === "on"
          ? "stream-tag manual"
          : "stream-tag"
      }
    >
      <span>#{tag.name}</span>
      <span data-hidden={note.tagStates?.find((entry) => entry.id === tag.id)?.state !== "on"}>
        <Icon name="check" />
      </span>
      <button
        type="button"
        data-hidden={activeId() !== note.id}
        aria-label={`${tag.name}を外す`}
        onClick={() => onRemoveTag(tag.id)}
      >
        <Icon name="x" />
      </button>
    </span>,
  );
}

function NoteSection({
  note,
  activeId,
  onActivate,
  onTitleInput,
  onBodyInput,
  onRemoveTag,
  onAddTag,
  onDelete,
  onExtras,
  extrasCount,
}) {
  render(
    <section
      key={note.id || "draft"}
      class={activeId() === note.id ? "stream-note active" : "stream-note"}
      data-note-id={note.id || "draft"}
    >
      <div class="stream-note-head">
        <p class="stream-kicker">メモ</p>
        <input
          class="stream-title"
          data-title-id={note.id || "draft"}
          aria-label="メモのタイトル"
          maxlength="200"
          placeholder="無題"
          value={note.title}
          onFocus={() => onActivate(note.id)}
          onInput={(event) => onTitleInput(note.id, event.currentTarget.value)}
        />
        <div class="stream-note-tags">
          {note.tagLabels.map((tag) => (
            <NoteTag
              key={tag.id}
              tag={tag}
              note={note}
              activeId={activeId}
              onRemoveTag={onRemoveTag}
            />
          ))}
          <button
            class="stream-add-tag"
            type="button"
            data-hidden={activeId() !== note.id}
            onClick={onAddTag}
          >
            <Icon name="plus" /> タグ
          </button>
        </div>
      </div>
      <article
        class="stream-doc"
        data-doc-id={note.id || "draft"}
        contenteditable="true"
        spellcheck="true"
        aria-label={`${note.title || "無題"}の本文`}
        onFocus={() => onActivate(note.id)}
        onInput={() => onBodyInput(note.id)}
      ></article>
      <div class="stream-note-footer" data-hidden={activeId() !== note.id}>
        <button type="button" data-hidden={extrasCount() === 0} onClick={onExtras}>
          関連データ {extrasCount()}
        </button>
        <button type="button" onClick={onDelete}>
          メモを削除
        </button>
      </div>
    </section>,
  );
}

export function NoteStream({
  notes,
  scrollSuppressed,
  activeId,
  onActivate,
  onTitleInput,
  onBodyInput,
  onRemoveTag,
  onAddTag,
  onDelete,
  onExtras,
  extrasCount,
}) {
  render(
    <main class="stream-scroll" id="scroll-root" onScroll={followScroll}>
      <div class="stream-content">
        {notes().map((note) => (
          <NoteSection
            key={note.id || "draft"}
            note={note}
            activeId={activeId}
            onActivate={onActivate}
            onTitleInput={onTitleInput}
            onBodyInput={onBodyInput}
            onRemoveTag={onRemoveTag}
            onAddTag={onAddTag}
            onDelete={onDelete}
            onExtras={onExtras}
            extrasCount={extrasCount}
          />
        ))}
        <div class="stream-empty" data-hidden={notes().length !== 0}>
          <h1>メモはありません</h1>
          <p>下の新しいメモボタンから作成してください。</p>
        </div>
      </div>
      <EditorSelectionMenu />
      <EditorSummaryDialog />
      <div
        id="editor-crumb"
        class="editor-crumb pointer-events-none fixed bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#363636] bg-[#242424] px-[10px] py-[7px] text-[10px] text-[var(--muted)] opacity-0 shadow-[0_14px_42px_#0006] transition-opacity duration-200 [&.show]:opacity-100"
        aria-live="polite"
      ></div>
    </main>,
  );

  function followScroll(event) {
    if (scrollSuppressed()) return;
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
    if (id && id !== "draft" && id !== activeId()) onActivate(id);
  }
}
