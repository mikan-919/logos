import { render } from "irisout";

export function SpaTopbar({
  search,
  onSearch,
  onToggleList,
  onSave,
  onSummarize,
  onTags,
  onNew,
  onLogout,
  showingTags,
  busy,
  dirty,
}) {
  render(
    <header class="spa-topbar">
      <button
        class="spa-topbtn spa-list-toggle"
        type="button"
        aria-label="メモ一覧を開閉"
        onClick={onToggleList}
      >
        ☰
      </button>
      <label class="spa-search">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          placeholder="メモとタグを検索"
          value={search()}
          onInput={(event) => {
            onSearch(event.currentTarget.value);
          }}
        />
      </label>
      <div class="spa-topspacer"></div>
      <button class="spa-topbtn spa-mobile-new" type="button" onClick={onNew}>
        ＋
      </button>
      <button
        class="spa-topbtn spa-desktop-action"
        type="button"
        data-hidden={showingTags()}
        onClick={onSummarize}
      >
        要約
      </button>
      <button
        class="spa-topbtn spa-desktop-action"
        type="button"
        data-hidden={showingTags()}
        onClick={onTags}
      >
        タグ
      </button>
      <button class="spa-topbtn spa-desktop-action" type="button" onClick={onLogout}>
        ログアウト
      </button>
      <button
        class="spa-topbtn primary"
        type="button"
        data-hidden={showingTags()}
        disabled={busy()}
        onClick={onSave}
      >
        {dirty() ? "保存" : "保存済み"}
      </button>
    </header>,
  );
}
