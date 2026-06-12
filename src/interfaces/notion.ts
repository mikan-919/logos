// NotionInterface — NotionPage Component 型を定義し、モック Notion と Logos を繋ぐ。
//   - Service Adapter: モックの webhook を Logos の Event に変換（engine.ingestExternal）
//   - External Hook: Logos の Component 変更をモック Notion へ書戻す

import type { Engine } from "../core/engine.ts";
import type { LogosInterface } from "./types.ts";
import { MockExternalStore } from "../mock/external-store.ts";

export const NOTION_SERVICE = "notion";
export const notionStore = new MockExternalStore(NOTION_SERVICE);

export const NotionInterface: LogosInterface = {
  name: "NotionInterface",
  install(engine: Engine) {
    engine.registerSchema({
      type: "NotionPage",
      fields: ["externalId", "title", "url"],
      service: NOTION_SERVICE,
    });
    notionStore.onWebhook((externalId, fields) => {
      engine.ingestExternal(NOTION_SERVICE, externalId, fields);
    });
    engine.registerHook(NOTION_SERVICE, (externalId, fields) => {
      notionStore.write(externalId, fields);
    });
  },
};
