// Store — DB Adapter の抽象とインメモリ実装。
// docs/idea/tech_stack.md: ストレージは DB Adapter で抽象化し、後でクラウド/self-hosted に差し替えられる。
// docs/idea/first_logic.md / CONTEXT.md の制約:
//   - 1 Entity 内に同型 Component は 1 つだけ
//   - Component が全て無くなった Entity は自動削除される

import type { Component, Entity, EntityId } from "./types.ts";

export interface DBAdapter {
  createEntity(): Entity;
  getEntity(id: EntityId): Entity | undefined;
  allEntities(): Entity[];
  deleteEntity(id: EntityId): void;
  /** 型フィルタ（ADR-0002: Component型ベースのクエリ）。 */
  query(hasType?: string): Entity[];
}

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}_${counter.toString(36)}`;
}

export class InMemoryStore implements DBAdapter {
  private entities = new Map<EntityId, Entity>();

  createEntity(): Entity {
    const entity: Entity = { id: nextId("ent"), components: new Map(), status: "ok" };
    this.entities.set(entity.id, entity);
    return entity;
  }

  getEntity(id: EntityId): Entity | undefined {
    return this.entities.get(id);
  }

  allEntities(): Entity[] {
    return [...this.entities.values()];
  }

  deleteEntity(id: EntityId): void {
    this.entities.delete(id);
  }

  query(hasType?: string): Entity[] {
    const all = this.allEntities();
    if (!hasType) return all;
    return all.filter((e) => e.components.has(hasType));
  }

  /**
   * 一意性制約を守って Component を追加する。同型が既にあれば置き換え（更新）。
   */
  putComponent(entity: Entity, component: Component): void {
    entity.components.set(component.type, component);
  }

  /**
   * Component を削除し、Entity が空になったら自動削除する。
   * @returns Entity が削除されたら true。
   */
  removeComponent(entity: Entity, type: string): boolean {
    entity.components.delete(type);
    if (entity.components.size === 0) {
      this.deleteEntity(entity.id);
      return true;
    }
    return false;
  }
}

export { nextId };
