# Logos — Domain Glossary

## Entity
現実世界の「概念上同じもの」を表す一意の単位。ツールやサービスではなく、概念を中心に管理するための基本単位。Entity自体は名前を持たない。表示名が必要な場合は `Name` Componentをつける。

**制約:** 1つのEntityは、同じ型のComponentを1つしか持てない。Componentがすべてなくなると自動的に削除される。

## Component
あるEntityの「異なる側面」を表すデータ。特定の外部サービス（GitHub Issue、Linear Issue、Notion Pageなど）との対応関係や、内部的な属性（Assign、Knowledgesなど）を表す。

意味的に2種類ある：
- **表現Component** — Entityがそのサービスにおいてどういうものかを表す。Systemの変化対象になる。
- **`Refs`** — このEntityが参照する他のEntityへの道筋。接地（存在）ではなく経路（関係）を表す。Entity間のナビゲーションを担う。

**制約:** 同じ型のComponentは1つのEntity内に1つのみ存在できる。この一意性は「その型が表す視点から見て一意に定まる」という意味である。`Refs` や `Assign` のように集合を表す型は、複数の値を内包する1つのComponentとして存在する。

## Interface
外部サービスとの連携を定義するプラグイン単位。Component型のスキーマ宣言と、Adapterを内包する。

Interface自体もLogosのEntityとして管理される。そのComponentは `Interface<URL|PKG>`（ソース）と `permission`（権限）などを含む。ロジック（Adapter/Systemのコード）はキャッシュされる。

`permission` はInterfaceが読み書きできるComponent型を制御する。外部ネットワークアクセスやExternal Hookの発火はインストール時点で全許可とする。それらを制御したい場合はInterfaceのメタコンフィグに記述する。

## Adapter
外部の表現をLogosの内部表現に翻訳する層。2種類ある：
- **Service Adapter** — Interfaceの一部。外部サービスのイベントをLogos内部のEventに変換する
- **DB Adapter** — ストレージ層の抽象。クラウドDBでもローカルDBでも差し替えられる。ローカルで動かす場合はSupabaseのようなself-hosted構成になりうる

## Event
Componentの一種だが、他のComponentと異なり短命。Logosのコアが消費すると同時に削除される（地産地消）。AdapterによってEntityに付与され、SystemまたはExternal Hookを起動するトリガーとなる。ユーザーが直接操作するものではない。

2種類のEvent型がある：
- `Event<T>` — Adapterが外部サービスのWebhookなどから生成する外部由来のイベント
- `Change<C>` — Logos内部でComponent `C` が変更されたときに自動発行されるイベント。内部的にはEventの一種

## System
Logos内部でEventを処理するユニット。Interfaceの中に定義される。`Event<T>` または `Change<C>` を購読し、Componentを変更する。

## Integration
複数のInterfaceをまたぐSystemの一種。あるInterfaceの中に定義されるが、他のInterfaceのComponentを参照・更新できる。例：`GithubInterface` 内のIntegrationが `Change<LinearIssue>` を購読し、`GithubIssue` を更新する。

## External Hook
Logosの内部変化を外部サービスや外部スクリプトに通知する仕組み。Systemが内部処理を担うのに対し、External HookはLogos外部への通達を担う。

## Merge
2つのEntityを1つに統合する操作。片方のEntityのすべてのComponentをもう片方に移し、元のEntityを削除する。両方のEntityに同じ型のComponentが存在する場合、mergeは失敗する（エラー）。

Mergeは「EntityとEntityを統合する」操作であると同時に、「この2つのComponentは同じ概念の表現だ」という宣言でもある。Entityはこの宣言によって事後的に形成される。

## 接地（Grounding）

Logosの本質的な役割。各サービス上の表現を**概念という共通の地面に接地させる**こと。データは各サービスに分散したまま存在し、Logosは「これらは同じ概念に接地している」という宣言とその維持を担う。

表現ComponentはEntityに強く接地している。`Refs` は接地ではなく、接地されたEntity同士をつなぐ道である。
