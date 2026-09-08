# ワークスペース実装チェックポイント

最終更新: 2026-09-08

## 再開方法

1. [implementation-plan.md](implementation-plan.md)を読む。これは最初の実装計画の正本文書である。
2. この文書の「現在位置」と「次の作業」を確認する。
3. `jj status`で作業コピーを確認する。
4. `bun run typecheck`と`bun test`を実行して基準状態を確認する。
5. 次の作業を一つの縦切りとして実装し、試験を追加する。
6. 検証後に`jj describe -m "..."`と`jj new`で意味のある単位を保存する。
7. 返却前に`jj status`を実行する。

## 現在位置

工程0〜3を実装済み。次は工程4「日常利用の準備」である。

- 専用保存先: `.logos-workspace/workspace.sqlite`
- 旧MVP保存先: `.logos/events.jsonl`。自動移行しない。
- 起動: `bun run workspace serve --port 4318`
- 計画本文: [implementation-plan.md](implementation-plan.md)
- モデル契約: [workspace-model.md](workspace-model.md)
- Component登録方法: [workspace-features.md](workspace-features.md)

## 実装済み

### 工程0・1

- Entity、Body、Progress、Schedule
- Component登録簿
- 共通Commandと検証
- SQLiteのentities、components、relations、events
- 現在状態と履歴の同一トランザクション保存
- revisionによるEntity単位の競合検出
- operationIdによる再送防止
- Componentの論理解除と復元
- 再起動後の復元

### 工程2

- 対象一覧、対象詳細、週カレンダー
- 名前、Progress有無、Progress状態の絞り込み
- `references`の追加、解除、復元
- Server-Sent Eventsによる別画面通知と画面復帰時の再取得
- 競合時の最新状態表示と入力保持
- 未知Componentの読み取り専用表示
- アーカイブ、改名、復元

### 工程3

- 登録済みComponentをKernel・保存構造の特例なしで追加できる登録簿
- Estimate Component: `{ minutes: 正の整数 }`
- 見積時間一覧と合計分数
- Component登録方法の文書

### 工程4の最初の縦切り

- 対象履歴とワークスペース全体の履歴Query
- `logos.workspace` version 1のエクスポート
- 現在状態、履歴、未知Component、解除済みRelationを含む復元
- 復元操作の履歴記録と`operationId`再送処理
- 詳細画面の履歴表示、エクスポート、空のワークスペースへの復元確認

## 検証済み基準

- `bun run typecheck`成功
- `bun test`成功
- 現在の試験数: 44
- `createWorkspaceHttpApp`で履歴・エクスポート・復元API応答を確認
- 履歴、エクスポート、復元のAPIと試験を追加。運用手順は[workspace-backup.md](workspace-backup.md)
- 実サーバーはポート使用中のため起動確認を保留
- 今回の履歴・バックアップ実装をJujutsuの単位として保存する

## 次の作業

工程4の次の作業は、バックアップと復元を実データで確認し、履歴表示と入力エラーの運用上の問題を記録すること。

推奨順序:

1. ~~履歴Queryと対象詳細の履歴表示を追加する。イベントの削除や編集は許可しない。~~
2. ~~バージョン付きエクスポート形式を定義し、未知Componentを保持する。~~
3. ~~一時ディレクトリへ復元して、Entity ID、Component状態、Relation、履歴を照合する。~~
4. UIへ復元確認を追加した。エラー表示は既存。サンプルデータは未対応。
5. 実データを使う前に[バックアップと復元の手順](workspace-backup.md)を確認し、実サーバーで操作する。

## 守る境界

- `.logos/events.jsonl`を読んだり自動移行したりしない。
- 既存Semantic Context MVPのKernel、CLI、HTTP、MCPの意味を変更しない。
- UIからSQLiteやevents表へ直接書き込まない。必ず共通Commandを通す。
- エクスポートは現在状態だけでなく、履歴、revision、operationId、未知Componentを含める。
- 復元は過去イベントの削除や再実行ではなく、新しい復元操作として記録する。
- 不明なComponent型を削除、解釈、変換しない。
- 仕様を広げる前に、計画の完了条件と利用価値の仮説に照合する。
