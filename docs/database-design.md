# Logos のデータベース設計

表と制約の実装は [Kysely の定義](../packages/db/src/schema.ts) と [初期移行](../packages/db/src/migrations/20260926_initial.ts) にある。保存形式は SQLite。開発時は端末内のファイルを使い、Turso の接続先も `@libsql/client` を通して扱う。アプリは Logos API を通じてデータを読む。

## 基本構造

| 表                   | 内容                                                 |
| -------------------- | ---------------------------------------------------- |
| `entities`           | 種類を固定しない Entity の ID と作成日時             |
| `users`              | Logos の権限が参照する利用者 ID                      |
| `permission_types`   | `read`、`write`、`manage` の権限種類                 |
| `entity_permissions` | Entity と利用者と権限種類の組                        |
| `component_types`    | Component 型の識別子、定義元アプリ、値の JSON Schema |
| `components`         | Entity と Component 型の組に対応する値と版番号       |

ID と日時は SQLite の `TEXT`、版番号は `INTEGER`。`component_types.schema` と `components.value` は JSON 文字列として `TEXT` に保存し、SQLite の JSON 関数で正しいオブジェクトか検査する。`components` の主キーは `(entity_id, type_key)` なので、同じ Entity に同じ型は一件だけ付く。型名は `tagmemo.memo` のようにアプリ間で一意にする。型の登録時に JSON Schema 自体を、値の書き込み時にその形式を Logos API が検証する。

Entity を作ると作成者に三種類の権限を付ける。Component の閲覧・編集は所属 Entity の権限に従う。権限の付与は `entity_permissions` に一種類ずつ保存する。アプリの見た目や、画面の `[n components]` に含める型はデータベースに保存せず、表示するアプリが決める。

`revision` は Component の更新競合を検出する番号。更新・削除の要求には読み取った版番号を渡し、現在の番号と一致したときだけ変更する。一致しなければ API は 409 を返す。

## Entity 参照

Component の `value.entities` を参照先 Entity ID の配列として予約する。例: `{"entities":["参照先の UUID"]}`。API は参照先の存在と閲覧権限を確認する。参照元を読める利用者には参照先の ID を返す。参照先の内容を取得するときは、その Entity の閲覧権限を改めて確認する。

SQLite のトリガーは参照先が存在しない値の挿入・更新と、参照されている Entity の削除を拒否する。トリガーはデータベース内で参照の整合性を守る処理。逆引きには `json_each(value, '$.entities')` を使う。検索が遅くなった場合は参照の索引を別途設計する。

## 認証

TagMemo は Better Auth のメールアドレスとパスワードによる認証を使う。Better Auth の利用者 ID は UUID とし、Logos の `users.id` に同じ ID を登録する。認証用の `user`、`session`、`account`、`verification` 表は Better Auth の移行処理が作成する。TagMemo のサーバーは要求のセッションを検証してから、利用者 ID とアプリ ID を Logos API に渡す。権限の判断は Logos API が行う。

## 未決事項

- Component 型の定義変更時に既存の値を移行する方法。
- Entity 参照の逆引きが増えたときの索引。
