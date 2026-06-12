// System / Integration の登録と SystemRunner。
// docs/idea/event_flow.md: System は Event を購読し、起動時に Component の現在値を読み直して reconcile する。
// SystemRunner はキューが空になる（＝燃料切れ）までドレインする。

import type { Engine } from "./engine.ts";
import type { Entity, LogosEvent } from "./types.ts";

export interface SystemContext {
  engine: Engine;
}

/** System — Event<T>/Change<C> を購読し Component を reconcile するユニット。 */
export interface System {
  name: string;
  /** この Component 型に関する Event/Change を購読する。 */
  subscribes: string[];
  /** 起動。entity の現在値を読み直して整合を取る。 */
  reconcile(ctx: SystemContext, entity: Entity, event: LogosEvent): void;
}

export class SystemRunner {
  private systems: System[] = [];

  register(system: System): void {
    this.systems.push(system);
  }

  /** キューを空になるまで処理する（収束モデル: 書き込みが無ければ次 Event も無く、自然に止まる）。 */
  drain(engine: Engine): void {
    let guard = 0;
    let event: LogosEvent | undefined;
    while ((event = engine.bus.consume())) {
      if (guard++ > 1000) {
        engine.log("info", "drain guard tripped (>1000 events) — 設計上の無限ループの疑い");
        break;
      }
      const entity = engine.store.getEntity(event.entity);
      if (!entity) continue; // 既に削除された Entity 宛ての合図は無視
      engine.log(
        "event",
        `${event.kind === "external" ? "Event" : "Change"}<${event.componentType}> on ${entity.id} — ${event.reason}`,
      );
      for (const sys of this.systems) {
        if (sys.subscribes.includes(event.componentType)) {
          sys.reconcile({ engine }, entity, event);
        }
      }
    }
  }
}
