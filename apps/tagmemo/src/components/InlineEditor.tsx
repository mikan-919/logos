import { render } from "irisout";
import { EditorSelectionMenu, EditorSummaryDialog } from "./EditorOverlays.tsx";

export function InlineEditor({
  note,
  tags,
  draftTags,
  onTitleInput,
  onInput,
  onToggleTag,
  onOpenTagPicker,
  onDelete,
  onExtras,
  extrasCount,
}) {
  render(
    <main class="spa-editor" id="editor-pane">
      <div class="spa-editor-inner" data-hidden={!note()}>
        <input
          id="memo-title"
          class="spa-title"
          aria-label="メモのタイトル"
          maxlength="200"
          placeholder="無題"
          value={note()?.title ?? ""}
          onInput={onTitleInput}
        />
        <div class="spa-meta-row" aria-label="現在のタグ">
          {tags()
            .filter((tag) => draftTags().includes(tag.id))
            .map((tag) => (
              <span key={tag.id} class="spa-tag">
                <span>#{tag.name}</span>
                <button
                  type="button"
                  aria-label={`${tag.name}を外す`}
                  onClick={() => {
                    onToggleTag(tag.id);
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          <button class="spa-add-tag" type="button" onClick={onOpenTagPicker}>
            ＋ タグ
          </button>
        </div>
        <article
          id="memo-document"
          class="spa-doc"
          contenteditable="true"
          spellcheck="true"
          aria-label="メモ本文"
          onInput={onInput}
        ></article>
        <div class="spa-editor-footer">
          <button type="button" onClick={onExtras} data-hidden={extrasCount() === 0}>
            関連データ {extrasCount()}
          </button>
          <button type="button" onClick={onDelete}>
            メモを削除
          </button>
        </div>
      </div>
      <div class="spa-editor-empty" data-hidden={Boolean(note())}>
        <h2>メモを選択してください</h2>
        <p>左の一覧から選ぶか、新しいメモを作成してください。</p>
      </div>
      <EditorSelectionMenu />
      <EditorSummaryDialog />
      <div id="editor-crumb" class="editor-crumb" aria-live="polite"></div>
    </main>,
  );
}
