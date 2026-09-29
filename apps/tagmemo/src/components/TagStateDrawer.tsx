import { derived, render } from "irisout";
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

export function TagStateDrawer({
  open,
  note,
  candidates,
  inferring,
  query,
  busy,
  onClose,
  onState,
  onCreateTag,
}) {
  const tagName = derived(() => query().trim().replace(/^#/, ""));
  const exactTag = derived(() =>
    candidates().find((tag) => tag.name.toLocaleLowerCase() === tagName().toLocaleLowerCase()),
  );
  const visibleTags = derived(() =>
    candidates().filter((tag) =>
      tag.name.toLocaleLowerCase().includes(tagName().toLocaleLowerCase()),
    ),
  );
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
            <form
              class="stream-tag-search"
              onSubmit={(event) => {
                event.preventDefault();
                const name = tagName();
                if (!name || busy()) return;
                const existing = exactTag();
                if (existing) {
                  onState(existing, "on");
                  query("");
                } else {
                  onCreateTag(name);
                }
              }}
            >
              <label for="tag-drawer-search">タグを検索・追加</label>
              <div>
                <input
                  id="tag-drawer-search"
                  type="search"
                  maxlength="100"
                  autocomplete="off"
                  disabled={!note()}
                  value={query()}
                  onInput={(event) => query(event.currentTarget.value)}
                />
                <button type="submit" disabled={!note() || !tagName() || busy()}>
                  {exactTag() ? "付ける" : "作成"}
                </button>
              </div>
            </form>
            <div class="stream-tag-state-head">
              <div>
                <h2>タグ</h2>
                <p>既存のタグを選び、オンにするとメモに付きます。</p>
              </div>
              <small>オフ　自動　オン</small>
            </div>
            {visibleTags().map((tag) => (
              <TagStateRow key={tag.id} tag={tag} onState={onState} />
            ))}
            <p class="stream-tag-empty" data-hidden={!inferring()}>
              タグを推定しています。
            </p>
            <p class="stream-tag-empty" data-hidden={Boolean(note())}>
              メモを選択してください。
            </p>
            <p
              class="stream-tag-empty"
              data-hidden={!note() || candidates().length !== 0 || Boolean(tagName())}
            >
              タグはありません。
            </p>
            <p
              class="stream-tag-empty"
              data-hidden={!note() || !tagName() || visibleTags().length !== 0}
            >
              一致するタグはありません。作成するとこのメモに付きます。
            </p>
          </div>
        </div>
      </aside>
    </div>,
  );
}
