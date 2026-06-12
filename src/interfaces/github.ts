// GithubInterface — GithubIssue Component 型を定義し、モック GitHub と Logos を繋ぐ。
//   - Service Adapter: モックの webhook を Logos の Event に変換（engine.ingestExternal）
//   - External Hook: Logos の Component 変更をモック GitHub へ書戻す

import type { Engine } from "../core/engine.ts";
import type { LogosInterface } from "./types.ts";
import { MockExternalStore } from "../mock/external-store.ts";

export const GITHUB_SERVICE = "github";
export const githubStore = new MockExternalStore(GITHUB_SERVICE);

export const GithubInterface: LogosInterface = {
  name: "GithubInterface",
  install(engine: Engine) {
    engine.registerSchema({
      type: "GithubIssue",
      fields: ["externalId", "title", "status"],
      service: GITHUB_SERVICE,
    });
    // Service Adapter: 外部 webhook → 内部 Event。payload は運ばず合図として渡す。
    githubStore.onWebhook((externalId, fields) => {
      engine.ingestExternal(GITHUB_SERVICE, externalId, fields);
    });
    // External Hook: Logos → 外部サービスへの書戻し。
    engine.registerHook(GITHUB_SERVICE, (externalId, fields) => {
      githubStore.write(externalId, fields);
    });
  },
};
