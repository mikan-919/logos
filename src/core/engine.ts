// Engine (World) — Store / EventBus / ConflictTracker / SystemRunner を束ねる Logos コア。
// CONTEXT.md / docs/idea/first_logic.md の語彙と制約に従う。

import type { Component, ComponentSchema, Entity, EntityId, LogLine } from "./types.ts";
import { InMemoryStore } from "./store.ts";
import { EventBus } from "./event-bus.ts";
import { ConflictTracker } from "./conflict.ts";
import { SystemRunner, type System } from "./system.ts";

/** 外部サービスへの書戻し（External Hook）。Interface が登録する。 */
export type ExternalHook = (externalId: string, fields: Record<string, unknown>) => void;

/** 並行Conflict のレコード（ユーザー解決待ち）。 */
export interface Conflict {
  entityId: EntityId;
  /** type -> 現在値（どちらを採るかユーザーが選ぶ）。 */
  sides: { type: string; title: unknown }[];
}

export class Engine {
  readonly store = new InMemoryStore();
  readonly bus = new EventBus();
  readonly conflict = new ConflictTracker();
  readonly runner = new SystemRunner();

  private schemas = new Map<string, ComponentSchema>();
  private hooks = new Map<string, ExternalHook>();
  private logs: LogLine[] = [];
  private conflicts = new Map<EntityId, Conflict>();

  // ---- 登録 (Interface 用) ----
  registerSchema(schema: ComponentSchema): void {
    this.schemas.set(schema.type, schema);
  }
  getSchema(type: string): ComponentSchema | undefined {
    return this.schemas.get(type);
  }
  registerSystem(system: System): void {
    this.runner.register(system);
  }
  registerHook(service: string, hook: ExternalHook): void {
    this.hooks.set(service, hook);
  }

  // ---- ログ ----
  log(level: LogLine["level"], message: string): void {
    this.logs.push({ ts: Date.now(), level, message });
    if (this.logs.length > 500) this.logs.shift();
  }
  recentLogs(n = 50): LogLine[] {
    return this.logs.slice(-n);
  }

  // ---- Entity / Component 操作 ----

  /**
   * 孤立 Component を1つ持つ Entity を作る。
   * docs: Component（サービス上の表現）が先にあり、Entity は後から宣言で生まれる。
   */
  createComponent(type: string, fields: Record<string, unknown>): Entity {
    const entity = this.store.createEntity();
    const component: Component = { type, fields: { ...fields } };
    this.store.putComponent(entity, component);
    // 観測の基準値を記録（以後の echo 判定に使う）。
    this.conflict.recordWrite(entity.id, type, fields.title);
    this.log("info", `created ${type} on ${entity.id} ("${fields.title ?? ""}")`);
    return entity;
  }

  /**
   * Merge — 2 Entity を統合。a の全 Component を b へ移し、a を削除する。
   * 両方に同型 Component があれば失敗（ユーザーに返す）。
   */
  merge(aId: EntityId, bId: EntityId): { ok: true; entity: Entity } | { ok: false; conflictType: string } {
    const a = this.store.getEntity(aId);
    const b = this.store.getEntity(bId);
    if (!a || !b) throw new Error("entity not found");
    if (a.id === b.id) throw new Error("cannot merge an entity with itself");
    for (const type of a.components.keys()) {
      if (b.components.has(type)) {
        this.log("conflict", `merge failed: both have ${type}`);
        return { ok: false, conflictType: type };
      }
    }
    for (const [type, comp] of a.components) {
      this.store.putComponent(b, comp);
    }
    this.store.deleteEntity(a.id);
    this.log("info", `merged ${a.id} into ${b.id}`);
    // 統合直後に整合を確認（接地した Component 同士を reconcile）。
    for (const type of b.components.keys()) {
      this.bus.emitChange(b.id, type, "post-merge reconcile");
    }
    this.runner.drain(this);
    return { ok: true, entity: b };
  }

