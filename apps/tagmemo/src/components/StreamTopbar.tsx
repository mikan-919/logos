import { render } from "irisout";
import { Icon } from "./Icon.tsx";

export function StreamTopbar({
  title,
  dirty,
  busy,
  user,
  accountOpen,
  onLibrary,
  onSummary,
  onTags,
  onSave,
  onAccount,
  onLogout,
}) {
  render(
    <header class="stream-topbar">
      <div class="stream-top-left">
        <strong class="stream-brand">TAGMEMO</strong>
        <button type="button" onClick={onLibrary}>
          ライブラリ
        </button>
      </div>
      <span class="stream-current-title">{title()}</span>
      <div class="stream-top-right">
        <button class="stream-action" type="button" onClick={onSummary}>
          要約
        </button>
        <button class="stream-action" type="button" onClick={onTags}>
          タグ
        </button>
        <button class="stream-save" type="button" disabled={busy()} onClick={onSave}>
          {dirty() ? "保存" : "保存済み"}
        </button>
        <div class="stream-account">
          <button
            class="stream-account-button"
            type="button"
            aria-label="アカウント"
            aria-expanded={accountOpen()}
            onClick={onAccount}
          >
            <Icon name="userRound" />
          </button>
          <div class="stream-account-menu" data-hidden={!accountOpen()}>
            <p>{user()?.name ?? "アカウント"}</p>
            <small>{user()?.email ?? ""}</small>
            <button type="button" onClick={onLogout}>
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </header>,
  );
}
