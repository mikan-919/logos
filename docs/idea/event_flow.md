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
    ├─ System    — 内部処理（Componentの更新など）
    └─ External Hook — 外部への通達
    ↓
EventComponentを削除（地産地消）
```

## 各要素の責務

| 要素 | 責務 |
|------|------|
| Adapter | 外部イベント → 内部Eventへの変換。Interfaceの一部 |
| Event | 短命なComponent。消費されたら削除される |
| System | Logos内部でEventを処理するユニット |
| External Hook | Logosの変化を外部に通達する仕組み |
