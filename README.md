# Logos

Logos は、複数のアプリが同じ Entity に Component を追加して情報を共有する基盤。`packages/db` に SQLite の表、`packages/backend` に Logos API、`apps/logos` に共通の Hono サーバー、`apps/tagmemo` に irisout の画面を置く。

## 開発

Turso の接続情報と Better Auth の設定を `apps/logos/.dev.vars` に用意する。値の形式は [TagMemo の手順](apps/tagmemo/README.md)を参照。

```sh
vp install
vp dev
```

`http://localhost:5173/tagmemo/` が TagMemo、`http://localhost:5173/api/*` が共通 API。`vp dev` は一つの Logos Worker を起動し、要求のパスで画面と API を振り分ける。新しいアプリの画面は `apps/<アプリ名>/index.html` に置き、`apps/logos/vite.config.ts` の `build.rollupOptions.input` に追加する。初回 HTML に利用者のデータを埋め込む場合は `apps/logos/src/worker.ts` にそのアプリの画面経路を追加する。

## ビルドと配置

```sh
vp build
vp run @logos/server#deploy:check
vp run deploy
```

`vp build` は `apps/dist/client` に画面、`apps/dist/logos` に共通 Worker を生成する。`deploy:check` はアップロードを行わずに配置内容を検査する。配置前に Cloudflare の認証と Worker の環境変数を設定する。手順は [TagMemo の手順](apps/tagmemo/README.md)に記載する。
