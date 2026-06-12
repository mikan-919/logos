// LinearInterface — LinearIssue Component 型を定義し、モック Linear と Logos を繋ぐ。

import type { Engine } from "../core/engine.ts";
import type { LogosInterface } from "./types.ts";
import { MockExternalStore } from "../mock/external-store.ts";

export const LINEAR_SERVICE = "linear";
export const linearStore = new MockExternalStore(LINEAR_SERVICE);

export const LinearInterface: LogosInterface = {
  name: "LinearInterface",
  install(engine: Engine) {
    engine.registerSchema({
      type: "LinearIssue",
      fields: ["externalId", "title", "state"],
      service: LINEAR_SERVICE,
    });
    linearStore.onWebhook((externalId, fields) => {
      engine.ingestExternal(LINEAR_SERVICE, externalId, fields);
    });
    engine.registerHook(LINEAR_SERVICE, (externalId, fields) => {
      linearStore.write(externalId, fields);
    });
  },
};
