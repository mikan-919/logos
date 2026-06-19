# レイヤー（= System）

## レイヤーとは

ECS の System に相当する。Logos のワールドの上で動作する処理単位。

- Component 型のスキーマを宣言する
- そのComponent を持つ Entity に対するビューとロジックを提供する

RenderSystem が「Position + Sprite を持つ Entity」を処理するのと同様に、
Rotax は「RotaxTask を持つ Entity」に対するビューとロジックを提供する。

## 各レイヤーの役割

| レイヤー | 主なComponent 型 |
|----------|-----------------|
| Rotax | RotaxTask（時間・タスク） |
| Velt | VeltNote（知識・意味・関係） |
| Wayline | — |
| Yatra | ActivityLog（活動履歴） |
| Zestium | — |

「Rotax の画面から Velt の内容を書き換える」は、複数 Component 型に触る System であり何も特別ではない。

## Component 型の定義

```
RotaxInterface
  defines: RotaxTask { title, scheduledAt, status, ... }

VeltInterface
  defines: VeltNote { content, tags, ... }
```

- 1つの Entity は同じ型の Component を1つしか持てない
- 衝突する場合は Merge 失敗（人間に委ねる）

## レイヤーの分離原則

- レイヤー同士は直接通信しない
- ワールド（Logos）を介してのみデータを読み書きする
- 依存の向きは「レイヤー → Logos」のみ

## 外部サービスのレイヤー

GitHub/Linear などの外部サービスも同じ構造でレイヤーとして実装する。
Adapter として外部イベントを受け取り、Logos に変換して書き込む。
外部との reconciliation は [external_boundary.md](./external_boundary.md) を参照。
