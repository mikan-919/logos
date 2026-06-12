import { drizzle } from "drizzle-orm/bun-sqlite";
import { eq, and, inArray, gte } from "drizzle-orm";
import { entities, components, changeLog } from "./db/schema";

type DB = ReturnType<typeof drizzle>;

function now() {
  return new Date();
}

function uuid() {
  return crypto.randomUUID();
}

export function createWorld(db: DB) {
  function createEntity(): string {
    const id = uuid();
    db.insert(entities).values({ id, createdAt: now() }).run();
    return id;
  }

  function setComponent(
    entityId: string,
    type: string,
    data: unknown,
    origin: string,
    authority: "external" | "internal" = "internal"
  ): void {
    const existing = db
      .select()
      .from(components)
      .where(and(eq(components.entityId, entityId), eq(components.type, type)))
      .get();

    const ts = now();

    db.transaction((tx) => {
      if (existing) {
        tx
          .update(components)
          .set({ data, origin, authority, updatedAt: ts })
          .where(eq(components.id, existing.id))
          .run();
      } else {
        tx
          .insert(components)
          .values({
            id: uuid(),
            entityId,
            type,
            data,
            origin,
            authority,
            createdAt: ts,
            updatedAt: ts,
          })
          .run();
      }

      tx
        .insert(changeLog)
        .values({
          id: uuid(),
          entityId,
          componentType: type,
          op: existing ? "update" : "create",
          dataBefore: existing ? existing.data : null,
          dataAfter: data,
          origin,
          at: ts,
        })
        .run();
    });
  }

  function removeComponent(entityId: string, type: string, origin: string): void {
    const existing = db
      .select()
      .from(components)
      .where(and(eq(components.entityId, entityId), eq(components.type, type)))
      .get();

    if (!existing) return;

    db.transaction((tx) => {
      tx
        .delete(components)
        .where(eq(components.id, existing.id))
        .run();

      tx
        .insert(changeLog)
        .values({
          id: uuid(),
          entityId,
          componentType: type,
          op: "delete",
          dataBefore: existing.data,
          dataAfter: null,
          origin,
          at: now(),
        })
        .run();
    });
  }

  // Returns entity ids that have ALL of the given component types
  function query(types: string[]): string[] {
    if (types.length === 0) return [];

    const result = db
      .select({ entityId: components.entityId, type: components.type })
      .from(components)
      .where(inArray(components.type, types))
      .all();

    const entityTypes = new Map<string, Set<string>>();
    for (const row of result) {
      if (!entityTypes.has(row.entityId)) entityTypes.set(row.entityId, new Set());
      entityTypes.get(row.entityId)!.add(row.type);
    }

    return Array.from(entityTypes.entries())
      .filter(([, t]) => types.every((type) => t.has(type)))
      .map(([id]) => id);
  }

  function getComponents(entityId: string): Array<{ type: string; data: unknown }> {
    return db
      .select({ type: components.type, data: components.data })
      .from(components)
      .where(eq(components.entityId, entityId))
      .all();
  }

  function getChanges(since: Date): typeof changeLog.$inferSelect[] {
    return db
      .select()
      .from(changeLog)
      .where(gte(changeLog.at, since))
      .all();
  }

  // Move all components from `fromId` to `toId`, then delete `fromId`.
  // Fails if both entities have a component of the same type.
  function merge(toId: string, fromId: string, origin: string): void {
    const toComps = db.select().from(components).where(eq(components.entityId, toId)).all();
    const fromComps = db.select().from(components).where(eq(components.entityId, fromId)).all();

    const toTypes = new Set(toComps.map((c) => c.type));
    const conflict = fromComps.find((c) => toTypes.has(c.type));
    if (conflict) {
      throw new Error(`Merge conflict: both entities have component type "${conflict.type}"`);
    }

    const ts = now();
    db.transaction((tx) => {
      for (const comp of fromComps) {
        tx.update(components).set({ entityId: toId, updatedAt: ts }).where(eq(components.id, comp.id)).run();
        tx.insert(changeLog).values({
          id: uuid(),
          entityId: toId,
          componentType: comp.type,
          op: "create",
          dataBefore: null,
          dataAfter: comp.data,
          origin,
          at: ts,
        }).run();
      }
      tx.delete(entities).where(eq(entities.id, fromId)).run();
    });
  }

  return { createEntity, setComponent, removeComponent, query, getComponents, getChanges, merge };
}

export type World = ReturnType<typeof createWorld>;
