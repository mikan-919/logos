# Logos

Logos は、複数のアプリが同じ Entity に Component を追加して情報を共有する基盤。`packages/db` に SQLite の表、`packages/backend` に Logos API、`apps/logos` に共通の API Worker、`apps/tagmemo` に画面用 Worker を置く。

## 開発

Turso の接続情報と Better Auth の設定を `apps/logos/.dev.vars` に用意する。値の形式は [TagMemo の手順](apps/tagmemo/README.md)を参照。

```sh
vp install
vp dev
```

`vp dev` は TagMemo Worker と Logos Worker を起動する。ブラウザには TagMemo Worker の `http://localhost:5173/tagmemo/` が公開され、`/api/*` はサービス結合を通じて Logos Worker に転送される。Logos Worker だけがデータベースに接続する。

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
