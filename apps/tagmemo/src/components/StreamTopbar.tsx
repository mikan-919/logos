import { render } from "irisout";
import { Icon } from "./Icon.tsx";

export function StreamTopbar({
  title,
  dirty,
  busy,
  user,
  accountOpen,
  onSave,
  onAccount,
  onLogout,
}) {
  render(
    <header class="stream-topbar">
      <div class="stream-top-left">
        <strong class="stream-brand">TAGMEMO</strong>
      </div>
      <span class="stream-current-title">{title()}</span>
      <div class="stream-top-right">
        {dirty() ? (
          <button class="stream-save" type="button" disabled={busy()} onClick={onSave}>
            保存
          </button>
        ) : (
          <span class="stream-saved">保存済み</span>
        )}
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
