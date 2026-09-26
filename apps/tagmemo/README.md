# TagMemo

irisout で構築したタグ付きメモのアプリ。メモ、タグ、名前、タグとの関連は Logos API の Entity と Component に保存する。別アプリが付けた Component は、単純な項目を編集できる場合に限りメモ編集画面の `n components` から開ける。

## 起動

`apps/tagmemo` で認証用の環境変数を設定する。`BETTER_AUTH_URL` は画面を開く側の URL。開発時は Vite+ の表示アドレスに合わせる。`BETTER_AUTH_SECRET` には推測されにくい長い文字列を設定する。

```sh
export BETTER_AUTH_URL='http://localhost:5173'
export BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
```

保存先を省略すると `./tagmemo.db` という SQLite ファイルを使う。Turso に接続するときは接続先と認証トークンを追加する。

```sh
export TURSO_DATABASE_URL='libsql://<database-host>'
export TURSO_AUTH_TOKEN='<token>'
```

開発時は端末を二つ使う。API は `127.0.0.1:3001`、画面は Vite+ の表示アドレスで動く。

```sh
vp run api
```

```sh
vp dev
```

ログイン画面から利用者を登録し、メールアドレスとパスワードでログインできる。単一サーバーで起動するときは、`vp build` の後に `BETTER_AUTH_URL=http://127.0.0.1:3000 vp run start` を実行する。起動時に Better Auth と Logos の未適用の移行を実行する。サーバーは `127.0.0.1` に接続を受け付ける。
