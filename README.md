# Logos

Logos は、複数のアプリが同じ Entity に Component を追加して情報を共有する基盤。`packages/db` に SQLite の表、`packages/backend` に Logos API、`apps/logos` に共通の API Worker、`apps/tagmemo` に画面用 Worker を置く。

## 開発

Turso の接続情報と Better Auth の設定を `apps/logos/.dev.vars` に用意する。値の形式は [TagMemo の手順](apps/tagmemo/README.md)を参照。

```sh
vp install
vpr dev
```

`vpr dev` は Logos Worker を 8787 番で起動してから TagMemo を 5173 番で起動する。別々に起動する場合は、二つの端末で次を実行する。

```sh
vp run @logos/server#dev
```

```sh
vp dev
```

Logos Worker は `http://localhost:8787/`、TagMemo は `http://localhost:5173/` で動く。TagMemo の `/api/*` はサービス結合を通じて 8787 番で動く Logos Worker に届く。Logos Worker だけがデータベースに接続する。`vp build` では両 Worker をまとめてビルドする。

## MCP

Logos Worker の `/mcp` は HTTP の MCP 接続先。開発時は上記の `vp run @logos/server#dev` で起動した `http://localhost:8787/mcp` に接続する。

Cloudflare の公開接続先は `https://logos.mikan-919.workers.dev/mcp`。TagMemo の画面は `https://logos-tagmemo.mikan-919.workers.dev/`。

既存の Better Auth セッションを使うため、MCP クライアントには Logos にログインした際の `Cookie` ヘッダーを設定する。セッションがない要求は 401 を返す。

Codex、fx、OMP の利用者設定には公開接続先を登録する。TagMemo にログイン後、ブラウザの Cookie ヘッダー全体を `LOGOS_MCP_COOKIE` 環境変数に入れ、各クライアントを再起動する。セッションが失効した場合は Cookie を更新する。資格情報は設定ファイルやリポジトリに保存しない。

`list_entities`、`get_entity`、`create_entity`、`delete_entity`、`list_component_types`、`register_component_type`、`add_component`、`update_component`、`delete_component` を公開する。Component の変更と削除には、取得結果の `revision` を渡す。操作には Logos API と同じ権限判定が適用される。

## ビルドと配置

```sh
vp build
vp run @logos/server#deploy:check
vp run tagmemo#deploy:check
vp run deploy
```

`vp build` は `apps/dist/logos` に API Worker、`apps/dist/logos_tagmemo` に画面用 Worker、`apps/dist/client` に画面ファイルを生成する。初回配置では Logos Worker を先に配置する。以後は変更した Worker だけを配置できる。

```sh
vp run deploy:logos
vp run deploy:tagmemo
```

新しいアプリは独立した Worker と画面のビルドを持ち、その Worker の `services` に `{"binding":"LOGOS","service":"logos"}` を設定する。API 要求をこの結合へ転送すれば、同じ Logos Worker を使用できる。認証を使うアプリの公開ホストは Logos Worker の `BETTER_AUTH_ALLOWED_HOSTS` に追加する。配置前の認証と環境変数の設定は [TagMemo の手順](apps/tagmemo/README.md)に記載する。
