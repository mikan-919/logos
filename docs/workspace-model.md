# 機能構成型ワークスペースのモデルと操作契約

日付: 2026-09-07

## 目的

この試作は、同じEntityへComponentを追加し、対象IDと履歴を維持したまま利用可能な操作を増やせるかを検証する。既存のSemantic Context MVPとは保存先と実装を分ける。

- 既存MVP: 外部サービス上の表現、Relation、Evidence、Hypothesisを扱う。
- ワークスペース試作: 持続的な対象の名前、本文、進捗、実施予定を扱う。

試作データは`.logos-workspace/workspace.sqlite`へ保存する。既存の`.logos/events.jsonl`は読み書きしない。

## 用語と不変条件

### Entity

Entityは持続的な対象を表す。

- IDは作成時に割り当て、再利用しない。
- 名前は一覧と参照に使う最小メタデータとする。
- 更新ごとにrevisionを1増やす。
- アーカイブは論理的な状態変更とし、EntityとComponentを削除しない。

### Component

ComponentはEntityに属する機能上の状態を表す。

- キーは`entityId`と`typeId`の組とする。
- 同じ型の有効なComponentはEntityごとに一つまでとする。
- `schemaVersion`と検証済みのJSONデータを保存する。
- 解除時はデータを保持して無効にする。復元時は保存済みデータを使う。
- 未知の`typeId`は解釈や削除をせず、読み取り結果に残す。

初期型は次の三つとする。

| 型ID | スキーマ版 | データ | 検証 |
| --- | ---: | --- | --- |
| `body` | 1 | `{ markdown: string }` | `markdown`が文字列 |
| `progress` | 1 | `{ status: "todo" | "doing" | "done" }` | 列挙値に一致 |
| `schedule` | 1 | `{ startUtc, endUtc, timeZone }` | ISO 8601のUTC時刻、開始より後の終了、IANAタイムゾーン |

Scheduleは時刻付きの単発予定だけを表す。終日、繰り返し、複数枠、締め切りは別の意味であるため含めない。

### Command

Commandは更新の唯一の入口とする。各Commandは`operationId`と`actor`を受け取り、既存Entityを変えるCommandは`expectedRevision`も受け取る。

- `operationId`: 同じ操作の再送を識別し、二重適用を防ぐ。
- `expectedRevision`: 読み取ったrevisionと現在値が一致する場合だけ更新する。
- `actor`: 操作主体を履歴へ記録する。初期値は`local-user`。

一つのCommandによる現在状態とイベントの保存は、一つのSQLiteトランザクションで行う。注: トランザクションは、複数の書き込みを全適用または全取消にする境界である。

| Command | 必要条件 | 更新 |
| --- | --- | --- |
| `entity.create` | 重複しない`operationId`、空でない名前 | Entityをrevision 0で作成 |
| `entity.rename` | Entityが存在しrevision一致 | 名前、revision |
| `entity.archive` / `entity.restore` | Entityが存在しrevision一致 | アーカイブ状態、revision |
| `component.add` | 登録済み型、Entityが存在しrevision一致 | 初期データ、有効状態、revision |
| `component.disable` | 有効なComponent、revision一致 | 無効状態、revision |
| `component.restore` | 無効なComponent、revision一致 | 有効状態、revision |
| `component.update` | 有効なComponent、型ごとの検証成功、revision一致 | Componentデータ、revision |

`component.add`は、存在しない場合は初期値を作り、無効な場合は保存済みデータを復元する。有効な場合は状態を変えず成功する。このため再送以外の二重追加でも有効な同種Componentは増えない。

### Projection

Projectionは保存された状態から画面用の読み取り結果を作り、更新時はCommandを呼ぶ。独自の正本を持たない。

- 一覧: 全Entity。Componentの有無やProgress状態による絞り込みは後続工程で加える。
- 詳細: Entityと全Component。有効な既知Componentは編集、未知Componentは読み取り専用で表示する。
- 週カレンダー: 有効なScheduleを持つEntity。後続工程で加える。

## 対象境界の例

| 事例 | 判断 | 理由 |
| --- | --- | --- |
| 勉強会の目的と説明 | 同じEntityのBody | 活動そのものの説明として一緒に扱う |
| 勉強会の実施日時 | 同じEntityのSchedule | 活動の一回の実施予定として一緒に扱う |
| 会場を予約する作業 | 別Entityを`references`で接続 | 個別に進捗を持ち、完了できる |
| 勉強会の議事録 | 別Entityを`references`で接続 | 個別に参照、共有、版管理する |
| 記事の公開予定 | 記事EntityのSchedule | 記事という対象の実施予定として扱う |
| 記事執筆から派生した調査 | 別Entityを`references`で接続 | 独立して進捗と説明を持つ |
| 実施予定と締め切り | 別Component候補 | 同じ日時でも操作と意味が異なる |

判断基準は、そのデータを対象と常に一緒に扱うか、個別に参照・共有・完了・版管理するかである。

## 既存資産の再利用

| 現行資産 | 判断 | 理由 |
| --- | --- | --- |
| ID生成と入力検証の考え方 | 再利用 | 対象の同一性と不正入力の拒否は共通する |
| `src/types.ts`のEntity/Component | 非共有 | 固定Entity種別と外部表現を担い、今回の機能状態と意味が異なる |
| `LogosKernel` | 非共有 | Relation、Evidence、Hypothesisの操作契約を維持する |
| `.logos/events.jsonl` | 非共有 | 現在状態と履歴の同一トランザクション保存を提供しない |
| CLI/HTTPの起動方法 | 入口だけ再利用 | 旧入口を維持し、`workspace serve`を追加できる |
| ダッシュボードのCSS | 後で判断 | 画面の意味が異なるため、工程2で部品単位に確認する |

## 工程1の完了範囲

工程1では次を通す。

1. 空の保存先でEntityを作る。
2. BodyとScheduleを追加して値を保存する。
3. Entity IDを変えずにBodyとScheduleを更新する。
4. Kernelを閉じて開き直し、同じ状態と履歴を読む。
5. 無効なSchedule、古いrevision、同じ`operationId`の再送を検査する。

一覧、詳細、週カレンダー、Relation、通知、履歴画面、エクスポートは工程2以降で扱う。
