# ADR-0001: InterfaceをまたぐIntegrationの依存方向

## ステータス
提案中

## 背景
IntegrationはあるInterfaceの中に定義されるが、他のInterfaceのComponentを参照・更新できる。
これによりInterfaceが他のInterfaceに依存する構造が生まれる。

## 決定
循環依存は原則禁止とするが、技術的には「1サイクル内での1回のみの実行制限」で循環を許容する実装も可能。

どちらのInterfaceにIntegrationを書くかは自由とする。依存の明示的宣言は今のところ必須としない。

## トレードオフ
- **利点:** IntegrationをどのInterfaceに書くか自由度が高く、実装しやすい
- **欠点:** Interface間の依存関係がコードを読まないと分からない。設計としてきれいではない

## 将来の検討
依存関係が複雑になった場合、`requires: [LinearInterface]` のような明示的宣言の導入を検討する。
