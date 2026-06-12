// TitleSyncIntegration — InterfaceをまたぐIntegration（ADR-0001）。
// Change<GithubIssue> / Change<LinearIssue> および外部 Event を購読し、
// 接地した GithubIssue と LinearIssue の title を reconcile（収束）させる。
//
// docs/idea/sync_and_conflict.md の判定:
//   - 正規形で同値          → no-op
//   - 片側だけ未消化(dirty) → そちらを source に相手へ反映
//   - 両側とも未消化        → 真の並行Conflict → ユーザーに返す（自動上書きしない）

import type { System } from "../core/system.ts";

const PAIR = ["GithubIssue", "LinearIssue"] as const;

export const TitleSyncIntegration: System = {
  name: "TitleSyncIntegration",
  subscribes: [...PAIR],
  reconcile({ engine }, entity) {
    if (entity.status === "conflict") {
      engine.log("noop", `${entity.id} is in conflict — reconcile skipped (待ち)`);
      return;
    }
    const gh = entity.components.get("GithubIssue");
    const ln = entity.components.get("LinearIssue");
    if (!gh || !ln) return; // まだ接地していない（1Componentのみ）→ 何もしない

    if (engine.conflict.equal(gh.fields.title, ln.fields.title)) {
      engine.log("noop", `${entity.id} titles already aligned ("${gh.fields.title}") — no-op`);
      return;
    }

    const ghDirty = engine.conflict.isDirty(entity.id, "GithubIssue");
    const lnDirty = engine.conflict.isDirty(entity.id, "LinearIssue");

    if (ghDirty && lnDirty) {
      engine.raiseConflict(entity);
      return;
    }

    const [srcType, src, dstType, dst] = ghDirty
      ? (["GithubIssue", gh, "LinearIssue", ln] as const)
      : (["LinearIssue", ln, "GithubIssue", gh] as const);

    dst.fields.title = src.fields.title;
    engine.conflict.recordWrite(entity.id, dstType, dst.fields.title);
    engine.conflict.clearDirty(entity.id, srcType);
    engine.conflict.clearDirty(entity.id, dstType);
    engine.writeBack(dstType, dst);
    engine.log(
      "reconcile",
      `${entity.id}: ${srcType} -> ${dstType}, title="${src.fields.title}" を反映`,
    );
  },
};
