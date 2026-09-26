# Logos

Logos は、複数のアプリが同じ Entity に Component を追加して情報を共有する基盤。`packages/db` に SQLite の表、`packages/backend` に Logos API、`apps/tagmemo` に irisout の画面と Cloudflare Worker を置く。

## TagMemo を起動する

Turso の接続情報と Better Auth の設定を `apps/tagmemo/.dev.vars` に用意する。値の形式は [TagMemo の手順](apps/tagmemo/README.md)を参照。

```sh
vp install
vp dev
```

画面と API は `http://localhost:5173` で動く。別のアプリ `apps/website` を起動するときは `vp run website` を使う。

## ビルドと配置

```sh
vp build
vp run tagmemo#deploy:check
vp run deploy
```

`vp build` は TagMemo の画面と Worker を生成する。`deploy:check` はアップロードを行わずに配置内容を検査する。配置前に Cloudflare の認証と Worker の環境変数を設定する。手順は [TagMemo の手順](apps/tagmemo/README.md)に記載する。
