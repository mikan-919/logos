# TagMemo

irisout で構築したタグ付きメモのアプリ。メモ、タグ、名前、タグとの関連を Logos API の Entity と Component に保存する。別アプリが付けた Component は、単純な項目を編集できる場合に限り、メモ編集画面の `n components` から開ける。

メモの編集画面では文章の一部を選んで要約を付けられる。要約を開くと元の文章が同じ位置に表示される。本文の HTML と一覧・検索用の文章は `tagmemo.memo` の `body` 文字列に保存する。従来のプレーンテキストのメモも編集できる。タグ一覧を開くと、TagMemo Worker がメモの題名と本文を Jev に送り、既存タグごとの該当確率を表示する。画面を開いている間は前回の推定に使った題名・本文を保持し、保存時に累積で100文字以上変わったら再推定する。

ログイン済みの初回 HTML には、その利用者が閲覧できるメモとタグを TagMemo Worker が Logos API から取得して埋め込む。画面の読み込み後は irisout が操作を引き継ぐ。追加、保存、削除はすぐ画面に反映し、API が失敗した場合は元に戻す。

## 開発

Turso でデータベースと認証トークンを用意する。`apps/logos/.dev.vars.example` を `apps/logos/.dev.vars` にコピーし、四つの必須値を設定する。`BETTER_AUTH_URL` はブラウザで開く TagMemo のオリジン（例: `http://localhost:5173`）にする。別ホストのアプリを追加する場合は、そのホストを `BETTER_AUTH_ALLOWED_HOSTS` にカンマ区切りで設定する。`.dev.vars` は Git の管理対象外。TagMemo Worker にデータベースの接続情報は設定しない。

タグ推定を使う場合は `apps/tagmemo/.dev.vars` に `TYPESAFE_API_KEY` を設定する。値は TypeSafe AI の API 鍵。鍵がない場合、タグ推定は利用できない。リポジトリのルートで起動する。

```sh
vp install
vp dev
```

`http://localhost:5173/` で画面が、同じポートの `/api/*` で Logos API が動く。以前の `/tagmemo/` は `/` に転送する。TagMemo Worker がサービス結合を使って Logos Worker に要求を転送する。登録画面から利用者を作成できる。

Linux では開発用 Worker に OS の認証局一覧を読み込ませる。証明書が信頼できないというエラーが続く環境では、`NODE_EXTRA_CA_CERTS` にその環境の認証局一覧ファイルを指定してから `vp dev` を実行する。

## Cloudflare Workers への配置

`apps/logos/wrangler.jsonc` と `apps/tagmemo/wrangler.jsonc` の `name` を配置先の Worker 名に合わせる。TagMemo の `services[].service` には Logos Worker の名前を指定する。Cloudflare のアカウントで Wrangler にログインし、Logos Worker に四つの必須環境変数を登録する。`BETTER_AUTH_URL` には公開する TagMemo のオリジン（例: `https://logos-tagmemo.<subdomain>.workers.dev`）を指定する。値は対話入力で渡し、ソースコードには保存しない。

```sh
cd apps/logos
vp exec wrangler login
vp exec wrangler secret put TURSO_DATABASE_URL --config wrangler.jsonc
vp exec wrangler secret put TURSO_AUTH_TOKEN --config wrangler.jsonc
vp exec wrangler secret put BETTER_AUTH_URL --config wrangler.jsonc
vp exec wrangler secret put BETTER_AUTH_SECRET --config wrangler.jsonc
```

別ホストのアプリを追加する場合は、`apps/logos` で `vp exec wrangler secret put BETTER_AUTH_ALLOWED_HOSTS --config wrangler.jsonc` を実行し、ホスト名をカンマ区切りで登録する。リポジトリのルートに戻り、両 Worker をビルドして配置する。初回はサービス結合の接続先である Logos Worker を先に配置する。

タグ推定を使う場合は、TagMemo Worker にも API 鍵を登録する。

```sh
cd apps/tagmemo
vp exec wrangler secret put TYPESAFE_API_KEY --config wrangler.jsonc
```

```sh
vp build
vp run @logos/server#deploy:check
vp run tagmemo#deploy:check
vp run deploy:logos
vp run deploy:tagmemo
```

以後、TagMemo のみ変更した場合は `vp build` の後に `vp run deploy:tagmemo` だけを実行する。ビルド成果物は `apps/dist/logos`、`apps/dist/logos_tagmemo`、`apps/dist/client` に分かれる。Cloudflare への実配置には Cloudflare の認証と Turso の接続情報が必要。
