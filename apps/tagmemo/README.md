# TagMemo

irisout で画面を構築した、タグ付きメモのアプリ。メモ、タグ、名前、タグとの関連は Logos API の Entity と Component に保存する。別アプリが付けた Component は、単純な項目を編集できる場合に限りメモ編集画面の `n components` から開ける。

## 起動

PostgreSQL のデータベースを用意し、`apps/tagmemo` で次の環境変数を設定する。

```sh
export DATABASE_URL='postgres://localhost:5432/logos'
export TAGMEMO_USER_ID='00000000-0000-4000-8000-000000000001'
```

開発時は端末を２つ使う。API は 127.0.0.1:3001、画面は Vite+ の開発用アドレスで動く。

```sh
vp run api
```

```sh
vp dev
```

単一サーバーで起動する場合は `vp build` の後に `vp run start` を実行する。起動時に未適用のデータベース移行を適用する。

`TAGMEMO_USER_ID` はローカル試作用の固定利用者 ID。サーバーは 127.0.0.1 にだけ接続を受け付ける。利用者認証を備えた公開用構成では、Logos API の `authenticate` に認証済み ID を渡す必要がある。
