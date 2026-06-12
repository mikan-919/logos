// アプリ組み立て: Engine を作り、Interface を install し、seed データを投入する。

import { Engine } from "./core/engine.ts";
import { GithubInterface, githubStore } from "./interfaces/github.ts";
import { LinearInterface, linearStore } from "./interfaces/linear.ts";
import { TitleSyncIntegration } from "./interfaces/title-sync.ts";

export function buildApp(): Engine {
  const engine = new Engine();

  // Interface のインストール（スキーマ宣言 + Adapter + External Hook の配線）。
  GithubInterface.install(engine);
  LinearInterface.install(engine);
  // Integration の登録（InterfaceをまたぐSystem）。
  engine.registerSystem(TitleSyncIntegration);

  seed(engine);
  return engine;
}

/**
 * seed: 「同じ概念」だがまだ接地していない 2 つの表現を別々の Entity として用意する。
 * ユーザーが Merge することで初めて 1 つの Entity（概念）が生まれる。
 */
function seed(engine: Engine): void {
  githubStore.seed("gh-1", { title: "Fix login bug", status: "open" });
  linearStore.seed("ln-1", { title: "Fix login bug", state: "todo" });

  engine.createComponent("GithubIssue", { externalId: "gh-1", title: "Fix login bug", status: "open" });
  engine.createComponent("LinearIssue", { externalId: "ln-1", title: "Fix login bug", state: "todo" });
}
