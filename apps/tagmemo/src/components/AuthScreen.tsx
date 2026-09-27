import { render } from "irisout";

export function AuthScreen({
  checking,
  user,
  mode,
  email,
  password,
  displayName,
  status,
  busy,
  onSubmit,
  onSwitch,
  onEmail,
  onPassword,
  onDisplayName,
}) {
  render(
    <div class="spa-auth-root" data-hidden={Boolean(user())}>
      <div class="auth-loading" data-hidden={!checking()}>
        ログイン状態を確認しています
      </div>
      <section class="auth-screen" data-hidden={checking()} aria-label="認証">
        <form class="auth-card" onSubmit={onSubmit}>
          <div class="spa-brand">TAGMEMO</div>
          <p class="eyebrow">LOGOS</p>
          <h1>{mode() === "signup" ? "アカウントを作成" : "ログイン"}</h1>
          <p class="auth-description">メモとタグを、あなたのアカウントに保存します。</p>
          <label for="auth-name" data-hidden={mode() !== "signup"}>
            名前
          </label>
          <input
            id="auth-name"
            type="text"
            autocomplete="name"
            required
            disabled={mode() !== "signup"}
            data-hidden={mode() !== "signup"}
            value={displayName()}
            onInput={(event) => {
              onDisplayName(event.currentTarget.value);
            }}
          />
          <label for="auth-email">メールアドレス</label>
          <input
            id="auth-email"
            type="email"
            autocomplete="email"
            required
            value={email()}
            onInput={(event) => {
              onEmail(event.currentTarget.value);
            }}
          />
          <label for="auth-password">パスワード</label>
          <input
            id="auth-password"
            type="password"
            autocomplete={mode() === "signup" ? "new-password" : "current-password"}
            minlength="8"
            required
            value={password()}
            onInput={(event) => {
              onPassword(event.currentTarget.value);
            }}
          />
          <p class="status" role="alert">
            {status()}
          </p>
          <button class="primary" type="submit" disabled={busy()}>
            {mode() === "signup" ? "登録する" : "ログイン"}
          </button>
          <button class="quiet auth-switch" type="button" onClick={onSwitch}>
            {mode() === "signup" ? "ログインに戻る" : "アカウントを作成"}
          </button>
        </form>
      </section>
    </div>,
  );
}
