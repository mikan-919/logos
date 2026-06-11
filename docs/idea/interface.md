# Interface

InterfaceはComponent型のスキーマを定義するプラグイン単位。
外部サービスとの連携はすべてInterfaceとして実装される。

## 役割

- Component型のスキーマを宣言する
- 他のInterfaceのスキーマを参照することで、サービス間の関係性を表現できる

## 例

```
GithubInterface
  defines: GithubIssue { url, title, status, ... }

LinearInterface
  defines: LinearIssue { identifier, title, state, ... }
```

## 制約

- 1つのEntityは同じ型のComponentを1つしか持てない
- そのため、同じInterface由来のComponentが衝突する場合はMergeできない
