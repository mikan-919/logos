# ECS Second Brain 実装計画

最終更新: 2026-09-25

本書は最初のBody / Progress / Schedule案を置き換える。現在のモデル契約は[workspace-model.md](workspace-model.md)、作業状態は[workspace-checkpoint.md](workspace-checkpoint.md)を参照。

## 目標

NotionやObsidianのような情報管理を、ページ種別ではなくEntityとComponentの組み合わせで扱う。同じEntityをTask、Calendar、Notesなど複数Viewで操作し、共通データを重複させない。

## MVPの受け入れ条件

1. `Name`が共有Componentであり、Entityの必須情報として保存される。
2. `Task`、`Note`、`Event`を同じEntityへ付け、各Viewから同じIDを取得できる。
3. Viewは必要なComponentのAND条件で定義する。Notesでは`Name + Note`と`Name + Note + Tag`を試せる。
4. 一覧のComponent数から共通Popoverを開き、他Componentを編集できる。
5. Tagは`Name + ThisIsTag`を持つEntityとし、Tag ComponentからそのIDを参照できる。
6. SQLiteの現在状態、履歴、再起動後の状態が整合し、旧ワークスペースとversion 1バックアップを移行できる。

## 実装済み

- Name / Task / Note / Event / Tag / ThisIsTagのComponent定義と検証。
- Tasks / Calendar / Notes / Tagged Notes / TagsのView定義。
- 同一Entityに複数Componentを付ける共通Command経路とHTTP API。
- 共通PopoverによるName、Task、Note、Event、Tagの表示・編集。
- Tag Entity作成と、Tag Componentからの割当。
- SQLiteのentities、components、relations、events表。NameはComponent表に保存。
- 状態更新とイベント記録の同一トランザクション保存。
- 旧SQLite名列、Body / Progress / Schedule、およびversion 1エクスポートの移行。
- エクスポートversion 2、未知Componentの保持、復元。

## 設計上の選択

- Component間依存は避け、Viewが必要条件を宣言する。
- optional Componentは無い状態を許し、必要なViewからは除外する。
- `ThisIsTag`を空のmarker Componentとして使う。
- Tag割当はMVPではTag Component内のEntity ID配列。一般の`references` Relationとは分ける。
- Component型ごとにEntity上の有効な値は一つ。複数のNoteやEventが必要になるかは後で判断する。

詳細と制約は[workspace-model.md](workspace-model.md)に記録する。

## 未決事項

- Componentの粒度と複数インスタンスの必要性。
- Tag割当を独立したRelationにする条件。
- 利用者がView定義を作成・保存する機能の必要性。
- 実利用でPopoverと一覧の操作が十分か。
