# TagMemo

irisout で構築したタグ付きメモのアプリ。メモ、タグ、名前、タグとの関連を Logos API の Entity と Component に保存する。別アプリが付けた Component は、単純な項目を編集できる場合に限り、メモ編集画面の `n components` から開ける。

## 開発

Turso でデータベースと認証トークンを用意する。`apps/tagmemo/.dev.vars.example` を `apps/tagmemo/.dev.vars` にコピーし、四つの値を設定する。`BETTER_AUTH_URL` はブラウザで開く URL と一致させる。`.dev.vars` は Git の管理対象外。

リポジトリのルートで起動する。

```sh
vp install
vp dev
```

`http://localhost:5173` で画面と API が同時に動く。Cloudflare の Vite 連携が Worker の API を開発環境で実行する。登録画面から利用者を作成できる。SQLite ファイルを使う単独の Bun サーバーは `apps/tagmemo` で `BETTER_AUTH_URL` と `BETTER_AUTH_SECRET` を設定し、`vp run start` で起動する。

Linux では開発用 Worker に OS の認証局一覧を読み込ませる。証明書が信頼できないというエラーが続く環境では、`NODE_EXTRA_CA_CERTS` にその環境の認証局一覧ファイルを指定してから `vp dev` を実行する。

## Cloudflare Workers への配置

`apps/tagmemo/wrangler.jsonc` の `name` を配置先の Worker 名に合わせる。Cloudflare のアカウントで Wrangler にログインし、Worker に四つの環境変数を登録する。`BETTER_AUTH_URL` には公開する URL（例: `https://logos-tagmemo.<subdomain>.workers.dev`）を指定する。値は対話入力で渡し、ソースコードには保存しない。

```sh
cd apps/tagmemo
vp exec wrangler login
vp exec wrangler secret put TURSO_DATABASE_URL --config wrangler.jsonc
vp exec wrangler secret put TURSO_AUTH_TOKEN --config wrangler.jsonc
vp exec wrangler secret put BETTER_AUTH_URL --config wrangler.jsonc
vp exec wrangler secret put BETTER_AUTH_SECRET --config wrangler.jsonc
```

リポジトリのルートに戻り、画面と Worker をビルドして確認し、配置する。

```sh
vp build
vp run tagmemo#deploy:check
vp run deploy
```

`vp build` は `apps/tagmemo/dist/client` と `apps/tagmemo/dist/logos_tagmemo` を生成する。配置コマンドはビルド済みの Worker 設定を使い、画面のファイルも一緒にアップロードする。Worker は最初の API 要求時に Better Auth と Logos のデータベース移行を実行する。Cloudflare への実配置には Cloudflare の認証と Turso の接続情報が必要。
