# ECS Second Brain のデータモデル

最終更新: 2026-09-25

## 目的

情報をページ種別ごとに複製せず、Entity と Component の組み合わせで表す。同じ Entity を Task、Calendar、Notes などの View から読み書きする。

```text
Entity + Components + Relations
              ↓
             Query
              ↓
             View
```

この試作は既存のSemantic Context MVPから分離している。データは`.logos-workspace/workspace.sqlite`へ保存し、旧MVPの`.logos/events.jsonl`は読み書きしない。

## Entity と Component

EntityはID、作成・更新日時、revision、アーカイブ状態を持つ。IDは再利用しない。名前はEntity列ではなく、必須の`Name` Componentとして保存する。

有効な同種ComponentはEntityごとに一つまでとする。Componentを外す操作は論理解除であり、値を保持する。未知のComponentは保持し、UIでは読み取り専用で表示する。

| Component | データ | 役割 |
| --- | --- | --- |
| `Name` | `{ value: string }` | 全Viewで共有する名前 |
| `Task` | `{ status: "todo" \| "doing" \| "done", due?: "YYYY-MM-DD", priority?: "low" \| "medium" \| "high", description?: string }` | 作業状態。期限、優先度、説明は任意 |
| `Note` | `{ body: string }` | 本文 |
| `Event` | `{ startUtc, endUtc, timeZone, location?, description? }` | 時刻付きの単発予定 |
| `Tag` | `{ entityIds: string[] }` | Tag Entityへの参照 |
| `ThisIsTag` | `{}` | EntityをTagとして識別するmarker |
| `Estimate` | `{ minutes: number }` | 既存拡張。正の整数の見積時間 |

`Event`の終了は開始より後でなければならない。終日予定、繰り返し、複数予定枠はまだ扱わない。`Task`、`Note`、`Event`、`Tag`はEntityの固定種別ではなく、Componentが付いているかどうかで決まる。

### Tag

Tagも通常のEntityであり、`Name + ThisIsTag`を持つ。別Entityの`Tag.entityIds`にそのIDを保存する。割当先は有効な`ThisIsTag`を持つ必要があり、自分自身は指定できない。使用中のTagから`ThisIsTag`を解除することはできない。

このMVPではTag割当をTag Component内のID配列として扱う。一般的なEntity間の`references` Relationは別機能として保つ。Tag割当そのものに作成者や独立した履歴が必要になった場合は、Relationへ移すかを検討する。

### Relation

`references`は独立したEntity間の関係として保存する。追加・解除は共通Commandを通し、作成者と操作IDを記録する。Tag割当は現在、Relationではない。

## View

Viewの`requires`にはComponent型IDを並べる。すべてのComponentを有効な状態で持つEntityだけを返す。Component同士は依存せず、Viewが必要な組み合わせを指定する。

| View | 必須Component |
| --- | --- |
| Tasks | `Name + Task` |
| Calendar | `Name + Event` |
| Notes | `Name + Note` |
| Tagged Notes | `Name + Note + Tag` |
| Tags | `Name + ThisIsTag` |

任意のComponentが無いEntityは、その条件のViewに現れない。空値を持つ仮のComponentは作らない。Notes Viewでは`Note`のみの一覧と、`Tag`も必要とする一覧を切り替えられる。

現在のView定義は同梱コードで固定している。HTTPの`GET /api/workspace/views/:id?require=task`は追加条件をANDで適用する。

## UI と更新

上部にTask、Calendar、Noteのタブを置く。画面は一覧と編集欄に分け、選択したEntityの主Componentを編集する。編集欄のComponent数ボタンから共通Popoverを開き、Nameや他のComponentを表示・編集できる。Calendarでは月表示と予定の編集欄を使う。Note一覧にはTag付きEntityだけに絞る条件を置く。

UIとHTTPはSQLiteへ直接書き込まず、共通Commandを使う。現在状態とappend-onlyのイベント履歴は一つのSQLiteトランザクションで保存する。revisionで古い更新を拒否し、operationIdで再送を識別する。

## SQLite と互換性

SQLiteには`entities`、`components`、`relations`、`events`表を置く。`entities`には同一性と更新情報を置き、Nameなどの意味上の状態は`components`に置く。

旧スキーマを開くとき、`entities.name`をName Componentへ移す。可能な場合は旧Body、Progress、ScheduleをNote、Task、Eventへ変換し、旧列を削除する。旧MVPの`.logos/events.jsonl`は対象外。

エクスポート形式は`logos.workspace` version 2。version 1の復元では`entities[].name`とBody / Progress / Scheduleを新Componentへ移す。version 2は古いComponent IDを勝手に書き換えない。

## 実装範囲と未決事項

- 一つのEntityに同じ型のComponentを複数付ける機能はない。
- View定義はコード内にあり、利用者が保存・編集する機能はない。
- Tag割当は値の一部として保存するため、割当ごとの履歴や属性を持たない。
- `ThisIsTag`はデータを持たないmarker Componentである。
- 既存のBody / Progress / Schedule Component定義は互換性のため登録簿に残る。新しい画面のView定義はNote / Task / Eventを使う。

Componentの粒度、Tag割当をRelationへ移す条件、利用者定義Viewの要否は、利用状況に基づいて決める。