  /**
   * Logos 内編集。Component を更新し、外部サービスへ書戻し、Change を発行して reconcile。
   */
  editComponent(entityId: EntityId, type: string, fields: Record<string, unknown>): void {
    const entity = this.store.getEntity(entityId);
    if (!entity) throw new Error("entity not found");
    const comp = entity.components.get(type);
    if (!comp) throw new Error(`no ${type} on ${entityId}`);
    comp.fields = { ...comp.fields, ...fields };
    // 自分が書いた値として記録（この後返ってくる webhook を echo として吸収）。
    this.conflict.recordWrite(entityId, type, comp.fields.title);
    // ユーザー編集なので「未消化の変更」としてマーク（reconcile の source になる）。
    this.conflict.markEdited(entityId, type);
    this.log("info", `internal edit ${type} on ${entityId} -> "${fields.title}"`);
    this.bus.emitChange(entityId, type, "internal edit");
    this.runner.drain(this);
    // 編集を所属サービスへも書戻す（返ってくる webhook は echo として吸収される）。
    this.writeBack(type, comp);
  }

  /**
   * 外部サービス由来の変更を取り込む（Adapter が webhook から呼ぶ）。
   * payload は運ばず、現在値を観測して echo/changed を分類する。
   */
  ingestExternal(service: string, externalId: string, fields: Record<string, unknown>): void {
    const found = this.findByExternalId(service, externalId);
    if (!found) {
      this.log("info", `webhook for unknown ${service}:${externalId} ignored`);
      return;
    }
    const { entity, type } = found;
    const comp = entity.components.get(type)!;
    const verdict = this.conflict.classify(entity.id, type, fields.title);
    if (verdict === "echo") {
      this.log("noop", `echo absorbed on ${entity.id}/${type} ("${fields.title}") — no-op (fuel out)`);
      return;
    }
    // 実際に新しい値。Logos 側 Component を観測値で更新し、Change/Event を発行。
    comp.fields = { ...comp.fields, ...fields };
    this.log("info", `external change ${service}:${externalId} -> "${fields.title}"`);
    this.bus.emitExternal(entity.id, type, `${service} changed`);
  }

  /** 複数の外部編集をまとめて取り込んでから1回だけ drain（並行編集の再現）。 */
  ingestExternalBatch(edits: { service: string; externalId: string; fields: Record<string, unknown> }[]): void {
    for (const e of edits) this.ingestExternal(e.service, e.externalId, e.fields);
    this.runner.drain(this);
  }

  // ---- Conflict 解決 ----
  raiseConflict(entity: Entity): void {
    entity.status = "conflict";
    const sides = [...entity.components.entries()]
      .filter(([, c]) => "title" in c.fields)
      .map(([type, c]) => ({ type, title: c.fields.title }));
    this.conflicts.set(entity.id, { entityId: entity.id, sides });
    this.log("conflict", `parallel conflict on ${entity.id}: ${sides.map((s) => `${s.type}="${s.title}"`).join(" vs ")}`);
  }

  listConflicts(): Conflict[] {
    return [...this.conflicts.values()];
  }

  /** ユーザーが採用する側(type)を宣言して解決。全 Component をその値に揃える。 */
  resolveConflict(entityId: EntityId, winnerType: string): void {
    const entity = this.store.getEntity(entityId);
    if (!entity) throw new Error("entity not found");
    const winner = entity.components.get(winnerType);
    if (!winner) throw new Error(`no ${winnerType}`);
    const title = winner.fields.title;
    for (const [type, comp] of entity.components) {
      if (!("title" in comp.fields)) continue;
      comp.fields.title = title;
      this.conflict.recordWrite(entityId, type, title);
      this.writeBack(type, comp);
    }
    entity.status = "ok";
    this.conflicts.delete(entityId);
    this.log("info", `conflict on ${entityId} resolved with ${winnerType} ("${title}")`);
  }

  // ---- 内部ヘルパ ----

  /** Component の現在値を所属サービスの外部ストアへ書戻す（External Hook）。 */
  writeBack(type: string, comp: Component): void {
    const schema = this.schemas.get(type);
    if (!schema?.service) return;
    const hook = this.hooks.get(schema.service);
    const externalId = comp.fields.externalId as string | undefined;
    if (hook && externalId) hook(externalId, comp.fields);
  }

  private findByExternalId(service: string, externalId: string): { entity: Entity; type: string } | undefined {
    for (const entity of this.store.allEntities()) {
      for (const [type, comp] of entity.components) {
        const schema = this.schemas.get(type);
        if (schema?.service === service && comp.fields.externalId === externalId) {
          return { entity, type };
        }
      }
    }
    return undefined;
  }
}
