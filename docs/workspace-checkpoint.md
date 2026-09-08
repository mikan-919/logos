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

工程0〜4を実装済み。工程5「利用観察」は未実施のまま、読み取り専用MCP入口の拡張へ進んだ。

- 専用保存先: `.logos-workspace/workspace.sqlite`
- 旧MVP保存先: `.logos/events.jsonl`。自動移行しない。
- 起動: `bun run workspace serve --port 4318`
- MCP起動: `bun run workspace mcp`
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

### 工程4のサンプル投入

- `workspace.sample` Commandで勉強会と記事のサンプルを一括投入
- Body、Progress、Scheduleの検証済み状態と、Entityごとの作成・機能追加履歴を保存
- ルート投入イベントを含む現在状態・履歴の一括SQLiteトランザクション
- 空のワークスペースだけを対象にし、非空時は既存状態を変更しない
- 同じ`operationId`の再送を冪等に処理
- 画面の「サンプルデータを読み込む」ボタンと`POST /api/workspace/sample`

### 工程5を飛ばした後の最初の拡張

- 読み取り専用MCP入口
- 最大50 Entityの一覧・絞り込み
- 単一Entity、Component、参照の取得
- MCP専用状態と書き込み操作を持たない境界
- 標準入出力でCLIを起動する回帰試験とMCPクライアント設定例

## 検証済み基準

- `bun run typecheck`成功
- `bun test`成功
- 現在の試験数: 55
- `createWorkspaceHttpApp`で履歴・エクスポート・復元API応答を確認
- 履歴、エクスポート、復元のAPIと試験を追加。運用手順は[workspace-backup.md](workspace-backup.md)
- サンプル投入の成功、再起動・履歴、非空拒否、再送、原子性、HTTP/UI入口を試験
- `test/workspace-backup.e2e.public.test.ts`で別一時ディレクトリ・別ポートの実サーバーを使う端末間バックアップ・復元を確認
- Entity ID、Component状態、Estimate、Relation、解除済みRelation、履歴、未知Componentを復元先で照合
- 復元先の差分が`exportedAt`と末尾の`workspace.restore`イベントだけであることを確認
- Jujutsuで保存したコミット: `00499169 feat: add workspace history backup and restore`

## 工程5の準備成果物

- [利用観察の手順と記録様式](workspace-usage-observation.md)を追加した。
- 観察期間、参加者コード、既存手段との比較、複数日の再利用、削減例、技術上の確認を同じ様式で記録できる。
- 参加者への連絡と実データの収集は未実施であり、工程5の判定は未開始である。

## 次の作業

工程4のバックアップ・復元確認は完了した。工程5の利用観察は実施できないため、2026-09-08の判断で未実施のまま次の拡張へ進んだ。利用価値は未検証である。

推奨順序:

1. ~~履歴Queryと対象詳細の履歴表示を追加する。イベントの削除や編集は許可しない。~~
2. ~~バージョン付きエクスポート形式を定義し、未知Componentを保持する。~~
3. ~~一時ディレクトリへ復元して、Entity ID、Component状態、Relation、履歴を照合する。~~
4. UIへ復元確認とサンプル投入を追加した。エラー表示は既存。
5. ~~実データを使う前に[バックアップと復元の手順](workspace-backup.md)を確認し、実サーバーで操作する。~~

6. [利用観察の手順と記録様式](workspace-usage-observation.md)に従い、実データの反復利用と既存手段との差を記録する。

同じEntity・Component・Queryを読むMCP入口を追加し、標準入出力経由の実プロセスで一覧と詳細を確認した。次は利用目的を一つ定めて読み取りを試し、不足が確認できた場合だけ次のQueryを選ぶ。書き込み、新しい対象モデル、MCP専用状態は追加しない。

## 守る境界

- `.logos/events.jsonl`を読んだり自動移行したりしない。
- 既存Semantic Context MVPのKernel、CLI、HTTP、MCPの意味を変更しない。
- UIからSQLiteやevents表へ直接書き込まない。必ず共通Commandを通す。
- エクスポートは現在状態だけでなく、履歴、revision、operationId、未知Componentを含める。
- 復元は過去イベントの削除や再実行ではなく、新しい復元操作として記録する。
- 不明なComponent型を削除、解釈、変換しない。
- 仕様を広げる前に、計画の完了条件と利用価値の仮説に照合する。
