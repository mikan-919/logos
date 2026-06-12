// TitleSyncIntegration — InterfaceをまたぐIntegration（ADR-0001）。
// title フィールドを持つ全 Component を対象に N-way reconcile する。
//
// docs/idea/sync_and_conflict.md の判定:
//   - 全タイトル正規形で同値          → no-op
//   - dirty が 1 つ                  → そこを source に全他 Component へ反映
//   - dirty が 2 つ以上              → 真の並行Conflict → ユーザーに返す（自動上書きしない）

import type { System } from "../core/system.ts";

export const TitleSyncIntegration: System = {
  name: "TitleSyncIntegration",
  subscribes: ["GithubIssue", "LinearIssue", "NotionPage"],
  reconcile({ engine }, entity) {
    if (entity.status === "conflict") {
      engine.log("noop", `${entity.id} is in conflict — reconcile skipped (待ち)`);
      return;
    }

    const titleComps = [...entity.components.values()].filter((c) => "title" in c.fields);
    if (titleComps.length < 2) return;

    const firstTitle = titleComps[0]!.fields.title as string;
    if (titleComps.every((c) => engine.conflict.equal(c.fields.title as string, firstTitle))) {
      engine.log("noop", `${entity.id} titles aligned ("${firstTitle}") — no-op`);
      return;
    }

    const dirtyComps = titleComps.filter((c) => engine.conflict.isDirty(entity.id, c.type));

    if (dirtyComps.length > 1) {
      engine.raiseConflict(entity);
      return;
    }
    if (dirtyComps.length === 0) return;

    const src = dirtyComps[0]!;
    for (const dst of titleComps) {
      if (dst.type === src.type) continue;
      dst.fields.title = src.fields.title;
      engine.conflict.recordWrite(entity.id, dst.type, dst.fields.title as string);
      engine.conflict.clearDirty(entity.id, dst.type);
      engine.writeBack(dst.type, dst);
      engine.log("reconcile", `${entity.id}: ${src.type} -> ${dst.type}, title="${src.fields.title}" を反映`);
    }
    engine.conflict.clearDirty(entity.id, src.type);
  },
};
