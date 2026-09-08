# ワークスペースの履歴とバックアップ

日付: 2026-09-08

## エクスポート形式

`GET /api/workspace/export`は次のJSONを返す。

| 項目 | 内容 |
| --- | --- |
| `format` | `logos.workspace` |
| `version` | `1` |
| `exportedAt` | エクスポート時刻のISO 8601文字列 |
| `entities` | アーカイブ済みを含むEntityの現在状態 |
| `components` | 有効・解除済み、および未対応Componentの現在状態 |
| `relations` | 有効・解除済みRelationの現在状態 |
| `events` | 操作履歴。`operationId`とrevisionを含む |

`sequence`はSQLite内部の読み取り用番号であり、JSONには含めない。履歴の順序は`events`の配列順で保持する。

## 履歴の参照

- `GET /api/workspace/entities/{entityId}/history`: 対象に属する履歴
- `GET /api/workspace/history`: ワークスペース全体の履歴

履歴は読み取り専用である。詳細画面では操作、実行者、時刻、`operationId`、revision、変更内容を表示する。

## 復元

復元先のワークスペースを空のディレクトリで起動し、画面の「復元」からJSONファイルを指定する。HTTPでは次の形式で送信する。

```json
{
  "operationId": "restore-2026-09-08",
  "actor": "local-user",
  "backup": {
    "format": "logos.workspace",
    "version": 1,
    "exportedAt": "...",
    "entities": [],
    "components": [],
    "relations": [],
    "events": []
  }
}
```

`POST /api/workspace/restore`は入力を検証してから、一つのSQLiteトランザクションでEntity、Component、Relation、履歴を保存する。トランザクションは複数の書き込みを全適用または全取消にする境界である。復元先に既存データがある場合は拒否し、既存データを置き換えない。

保存済みイベントは再実行しない。元の`operationId`、revision、未知Component、解除済み状態をそのまま保存し、最後に`workspace.restore`イベントを追加する。このイベントは`entityId`に予約値`__workspace__`を持つため、対象ごとの履歴には表示しない。

同じ復元`operationId`の再送は、既存の復元結果を返す。別の操作で使用済みの`operationId`は拒否する。

## 確認手順

1. 元のワークスペースで「エクスポート」を押してJSONを保存する。
2. 別の空ディレクトリから`bun run workspace serve --port 4318`を起動する。
3. JSONを指定して復元する。
4. Entity ID、本文、Progress、Schedule、Estimate、Relation、履歴を確認する。
5. 元のワークスペースと復元先のJSONを比較する。復元先には末尾の`workspace.restore`イベントと新しい`exportedAt`が追加される。
