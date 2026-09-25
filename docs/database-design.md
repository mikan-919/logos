# Logos のデータベース設計案

Kysely の型定義は [packages/db/src/schema.ts](../packages/db/src/schema.ts)、初期移行は [packages/db/src/migrations/20260926_initial.ts](../packages/db/src/migrations/20260926_initial.ts) に置く。以下の SQL は、その表構造を読むための表記。

## 確定した条件

- PostgreSQL に保存し、アプリは Logos の API を通して読む。
- Entity は識別子を持ち、固定の種類を持たない。
- 各アプリは Component 型を定義し、任意の Entity に追加できる。
- Component 型の値の形式を Logos に登録し、書き込み時に API で検証する。
- 1つの Entity に付けられる同じ型の Component は1件。
- 同じ Entity を複数アプリが利用する。画面構成と、Component 一覧に出す項目はアプリが決める。
- 複数の利用者が共同編集し、閲覧・編集権限は Entity ごとに決める。

## 基本構造

| 表                   | 役割                                                      |
| -------------------- | --------------------------------------------------------- |
| `entities`           | Entity の識別子を保持する。                               |
| `users`              | 利用者の識別子を保持する。認証方法はこの表に固定しない。  |
| `permission_types`   | 権限の種類を保持する。                                    |
| `entity_permissions` | Entity と利用者に付与された権限を保持する。               |
| `component_types`    | アプリが定義した Component 型の識別子と定義元を保持する。 |
| `components`         | Entity と Component 型の組ごとに値を1件保持する。         |

```sql
CREATE TABLE entities (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY
);

CREATE TABLE permission_types (
  key text PRIMARY KEY
);

INSERT INTO permission_types (key) VALUES ('read'), ('write'), ('manage');

CREATE TABLE entity_permissions (
  entity_id uuid NOT NULL REFERENCES entities (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES permission_types (key),
  PRIMARY KEY (entity_id, user_id, permission_key)
);

CREATE INDEX entity_permissions_by_user
  ON entity_permissions (user_id, permission_key, entity_id);

CREATE TABLE component_types (
  key text PRIMARY KEY,
  owner_app text NOT NULL,
  schema jsonb NOT NULL CHECK (jsonb_typeof(schema) = 'object')
);

CREATE TABLE components (
  entity_id uuid NOT NULL REFERENCES entities (id) ON DELETE CASCADE,
  type_key text NOT NULL REFERENCES component_types (key),
  value jsonb NOT NULL CHECK (jsonb_typeof(value) = 'object'),
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_id, type_key)
);

CREATE INDEX components_by_type ON components (type_key, entity_id);
```

`component_types.key` はアプリ間で一意にする。例は `logos.name`、`tasks.task`、`calendar.event`。`schema` には、型の値の形式を [JSON Schema 2020-12](https://json-schema.org/draft/2020-12) で登録する案とする。API は型登録時に定義そのものを、Component の書き込み時に値を検証する。`components` の主キーは、同じ Entity と型の組を重複させない。`revision` は、別のアプリが同じ値を先に更新したとき、その更新を上書きしないために API が照合する番号。

権限の種類は `permission_types` に置き、付与は `entity_permissions` に「Entity、利用者、権限」を1行ずつ保存する。`read` は閲覧、`write` は編集、`manage` は権限変更を表す。1人が同じ Entity に複数の権限を持てる。Component は所属する Entity の権限を引き継ぐ。Entity 作成と、作成者への3種類の権限付与は同じトランザクションで行う。`write` と `manage` の付与には `read` も必要とする。権限変更時には対象 Entity をロックし、最後の `manage` を取り消せないよう API で検査する。アプリは PostgreSQL に直接接続しない。

`value` は Component ごとの項目を含む。例えば `tasks.task` の値は `{"status":"todo","due":"2026-09-27"}`。空の目印は `{}` で表せる。型ごとの項目と値の検証は、登録された `schema` を使って API が行う。PostgreSQL の `jsonb` は JSON の内容に対する問い合わせと索引を利用できるが、型ごとの項目の意味までは検証しない。出典: [PostgreSQL の JSON 型](https://www.postgresql.org/docs/current/datatype-json.html)。

## 読み書きの例

タスク画面は `tasks.task` を持ち、利用者に閲覧権限がある Entity を取得する。結果の Entity に `logos.name` なども付いていれば、同じ識別子で取得する。別のアプリが `calendar.event` を追加しても Entity は増えない。

```sql
SELECT c.entity_id, c.value
FROM components AS c
JOIN entity_permissions AS p ON p.entity_id = c.entity_id
WHERE p.user_id = $1
  AND p.permission_key = 'read'
  AND c.type_key = 'tasks.task'
  AND c.value @> '{"status":"todo"}'::jsonb;
```

API は Component 更新時に、その利用者が対象 Entity の `write` 権限を持つことと、要求側が読んだ `revision` が現在の値と一致することを条件に含める。更新件数が0件なら権限なし、対象なし、競合のどれかを判別して返す。複数 Component を同時に変更する操作は、1つのトランザクションで行う。

```sql
UPDATE components
SET value = $3, revision = revision + 1, updated_at = now()
WHERE entity_id = $1 AND type_key = $2 AND revision = $4
  AND EXISTS (
    SELECT 1 FROM entity_permissions
    WHERE entity_id = $1 AND user_id = $5 AND permission_key = 'write'
  )
RETURNING revision;
```

`[n components]` の `n` は表に保存しない。表示中のアプリが通常扱う型を除き、そのポップオーバーで扱える Component を数える。画面ごとに結果が変わるため。

## Entity への参照

`Tag` や `RelatedTo` は、Component の `value` に参照先の Entity ID を配列で保存する。Entity 参照を持つ Component は、共通の `entities` 項目を使う。例は `{"entities":["参照先の UUID"]}`。この項目名を参照用に予約する。参照先を使う通常の読み取りでは、値を読めば ID が分かる。逆引きも JSONB の包含演算子 `@>` で行える。逆引きが遅くなった型に限り、JSONB の GIN 索引を追加する。GIN は JSONB 内の値から該当行を探すための索引。出典: [PostgreSQL の JSONB 索引](https://www.postgresql.org/docs/current/datatype-json.html#JSON-INDEXING)。

```sql
SELECT c.entity_id
FROM components AS c
JOIN entity_permissions AS p ON p.entity_id = c.entity_id
WHERE p.user_id = $2
  AND p.permission_key = 'read'
  AND c.type_key = 'logos.relatedTo'
  AND c.value @> jsonb_build_object('entities', jsonb_build_array($1::text));
```

この案では、JSONB 内の ID に外部キーは付かない。API が参照の追加時に参照先の存在と、その利用者の閲覧権限を確認する。参照元を読める利用者には参照先の ID を返す。参照先そのものの取得には、その Entity の閲覧権限を確認する。参照されている Entity の削除は拒否する。参照の追加時は参照先 Entity の行を共有ロックし、削除時は同じ行を排他ロックしてから逆引きする。これで、削除確認と参照追加が同時に起きても参照切れを防ぐ。

## 未決事項

- Component 型の定義を変更するとき、既存の値をどう移行するか。
- 認証方式。`users.id` と認証された利用者の対応は API が扱う。
