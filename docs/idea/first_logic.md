# Logos — コアコンセプト

## 動機

LinearのIssueとGitHub Issueは「同じタスク」の異なる表現に過ぎない。
しかし現在のツールはそれぞれを独立したデータとして扱うため、重複管理が生まれる。

Logosは**ツールではなく概念(Entity)を中心に管理する**ことで、この問題を解消する。
// これはあるいは、カントの物自体と現象を使って同一性の中心をEntityと呼ぶことができるかもしれない。

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

### EntityはLogosの外にすでに存在している

EntityはLogosの中で「作る」ものではなく、現実にすでに存在している概念を「認識する」ものである。

したがって操作の主体は逆になる：

- Component（サービス上の表現）が先にある
- 「これとこれは同じ概念だ」と宣言する
- その瞬間にEntityが生まれる

EntityはComponentを束ねる**行為**によって事後的に生まれる。1つのComponentしか持たないEntityは「まだ他サービスと繋がっていないが、概念として認識されたもの」を表す。

## Componentの種類と性質

Componentには意味的に2種類ある：

- **表現Component** — Entityがそのサービスにおいてどういうものかを表す（`LinearIssue`, `GithubIssue`など）。Systemの変化対象になる。
- **`Refs`** — このEntityが参照する他のEntityへの道筋。接地（存在）ではなく経路（関係）を表す。集合を内包する1つのComponentとして存在する。

一意性の制約は「その型が表す視点から見て一意に定まる」という意味であり、`Refs` や `Assign` のような集合型は複数の値を内包する1つのComponentとして扱う。

### NotionやObsidianについて

NotionページやObsidianノートは粒度が流動的で「1概念 = 1ページ」とは限らない。そのページがEntityそのものを表しているなら表現Component、別のEntityへの道筋として機能するなら `Refs` に含める。どちらとして扱うかはユーザーが判断する。

## Logosは「接地」である

各サービス上の表現は、それぞれのサービスの中で浮いた存在として独立している。Logosはそれらを**概念という共通の地面に接地させる**システムである。

データ自体は各サービスに分散したまま。Logosが提供するのは一元管理ではなく、「これらは同じ概念に接地している」という宣言とその維持である。

表現ComponentはEntityに強く接地している。`Refs` は接地ではなく、接地されたEntity同士をつなぐ道である。
