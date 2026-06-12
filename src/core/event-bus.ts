// EventBus — Event/Change の発行とキュー。
// docs/idea/event_flow.md: Event は短命な Component で payload を運ばず、消費と同時に削除される（地産地消）。

import type { EntityId, LogosEvent } from "./types.ts";
import { nextId } from "./store.ts";

export class EventBus {
  private queue: LogosEvent[] = [];

  /** `Event<T>` — 外部由来（Adapter が webhook から生成）。 */
  emitExternal(entity: EntityId, componentType: string, reason: string): void {
    this.queue.push({ id: nextId("evt"), entity, kind: "external", componentType, reason });
  }

  /** `Change<C>` — 内部で Component C が変更されたとき自動発行。 */
  emitChange(entity: EntityId, componentType: string, reason: string): void {
    this.queue.push({ id: nextId("evt"), entity, kind: "change", componentType, reason });
  }

  /** キュー先頭を取り出して消費（＝削除）。空なら undefined。 */
  consume(): LogosEvent | undefined {
    return this.queue.shift();
  }

  get pending(): number {
    return this.queue.length;
  }
}
