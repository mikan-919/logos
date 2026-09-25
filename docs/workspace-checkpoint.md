# ECS Second Brain 作業チェックポイント

最終更新: 2026-09-25

## 現在の状態

要求されたECS型Second BrainのMVPを実装した。詳細な目標と受け入れ条件は[implementation-plan.md](implementation-plan.md)、データモデルと互換性の契約は[workspace-model.md](workspace-model.md)に記録した。

起動方法:

```bash
bun run workspace serve --port 4318
```

プロトタイプの保存先は`.logos-workspace/workspace.sqlite`。旧Semantic Context MVPの`.logos/events.jsonl`とは分離する。

## 実装した範囲

- Nameを共有Componentとして保存する。Entity表にはName列を持たない。
- Task / Note / Eventを同一Entityに付けられる。
- Tasks / Calendar / Notes / Tagged Notes / TagsをComponent要件から作る。
- Notesで`Name + Note`と`Name + Note + Tag`を切り替えられる。
- 一覧と編集欄で主Componentを編集し、共通Popoverから他Componentを編集する。
- TagはNameとThisIsTagを持つEntity。Tag ComponentがTag EntityのIDを参照する。
- 現在状態と履歴を同一SQLiteトランザクションに保存する。
- 旧SQLiteスキーマとversion 1バックアップから新形式へ移行する。
- 未知のComponent、Relation、履歴、アーカイブ、サンプル、バックアップと復元を保持する。

## 主要ファイル

- `src/workspace/components/brain.ts`: Name、Task、Note、Event、Tag、ThisIsTagの定義と検証。
- `src/workspace/views.ts`: Viewの必要Component。
- `src/workspace/kernel.ts`: Queryと共通Command。
- `src/workspace/store.ts`: SQLite保存、旧DB移行。
- `src/workspace/backup.ts`: version 2検証、version 1移行。
- `src/workspace/ui.ts`: タブ、一覧、編集欄、Calendar画面、共通Popover。
- `test/workspace.public.test.ts`: Query、Tag、DB移行、バックアップ、HTTPの試験。

## 検証

```bash
bun run typecheck
bun test
```

2026-09-25に型検査が通り、全60試験が通った。HTMLのインラインスクリプトも、ページ生成後の内容で構文確認する。

画面のMarkup検査は未完了。`vlmkit`のブラウザー起動が`libglib-2.0.so.0`不足で失敗したため、環境にライブラリーを追加した後に再実行する。

## 未決事項

- Componentの粒度と同じ型の複数インスタンス。
- Tag割当をRelationへ移す条件。
- 利用者がViewを作成・保存する機能。
- 実利用での画面操作性。
