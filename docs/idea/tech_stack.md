# 技術スタック

## サーバー
- **Runtime:** Bun
- **API:** REST

## レイヤー（System）
- **言語:** TypeScript / JavaScript
- **配布:** URL またはパッケージレジストリ
- **実行:** Bun Worker 上でキャッシュ・実行される（Logos プロセスから分離）

## ストレージ
- DB Adapter による抽象化
- クラウド DB または self-hosted（Supabase ライク）の両方に対応
