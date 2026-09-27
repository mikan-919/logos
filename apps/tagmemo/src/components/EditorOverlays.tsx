import { render } from "irisout";
import { Icon } from "./Icon.tsx";

export function EditorSelectionMenu() {
  render(
    <div
      id="selection-menu"
      class="selection-menu fixed z-20 hidden gap-[5px] rounded-[14px] border border-[#3a3a3a] bg-[#2a2a2a] p-[6px] shadow-[0_16px_48px_#0007] [&.show]:flex"
      role="toolbar"
      aria-label="選択範囲の編集"
    >
      <button
        type="button"
        class="h-8 rounded-[9px] bg-[var(--accent)] px-[10px] text-[11px]! font-semibold text-[#111]!"
        data-editor-action="summarize"
      >
        要約
      </button>
      <button
        type="button"
        class="h-8 rounded-[9px] bg-[#353535] px-[10px] text-[11px]! text-[var(--text)]! hover:bg-[#414141]"
        data-editor-command="bold"
        aria-label="太字"
      >
        <Icon name="bold" />
      </button>
      <button
        type="button"
        class="h-8 rounded-[9px] bg-[#353535] px-[10px] text-[11px]! text-[var(--text)]! hover:bg-[#414141]"
        data-editor-command="italic"
        aria-label="斜体"
      >
        <Icon name="italic" />
      </button>
    </div>,
  );
}

export function EditorSummaryDialog() {
  render(
    <div
      id="summary-modal"
      class="summary-modal fixed inset-0 z-30 hidden place-items-center bg-black/50 backdrop-blur-[5px] [&.show]:grid"
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-label"
    >
      <div class="summary-dialog w-[calc(100vw-28px)] max-w-[520px] rounded-3xl border border-[#383838] bg-[#252525] p-[14px] shadow-[0_28px_90px_#0009]">
        <div class="summary-dialog-inner rounded-2xl bg-[#1d1d1d] p-[14px]">
          <label
            id="summary-label"
            class="mb-2 block text-[10px] tracking-[0.12em] text-[var(--muted)] uppercase"
            for="summary-input"
          >
            要約
          </label>
          <input
            id="summary-input"
            class="h-11 w-full rounded-[11px] bg-[#292929]! px-3 text-[var(--text)]!"
            placeholder="この範囲を一言で…"
            autocomplete="off"
          />
          <div
            class="selection-preview mt-[10px] max-h-[150px] overflow-auto rounded-[11px] bg-[#222] px-3 py-[10px] text-[11px] leading-[1.55] whitespace-pre-wrap text-[var(--muted)]"
            id="selection-preview"
          ></div>
        </div>
        <div class="summary-actions mt-3 flex justify-end gap-2">
          <button
            type="button"
            class="h-9 rounded-[10px] bg-[#343434] px-3 text-[var(--text)]!"
            data-editor-action="cancel"
          >
            キャンセル
          </button>
          <button
            type="button"
            class="commit h-9 rounded-[10px] bg-[var(--accent)] px-3 font-semibold text-[#111]!"
            data-editor-action="create"
          >
            作成
          </button>
        </div>
      </div>
    </div>,
  );
}
