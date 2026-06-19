# Logos はワールドである

## ワールドとしての責務

Logos が提供するのは以下の3つだけ。これ以上でも以下でもない。

1. **ストア** — Entity と Component を永続化する
2. **クエリ** — archetype query（「RotaxTask を持つ Entity をすべて返せ」）
3. **変更通知** — Component が変わったら System（レイヤー）に通知する

## 書き込みの単一口

すべての書き込みは Logos の API を通す。レイヤーが直接ストアを触らない。
→ 後からロック・所有権・外部 Bridge をこの口に差し込むだけで拡張できる。

## append-only 変更ログ

変更はすべて由来付きログとして追記される。

- コア内で Conflict が発生しない裏付け（値が世界に1つ）
- Merge/Split を後日いつでも実装できる前提条件
- Yatra（活動履歴レイヤー）の土台とほぼ同一 — どのみち作るレイヤーが早く手に入るだけ

## コア内に Conflict は発生しない

単一ストアを持つため、コピーが存在せず echo/reconciliation 問題は生まれない。
残るのは通常の DB 同時更新（トランザクション/楽観ロック）だけ。

外部サービスとの境界では従来の Conflict 問題が局所的に発生する。
→ 詳細は [external_boundary.md](./external_boundary.md)

## 最小実装のガイドライン

Logos のコアは以下の薄さで十分。

```
Entity テーブル / Component テーブル（型ごとスキーマ） / 変更ログ / クエリ API / 変更通知
```

Merge/Split・外部 Adapter・Conflict 処理は必要になった日まで存在しなくてよい。
System（レイヤー）側から要求が来て初めて、クエリ API やスキーマ宣言の形が決まる。
