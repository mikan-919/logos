# Logos — コアコンセプト

## Logosとは

Logos は ECS（Entity-Component-System）を応用した**概念グラウンディング基盤**。
Entity/Component ストア・クエリ・変更通知を提供する「ワールド」として機能し、
各レイヤー（Velt/Rotax/Wayline/Yatra/Zestium）が System として乗る土台になる。

> カントの物自体と現象になぞらえると、Entity が物自体（概念）、
> Component がサービス上の現象（表現）にあたる。

## 基本構造

| 要素 | 役割 |
|------|------|
| Entity | 概念として同一のものを表す一意の単位 |
| Component | Entity の側面。型は各レイヤー（System）が定義する |
| System | レイヤーそのもの。Component 型の定義とビュー・ロジックを持つ |

Logos 単体は Entity+Component のワールドのみを提供する。
三位一体（ECS の S）はエコシステム全体スケールで初めて完成する。

## Entity の同一性

Entity は Logos の中で「作る」ものではなく、現実にすでに存在している概念を「認識する」もの。

- Component（サービス上の表現）が先にある
- 「これとこれは同じ概念だ」と宣言する
- その瞬間に Entity が生まれる

**Merge** により複数の Entity を統合できる。同型 Component が衝突する場合は Merge が失敗し、人間に委ねる。

## Component の種類

- **表現 Component** — Entity がそのレイヤー/サービスにおいてどういうものかを表す（`RotaxTask`, `VeltNote` など）。System の操作対象。
- **Refs** — このEntity が参照する他の Entity へのポインタ集合。関係を表すが接地ではない。

1つの Entity は同じ型の Component を1つしか持てない。

## 「接地」の意味

各サービス/レイヤー上の表現は、それぞれの中で独立している。
Logos はそれらを**概念という共通の地面に接地させる**システムである。

表現 Component は Entity に強く接地している。`Refs` は接地されたEntity同士をつなぐ道。
