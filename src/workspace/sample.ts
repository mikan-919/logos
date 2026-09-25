import type { ComponentRegistry } from "./features";
import { WORKSPACE_EVENT_ENTITY_ID } from "./types";
import type {
  EventData,
  WorkspaceComponent,
  WorkspaceEntity,
  WorkspaceEvent,
  WorkspaceRelation,
} from "./types";

export interface WorkspaceSamplePlan {
  entities: WorkspaceEntity[];
  components: WorkspaceComponent[];
  relations: WorkspaceRelation[];
  events: WorkspaceEvent[];
  entityIds: string[];
}

const identifier = (prefix: string): string => `${prefix}_${crypto.randomUUID()}`;
const timestamp = (): string => new Date().toISOString();

function operationId(root: string, suffix: string): string {
  return `${root}:sample:${suffix}`;
}

function event(
  operation: string,
  entityId: string,
  command: WorkspaceEvent["command"],
  beforeRevision: number,
  afterRevision: number,
  changes: Record<string, unknown>,
  actor: string,
  at: string,
): WorkspaceEvent {
  return {
    id: identifier("wevt"),
    schemaVersion: 1,
    operationId: operation,
    entityId,
    command,
    beforeRevision,
    afterRevision,
    changes,
    actor,
    at,
  };
}

function eventData(base: Date, offsetDays: number, durationMinutes: number): EventData {
  const start = new Date(base.getTime());
  start.setUTCDate(start.getUTCDate() + offsetDays);
  start.setUTCHours(9, 0, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return {
    startUtc: start.toISOString(),
    endUtc: end.toISOString(),
    timeZone: "UTC",
  };
}

export function buildWorkspaceSample(
  rootOperationId: string,
  actor: string,
  componentRegistry: ComponentRegistry,
): WorkspaceSamplePlan {
  const entities: WorkspaceEntity[] = [];
  const components: WorkspaceComponent[] = [];
  const events: WorkspaceEvent[] = [];
  const relations: WorkspaceRelation[] = [];
  const base = new Date();

  const createEntity = (name: string, suffix: string): WorkspaceEntity => {
    const at = timestamp();
    const entity: WorkspaceEntity = {
      id: identifier("went"),
      createdAt: at,
      updatedAt: at,
      revision: 0,
    };
    const definition = componentRegistry.get<{ value: string }>("name");
    components.push({
      entityId: entity.id,
      typeId: "name",
      schemaVersion: definition.schemaVersion,
      data: definition.validate({ value: name }),
      active: true,
      createdAt: at,
      updatedAt: at,
    });
    entities.push(entity);
    events.push(event(
      operationId(rootOperationId, `${suffix}:create`),
      entity.id,
      "entity.create",
      -1,
      0,
      { entityId: entity.id, initialComponentIds: ["name"] },
      actor,
      at,
    ));
    return entity;
  };

  const addComponent = <T>(
    current: WorkspaceEntity,
    typeId: string,
    data: T,
    suffix: string,
  ): WorkspaceEntity => {
    const at = timestamp();
    const definition = componentRegistry.get<T>(typeId);
    const component: WorkspaceComponent = {
      entityId: current.id,
      typeId,
      schemaVersion: definition.schemaVersion,
      data: definition.validate(data),
      active: true,
      createdAt: at,
      updatedAt: at,
    };
    const next: WorkspaceEntity = {
      ...current,
      updatedAt: at,
      revision: current.revision + 1,
    };
    const index = entities.findIndex((entity) => entity.id === current.id);
    if (index < 0) throw new Error(`Sample entity is missing: ${current.id}`);
    entities[index] = next;
    components.push(component);
    events.push(event(
      operationId(rootOperationId, `${suffix}:${typeId}`),
      current.id,
      "component.add",
      current.revision,
      next.revision,
      { typeId, active: true, restored: false },
      actor,
      at,
    ));
    return next;
  };

  let meeting = createEntity("勉強会を開催する", "meeting");
  meeting = addComponent(meeting, "note", { body: "目的と内容を共有する。" }, "meeting");
  meeting = addComponent(meeting, "task", { status: "done" }, "meeting");
  meeting = addComponent(meeting, "event", eventData(base, 1, 90), "meeting");

  let article = createEntity("記事を書く", "article");
  article = addComponent(article, "note", { body: "勉強会で得た知見を一般化してまとめる。" }, "article");
  article = addComponent(article, "task", { status: "doing" }, "article");
  article = addComponent(article, "event", eventData(base, 2, 60), "article");

  const tag = createEntity("設計", "tag");
  addComponent(tag, "this-is-tag", {}, "tag");
  article = addComponent(article, "tag", { entityIds: [tag.id] }, "article");

  const at = timestamp();
  events.push(event(
    rootOperationId,
    WORKSPACE_EVENT_ENTITY_ID,
    "workspace.sample",
    -1,
    -1,
    {
      sampleVersion: 2,
      entityIds: entities.map((entity) => entity.id),
      entityCount: entities.length,
      componentCount: components.length,
    },
    actor,
    at,
  ));

  return {
    entities,
    components,
    relations,
    events,
    entityIds: entities.map((entity) => entity.id),
  };
}
