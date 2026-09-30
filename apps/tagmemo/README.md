# TagMemo

irisout で構築したメモのアプリ。メモ、タグ、名前、メモと全タグの該当確率を Logos API の Entity と Component に保存する。別アプリが付けた Component は、単純な項目を編集できる場合に限り、メモ編集画面の `n components` から開ける。

メモの編集画面では文章の一部を選んで要約を付けられる。要約を開くと元の文章が同じ位置に表示される。本文の HTML と一覧・検索用の文章は `tagmemo.memo` の `body` 文字列に保存する。従来のプレーンテキストのメモも編集できる。タグペインは保存済みの確率表を表示するだけで、開閉、ページの再読み込み後の表示、メモの切り替え、タグの作成では Jev を呼び出さない。画面を開いている間は前回の推定に使った題名・本文（未推定なら編集前の内容）を保持し、保存時に累積で100文字以上変わった場合だけ TagMemo Worker が Jev に送って確率表を更新する。

タグビューにはLogosの `tagmemo.tag` エンティティを全件、名前順で表示する。確率によってタグを隠さず、検索した場合だけ一覧を絞る。メモごとに `tagmemo.tag-scores` の `scores` に全タグの `{ id, score }` を保存し、確率は0〜1で表す。参照用の `entities` も全タグのIDを含む。タグが未記録なら確率0として表を補い、保存時には現在の全タグを記録する。

50%以上は「タグが該当する」という表示・検索の判定であり、付与済みタグの集合は保存しない。タイトル直下には該当するタグを `#タグ名` で表示する。手動オンは確率を1（100%）、オフは0（0%）に書き換え、別の手動・自動状態は持たない。確率の変更は自動保存する。Jev推定は確率0%・100%のタグも含めた全タグが対象で、100件を超える場合は分割して取得し、確率表を更新する。推定待ちの間に手動変更した値は、その推定応答より優先する。

旧 `tagmemo.tags` と `tagmemo.tag-states` は、読込時にオンを1、オフを0、自動を保存済み確率として確率表へ変換する。読込だけでは保存データを変更せず、次回保存時に確率表を記録して旧Componentを削除する。タグ統合では両タグの確率の大きい方を残す。

常設の操作は下部のライブラリ・タグ・新しいメモにまとめる。要約は本文を選択したときのメニューから作成する。上部の保存ボタンは未保存の変更があるときだけ表示し、変更がないときは「保存済み」を状態表示する。

ログイン済みの初回 HTML には、その利用者が閲覧できるメモとタグを TagMemo Worker が Logos API から取得して埋め込む。画面の読み込み後は irisout が操作を引き継ぐ。追加、保存、削除はすぐ画面に反映し、API が失敗した場合は元に戻す。

## 開発

Turso でデータベースと認証トークンを用意する。`apps/logos/.dev.vars.example` を `apps/logos/.dev.vars` にコピーし、四つの必須値を設定する。`BETTER_AUTH_URL` はブラウザで開く TagMemo のオリジン（例: `http://localhost:5173`）にする。別ホストのアプリを追加する場合は、そのホストを `BETTER_AUTH_ALLOWED_HOSTS` にカンマ区切りで設定する。`.dev.vars` は Git の管理対象外。TagMemo Worker にデータベースの接続情報は設定しない。

タグ推定を使う場合は `apps/tagmemo/.dev.vars` に `TYPESAFE_API_KEY` を設定する。値は TypeSafe AI の API 鍵。LogosとTagMemoのWorkerは別々の環境変数を読み込むため、`apps/logos/.dev.vars` にだけ設定しても推定には使えない。鍵がない場合、タグ推定は利用できない。設定後は開発サーバーを再起動する。リポジトリのルートで起動する。

推定前の認証確認では、本文のないGETにCookieとAuthorizationだけを引き継ぐ。推定POSTのContent-TypeやContent-Lengthは転送しない。Logosが失敗した場合、TagMemoは502と `Logosの認証確認に失敗しました (元のHTTPステータス)` を返し、LogosのJSON応答にmessageがあれば詳細も表示する。この場合はJevへのリクエストは送信していないため、Logos Worker側のエラーを確認する。

```sh
vp install
vpr dev
```

`vpr dev` は Logos Worker と TagMemo を順に起動する。別々に起動する場合は、二つの端末で次を実行する。

```sh
vp run @logos/server#dev
```

```sh
vp dev
```

Logos Worker は `http://localhost:8787/`、TagMemo の画面は `http://localhost:5173/` で動く。画面からの `/api/*` は TagMemo Worker がサービス結合を使って Logos Worker に転送する。以前の `/tagmemo/` は `/` に転送する。登録画面から利用者を作成できる。

`vpr dev` は `NODE_EXTRA_CA_CERTS` が未設定なら、`SSL_CERT_FILE` または Linux の認証局ファイルを Worker に渡す。証明書が信頼できないというエラーが続く環境では、`NODE_EXTRA_CA_CERTS=/path/to/ca.pem vpr dev` の形でその環境の認証局ファイルを指定する。

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
