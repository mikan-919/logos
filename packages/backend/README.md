# Logos API

`createLogosApi({ db, authenticate })` は Hono のアプリを返す。呼び出し側が SQLite に接続した Kysely と認証処理を渡す。`authenticate` は検証済みの利用者 ID（UUID）とアプリ ID を返す。認証情報がない要求には 401 を返す。

| 操作               | 経路                                                       | 内容                                                                   |
| ------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| POST               | `/entities`                                                | Entity を作成し、作成者に閲覧・編集・管理権限を付ける                  |
| GET                | `/entities?has=logos.name,tasks.task&limit=100&after=UUID` | 指定した型をすべて持ち、閲覧できる Entity の ID を返す                 |
| GET / DELETE       | `/entities/:id`                                            | Component を含めて取得する / 削除する                                  |
| GET / POST         | `/component-types`                                         | 型定義を一覧表示する / JSON Schema を登録する                          |
| GET                | `/component-types/:key`                                    | 型定義を取得する                                                       |
| POST               | `/entities/:id/components`                                 | `{ "typeKey": "logos.name", "value": { "value": "設計" } }` を追加する |
| GET / PUT / DELETE | `/entities/:id/components/:key`                            | Component を取得・更新・削除する                                       |
| GET / POST         | `/entities/:id/permissions`                                | Entity の権限を一覧表示・追加する                                      |
| DELETE             | `/entities/:id/permissions/:userId/:permission`            | 権限を削除する                                                         |

Component は Entity と型の組につき１件。更新には現在の `revision` を文字列で渡す。削除には `?revision=1` を渡す。版が一致しない場合は 409 を返す。型定義の `ownerApp` は名前空間の帰属先で、登録者のアプリ ID と一致する必要はない。

Component の `value.entities` は参照先 Entity の UUID 配列。追加時に参照先の存在と閲覧権限を確認する。参照元を読める利用者には参照先 ID を返すが、参照先の取得には参照先自体の閲覧権限が必要。参照されている Entity の削除は 409 を返す。
