# Logos — コアコンセプト

## 動機

LinearのIssueとGitHub Issueは「同じタスク」の異なる表現に過ぎない。
しかし現在のツールはそれぞれを独立したデータとして扱うため、重複管理が生まれる。

Logosは**ツールではなく概念(Entity)を中心に管理する**ことで、この問題を解消する。

## 基本構造

ECS（Entity-Component-System）のEntity/Componentのアイデアを応用する。

- Entity — 概念上同じものを表す一意の単位
- Component — Entityの異なる側面（外部サービスとの対応や属性）
- Interface — Component型のスキーマを定義するプラグイン単位

```
Entity: "Fix Login Bug"

Components:
  - GithubIssue   ← GithubInterface が定義
  - LinearIssue   ← LinearInterface が定義
  - Knowledges
  - Assign
```

GitHubのIssueもLinearのIssueも独立したデータではなく、同じEntityに属する異なるComponentである。

## Entityの同一性

2つのEntityが「概念上同じもの」だとユーザーが判断したとき、**Merge**によって統合できる。

- 片方のEntityのすべてのComponentをもう片方に移す
- 元のEntityは削除される
- 両方に同じ型のComponentが存在する場合、Mergeは失敗する
