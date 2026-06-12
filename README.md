# LOGOS

ツールではなく**概念(Entity)**を中心に管理するデータベース／プロダクトの試作プロトタイプ。
各サービス上の表現(Component)を概念という共通の地面に**接地**させ、変化は payload を運ばず
reconcile で**収束**させる、というコアコンセプトをインメモリで実証する。

設計の正準定義は [`CONTEXT.md`](./CONTEXT.md)（用語集）と [`docs/idea`](./docs/idea) を参照。

## このプロトタイプで触れること

- **接地 / Merge** — 別々の Entity として存在する `GithubIssue` と `LinearIssue` を Merge すると、
  1 つの Entity（概念）が事後的に生まれる。同型 Component が衝突する Merge は失敗する。
- **収束** — 一方の title を編集すると System(Integration) が reconcile して他方へ揃う。
- **echo の燃料切れ** — 自分の書き込みで戻る webhook は正規形比較で no-op になり、ループが止まる。
- **並行 Conflict** — 両側にほぼ同時の編集があると機械解決せず、ユーザーに採用側を確認する。

## 構成

```
src/core/        Engine / Store(DB Adapter) / EventBus / SystemRunner / ConflictTracker / canonical
src/interfaces/  GithubInterface, LinearInterface, TitleSyncIntegration
src/mock/        モック外部サービス（webhook 発火 + 小文字化の非冪等変換）
src/server/      Bun.serve による REST API + Web UI 静的配信
src/cli/         REST を叩く CLI
web/             依存ゼロの SPA（Web UI）
```

技術前提（`docs/idea/tech_stack.md` 準拠）: Bun / TypeScript / REST。ストレージは DB Adapter で抽象化した
インメモリ実装。Interface の Bun Worker 分離・本物の外部 API 接続・DB 実体は将来課題。

## 起動

```bash
bun install
bun run start          # http://localhost:3000  (Web UI と API)
```

Web UI: ブラウザで http://localhost:3000 を開く。Entity を 2 つ選んで Merge、title をインライン編集、
「外部サービスで編集」「並行編集」ボタンで webhook を擬似し、右側の Log で収束/echo/Conflict を観察できる。

## CLI

別ターミナルで（サーバー起動中に）:

```bash
bun run logos list                                   # Entity 一覧
bun run logos show <entityId>
bun run logos merge <a> <b>                          # 接地（同型衝突なら失敗）
bun run logos set <entityId> <type> title "<value>"  # Logos 内編集 → 収束
bun run logos mock-edit <service> <externalId> title "<value>"  # 外部編集を擬似
bun run logos conflicts
bun run logos resolve <entityId> <winnerType>        # 並行Conflict を解決
bun run logos log [n]
```

## 動作シナリオ（再現手順）

seed は「同じタスクだがまだ接地していない」`GithubIssue`(ent_1) と `LinearIssue`(ent_2) を別 Entity で用意する。

1. **接地 / Merge**
   `bun run logos merge ent_1 ent_2` → ent_2 に両 Component が乗る。
   `bun run logos merge <gh> <gh2>`（GithubIssue 同士）は 409 で失敗。
2. **収束**
   `bun run logos set ent_2 GithubIssue title "Fix Login Screen"` →
   ログに `reconcile GithubIssue -> LinearIssue`、LinearIssue.title が追従。
3. **echo の燃料切れ**
   `bun run logos mock-edit github gh-1 title "fix login screen"`（Logos が書いた値の小文字版）→
   ログは `echo absorbed … no-op (fuel out)` のみ。reconcile は連鎖しない。
4. **並行 Conflict**
   `bun run logos mock-edit ...` を Web UI の「並行編集」（両サービス同時）で発火 →
   Entity が `conflict` 化し自動上書きされない。`bun run logos conflicts` で確認し、
   `bun run logos resolve ent_2 GithubIssue` で採用側を宣言して収束。

## 型チェック

```bash
bun run typecheck
```
