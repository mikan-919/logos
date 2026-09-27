import { render } from "irisout";

export function EditorToolbar() {
  render(
    <div class="wysiwyg-toolbar" role="toolbar" aria-label="本文の編集">
      <button type="button" class="tool primary" data-editor-action="summarize">
        要約
      </button>
      <div class="sep"></div>
      <button type="button" class="tool" data-editor-command="bold" aria-label="太字">
        <b>B</b>
      </button>
      <button type="button" class="tool" data-editor-command="italic" aria-label="斜体">
        <i>I</i>
      </button>
      <button type="button" class="tool hide-small" data-editor-command="h1">
        見出し1
      </button>
      <button type="button" class="tool hide-small" data-editor-command="h2">
        見出し2
      </button>
      <div class="spacer"></div>
      <button type="button" class="tool" data-editor-action="expand">
        全展開
      </button>
      <button type="button" class="tool" data-editor-action="collapse">
        全収納
      </button>
    </div>,
  );
}

export function EditorSelectionMenu() {
  render(
    <div id="selection-menu" class="selection-menu" role="toolbar" aria-label="選択範囲の編集">
      <button type="button" class="primary" data-editor-action="summarize">
        要約
      </button>
      <button type="button" data-editor-command="bold" aria-label="太字">
        <b>B</b>
      </button>
      <button type="button" data-editor-command="italic" aria-label="斜体">
        <i>I</i>
      </button>
    </div>,
  );
}

export function EditorSummaryDialog() {
  render(
    <div
      id="summary-modal"
      class="summary-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-label"
    >
      <div class="summary-dialog">
        <div class="summary-dialog-inner">
          <label id="summary-label" for="summary-input">
            要約
          </label>
          <input id="summary-input" placeholder="この範囲を一言で…" autocomplete="off" />
          <div class="selection-preview" id="selection-preview"></div>
        </div>
        <div class="summary-actions">
          <button type="button" data-editor-action="cancel">
            キャンセル
          </button>
          <button type="button" class="commit" data-editor-action="create">
            作成
          </button>
        </div>
      </div>
    </div>,
  );
}

export function WysiwygEditor({ onSave, onClose }) {
  render(
    <div class="wysiwyg-app">
      <header class="wysiwyg-top">
        <div class="wysiwyg-brand">TAGMEMO</div>
        <div class="wysiwyg-topright">
          <span class="badge">文章編集</span>
          <button id="memo-editor-close" type="button" class="tool" onClick={onClose}>
            閉じる
          </button>
          <button id="memo-editor-save" type="button" class="tool primary" onClick={onSave}>
            保存
          </button>
        </div>
      </header>
      <section class="wysiwyg-sheet">
        <EditorToolbar />
        <article
          id="memo-document"
          class="wysiwyg-doc"
          contenteditable="true"
          spellcheck="true"
          aria-label="メモ本文"
        >
          <h1 id="memo-document-title">無題</h1>
          <p></p>
        </article>
      </section>
      <EditorSelectionMenu />
      <EditorSummaryDialog />
      <div id="editor-crumb" class="editor-crumb" aria-live="polite"></div>
    </div>,
  );
}
