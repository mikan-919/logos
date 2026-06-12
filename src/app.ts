// アプリ組み立て: Engine を作り、Interface を install し、seed データを投入する。

import { Engine } from "./core/engine.ts";
import { GithubInterface, githubStore } from "./interfaces/github.ts";
import { LinearInterface, linearStore } from "./interfaces/linear.ts";
import { NotionInterface, notionStore } from "./interfaces/notion.ts";
import { TitleSyncIntegration } from "./interfaces/title-sync.ts";

export function buildApp(): Engine {
  const engine = new Engine();

  GithubInterface.install(engine);
  LinearInterface.install(engine);
  NotionInterface.install(engine);
  engine.registerSystem(TitleSyncIntegration);

  seed(engine);
  return engine;
}

/**
 * seed: 「同じ概念」だがまだ接地していない 3 つの表現を別々の Entity として用意する。
 * ユーザーが Merge することで 1 つの Entity（概念）が生まれる。
 */
function seed(engine: Engine): void {
  githubStore.seed("gh-1", { title: "Fix login bug", status: "open" });
  linearStore.seed("ln-1", { title: "Fix login bug", state: "todo" });
  notionStore.seed("nt-1", { title: "Fix login bug", url: "https://notion.so/fake/nt-1" });

  engine.createComponent("GithubIssue", { externalId: "gh-1", title: "Fix login bug", status: "open" });
  engine.createComponent("LinearIssue", { externalId: "ln-1", title: "Fix login bug", state: "todo" });
  engine.createComponent("NotionPage", { externalId: "nt-1", title: "Fix login bug", url: "https://notion.so/fake/nt-1" });
}
