# イベントフロー

Logosはイベントベースで駆動する。

## フロー

```
外部サービス (Webhook等)
    ↓
Adapter（Interface内部）
    外部イベントをLogos内部のEventに変換
    ↓
EventがComponentとしてEntityに付与される
    ↓
Logosがトリガーを起動
    ├─ System    — 内部処理（Componentの整合を保つ reconcile）
    └─ External Hook — 外部への通達
    ↓
EventComponentを削除（地産地消）
```

## Eventはペイロードを運ばない

Eventは「変化の中身（diff）」を運ぶのではなく、**「このEntityを見直せ」という合図**である。中身を伝播せず、Systemは起動時にComponentの**現在の実値**を読み直して整合を取る。

これにより同期は「変化を転送する」行為ではなく、接地したComponent同士の整合を保つ**収束（reconciliation）**になる。この設計がループ防止の前提であり、詳細は [同期とConflict](./sync_and_conflict.md) を参照。

## 各要素の責務

| 要素 | 責務 |
|------|------|
| Adapter | 外部イベント → 内部Eventへの変換。Interfaceの一部 |
| Event | 短命なComponent。Entityへの「再評価の合図」。消費されたら削除される |
| System | Entityを reconcile し、Component同士の整合を保つユニット |
| External Hook | Logosの変化を外部に通達する仕組み |
