# ワークスペース機能の登録方法

日付: 2026-09-07

## 機能モジュールの構成

ワークスペースへComponentを追加する場合は、次の単位で実装する。

1. Component定義: 型ID、スキーマ版、初期値、検証を定義する。
2. 登録: `workspaceComponentRegistry`へComponent定義を追加する。
3. 操作画面: 詳細画面へ追加・編集・解除・復元の入力を追加する。
4. Projection: 必要な場合だけ、現在状態を用途別に読み替える関数とHTTP読取入口を追加する。
5. 試験: 不正データの拒否、既存Entityへの追加、既存Componentの保持、再起動復元を確認する。

Component固有の表、Kernel分岐、保存処理は追加しない。共通Commandが登録簿から検証処理を取得し、`components`表と`events`表へ保存する。

## Estimateの実装例

Estimateは工程3の拡張実験として追加した。

- 型ID: `estimate`
- スキーマ版: `1`
- データ: `{ minutes: number }`
- 検証: `minutes`は正の整数
- Projection: 有効なEstimateを持つEntityの一覧と合計分数

実装位置:

- `src/workspace/components/estimate.ts`: Component定義と検証
- `src/workspace/features.ts`: 登録箇所
- `src/workspace/projections/estimate.ts`: 見積時間一覧
- `src/workspace/http.ts`: Projectionの読取入口
- `src/workspace/ui.ts`: 詳細の入力と見積時間一覧
- `test/workspace-extension.public.test.ts`: 拡張性の試験

Estimate追加では`src/workspace/kernel.ts`と`src/workspace/store.ts`を変更していない。既存のBody、Progress、Schedule定義も変更していない。

## 検証関数の条件

検証関数は入力を受け、保存可能な正規形を返す。

- 入力オブジェクトをそのまま返さず、保存する項目だけを含む新しい値を返す。
- 型、範囲、列挙値、項目間の条件を検査する。
- 時刻や外部状態から、別Componentを暗黙に変更しない。
- 検証失敗時は`WorkspaceValidationError`を投げる。
- スキーマを変える場合は`schemaVersion`を増やし、移行方法を別途定義する。

## Projectionの条件

Projectionは`WorkspaceEntityView[]`などの現在状態を入力にし、表示用の結果を返す。

- Projection用の正本や専用更新経路を作らない。
- 更新はComponentの共通Commandへ戻す。
- 無効なComponentとアーカイブ済みEntityを含めるかを用途ごとに明示する。
- 集計の単位と丸め規則を明示する。

Estimate ProjectionはアーカイブされていないEntityの有効なEstimateを対象とし、分単位で合計する。画面表示だけ時間と分へ変換する。

## 現在の制約

登録対象は同梱コードに限る。第三者コードの動的読込、利用者によるスキーマ作成、配布機構は扱わない。登録簿は実装責務を分けるためのものであり、公開プラグイン機構ではない。
