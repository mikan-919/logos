import { render } from "irisout";
import { Icon } from "./Icon.tsx";

function TagStateRow({ tag, onState }) {
  render(
    <div key={tag.id} class="stream-tag-state-row" data-state={tag.state}>
      <div class="stream-tag-state-main">
        <div>
          <strong>#{tag.name}</strong>
          <span>
            {tag.state === "on"
              ? "オン"
              : tag.state === "off"
                ? "オフ"
                : `${Math.round(tag.score * 100)}%`}
          </span>
        </div>
        <div
          class="stream-tag-confidence"
          style={`--p:${Math.round((tag.state === "on" ? 1 : tag.state === "off" ? 0 : tag.score) * 100)}`}
        >
          <span></span>
        </div>
      </div>
      <div class="stream-tag-state-controls" role="group" aria-label={`${tag.name}の状態`}>
        <button
          class={tag.state === "off" ? "active" : ""}
          type="button"
          title="オフ"
          aria-label={`${tag.name}をオフ`}
          onClick={() => onState(tag, "off")}
        >
          <Icon name="x" />
        </button>
        <button
          class={tag.state === "auto" ? "active" : ""}
          type="button"
          title="自動"
          aria-label={`${tag.name}を自動`}
          onClick={() => onState(tag, "auto")}
        >
          <Icon name="sparkles" />
        </button>
        <button
          class={tag.state === "on" ? "active" : ""}
          type="button"
          title="オン"
          aria-label={`${tag.name}をオン`}
          onClick={() => onState(tag, "on")}
        >
          <Icon name="check" />
        </button>
      </div>
    </div>,
  );
}

export function TagStateDrawer({ open, note, candidates, onClose, onState }) {
  render(
    <div
      class="stream-tag-backdrop"
      data-hidden={!open()}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        class={open() ? "stream-tag-drawer open" : "stream-tag-drawer"}
        aria-label="メモのタグ"
        aria-hidden={!open()}
      >
        <header>
          <strong>現在のメモのタグ</strong>
          <button type="button" aria-label="閉じる" onClick={onClose}>
            <Icon name="x" />
          </button>
        </header>
        <div class="stream-tag-drawer-body">
          <div class="stream-tag-state-card">
            <div class="stream-tag-state-head">
              <div>
                <h2>タグ</h2>
                <p>オフ・自動・オンを一覧で管理します。</p>
              </div>
              <small>オフ　自動　オン</small>
            </div>
            {candidates().map((tag) => (
              <TagStateRow key={tag.id} tag={tag} onState={onState} />
            ))}
            <p class="stream-tag-empty" data-hidden={Boolean(note())}>
              メモを選択してください。
            </p>
            <p class="stream-tag-empty" data-hidden={!note() || candidates().length !== 0}>
              タグはありません。
            </p>
          </div>
        </div>
      </aside>
    </div>,
  );
}
