import { render } from "irisout";
import { Icon } from "./Icon.tsx";

export function EditorSelectionMenu() {
  render(
    <div id="selection-menu" class="selection-menu" role="toolbar" aria-label="選択範囲の編集">
      <button type="button" class="primary" data-editor-action="summarize">
        要約
      </button>
      <button type="button" data-editor-command="bold" aria-label="太字">
        <Icon name="bold" />
      </button>
      <button type="button" data-editor-command="italic" aria-label="斜体">
        <Icon name="italic" />
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
