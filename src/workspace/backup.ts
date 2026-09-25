import { WorkspaceValidationError } from "./errors";
import type { ComponentRegistry } from "./features";
import {
  WORKSPACE_EVENT_ENTITY_ID,
  type WorkspaceCommandName,
  type WorkspaceComponent,
  type WorkspaceEntity,
  type WorkspaceEvent,
  type WorkspaceExport,
  type WorkspaceRelation,
} from "./types";

export const WORKSPACE_EXPORT_FORMAT = "logos.workspace" as const;
export const WORKSPACE_EXPORT_VERSION = 2 as const;

const commands: readonly WorkspaceCommandName[] = [
  "entity.create",
  "entity.rename",
  "entity.archive",
  "entity.restore",
  "component.add",
  "component.disable",
  "component.restore",
  "component.update",
  "relation.add",
  "relation.remove",
  "workspace.sample",
  "workspace.restore",
];

type RecordValue = Record<string, unknown>;

function record(value: unknown, label: string): RecordValue {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new WorkspaceValidationError(`${label} must be an object`);
  }
  return value as RecordValue;
}

function stringValue(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new WorkspaceValidationError(`${label} must be a non-empty string`);
  }
  return value;
}

function optionalString(value: RecordValue, key: string, label: string): string | undefined {
  if (!(key in value)) return undefined;
  return stringValue(value[key], label);
}

function integerValue(value: unknown, label: string, minimum?: number): number {
  if (!Number.isInteger(value) || (minimum !== undefined && (value as number) < minimum)) {
    const suffix = minimum === undefined ? "an integer" : `an integer greater than or equal to ${minimum}`;
    throw new WorkspaceValidationError(`${label} must be ${suffix}`);
  }
  return value as number;
}

function booleanValue(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new WorkspaceValidationError(`${label} must be a boolean`);
  return value;
}

function arrayValue(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new WorkspaceValidationError(`${label} must be an array`);
  return value;
}

function jsonValue(value: unknown, label: string): void {
  try {
    if (JSON.stringify(value) === undefined) throw new Error("undefined JSON value");
  } catch {
    throw new WorkspaceValidationError(`${label} must contain JSON data`);
  }
}

function unique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new WorkspaceValidationError(`${label} must not contain duplicates`);
  }
}

function parseEntity(value: unknown, index: number): { entity: WorkspaceEntity; legacyName?: string } {
  const item = record(value, `entities[${index}]`);
  const archivedAt = optionalString(item, "archivedAt", `entities[${index}].archivedAt`);
  const legacyName = item.name === undefined
    ? undefined
    : stringValue(item.name, `entities[${index}].name`);
  return {
    entity: {
      id: stringValue(item.id, `entities[${index}].id`),
      createdAt: stringValue(item.createdAt, `entities[${index}].createdAt`),
      updatedAt: stringValue(item.updatedAt, `entities[${index}].updatedAt`),
      revision: integerValue(item.revision, `entities[${index}].revision`, 0),
      ...(archivedAt === undefined ? {} : { archivedAt }),
    },
    ...(legacyName === undefined ? {} : { legacyName }),
  };
}

function parseComponent(
  value: unknown,
  index: number,
  entityIds: Set<string>,
  componentRegistry: ComponentRegistry,
): WorkspaceComponent {
  const item = record(value, `components[${index}]`);
  const entityId = stringValue(item.entityId, `components[${index}].entityId`);
  if (!entityIds.has(entityId)) {
    throw new WorkspaceValidationError(`components[${index}] refers to an unknown entity`);
  }
  const typeId = stringValue(item.typeId, `components[${index}].typeId`);
  const schemaVersion = integerValue(item.schemaVersion, `components[${index}].schemaVersion`, 1);
  const active = booleanValue(item.active, `components[${index}].active`);
  const disabledAt = optionalString(item, "disabledAt", `components[${index}].disabledAt`);
  jsonValue(item.data, `components[${index}].data`);
  const data = componentRegistry.has(typeId)
    ? componentRegistry.get(typeId).validate(item.data)
    : item.data;
  if (componentRegistry.has(typeId) && schemaVersion !== componentRegistry.get(typeId).schemaVersion) {
    throw new WorkspaceValidationError(
      `Unsupported schema version for ${typeId}: ${schemaVersion}`,
    );
  }
  return {
    entityId,
    typeId,
    schemaVersion,
    data,
    active,
    createdAt: stringValue(item.createdAt, `components[${index}].createdAt`),
    updatedAt: stringValue(item.updatedAt, `components[${index}].updatedAt`),
    ...(disabledAt === undefined ? {} : { disabledAt }),
  };
}

function upgradeLegacyComponent(value: unknown, index: number, migrate: boolean): unknown {
  const item = record(value, `components[${index}]`);
  if (!migrate) return item;
  if (item.typeId === "body") {
    const body = record(item.data, `components[${index}].data`);
    return { ...item, typeId: "note", data: { body: body.markdown } };
  }
  if (item.typeId === "progress") return { ...item, typeId: "task" };
  if (item.typeId === "schedule") return { ...item, typeId: "event" };
  return item;
}

function parseRelation(
  value: unknown,
  index: number,
  entityIds: Set<string>,
): WorkspaceRelation {
  const item = record(value, `relations[${index}]`);
  const fromEntityId = stringValue(item.fromEntityId, `relations[${index}].fromEntityId`);
  const toEntityId = stringValue(item.toEntityId, `relations[${index}].toEntityId`);
  if (!entityIds.has(fromEntityId) || !entityIds.has(toEntityId)) {
    throw new WorkspaceValidationError(`relations[${index}] refers to an unknown entity`);
  }
  if (fromEntityId === toEntityId) {
    throw new WorkspaceValidationError(`relations[${index}] cannot refer to itself`);
  }
  if (item.type !== "references") {
    throw new WorkspaceValidationError(`relations[${index}].type must be references`);
  }
  const removedAt = optionalString(item, "removedAt", `relations[${index}].removedAt`);
  return {
    id: stringValue(item.id, `relations[${index}].id`),
    fromEntityId,
    toEntityId,
    type: "references",
    active: booleanValue(item.active, `relations[${index}].active`),
    createdAt: stringValue(item.createdAt, `relations[${index}].createdAt`),
    updatedAt: stringValue(item.updatedAt, `relations[${index}].updatedAt`),
    createdBy: stringValue(item.createdBy, `relations[${index}].createdBy`),
    createdOperationId: stringValue(item.createdOperationId, `relations[${index}].createdOperationId`),
    ...(removedAt === undefined ? {} : { removedAt }),
  };
}

function parseEvent(value: unknown, index: number, entityIds: Set<string>): WorkspaceEvent {
  const item = record(value, `events[${index}]`);
  const entityId = stringValue(item.entityId, `events[${index}].entityId`);
  const command = item.command;
  if (typeof command !== "string" || !commands.includes(command as WorkspaceCommandName)) {
    throw new WorkspaceValidationError(`events[${index}].command is not supported`);
  }
  if (command === "workspace.sample" || command === "workspace.restore") {
    if (entityId !== WORKSPACE_EVENT_ENTITY_ID) {
      throw new WorkspaceValidationError(`events[${index}] has an invalid workspace entity ID`);
    }
  } else if (!entityIds.has(entityId)) {
    throw new WorkspaceValidationError(`events[${index}] refers to an unknown entity`);
  }
  const changes = record(item.changes, `events[${index}].changes`);
  jsonValue(changes, `events[${index}].changes`);
  return {
    id: stringValue(item.id, `events[${index}].id`),
    schemaVersion: item.schemaVersion === 1
      ? 1
      : (() => { throw new WorkspaceValidationError(`events[${index}].schemaVersion must be 1`); })(),
    operationId: stringValue(item.operationId, `events[${index}].operationId`),
    entityId,
    command: command as WorkspaceCommandName,
    beforeRevision: integerValue(item.beforeRevision, `events[${index}].beforeRevision`),
    afterRevision: integerValue(item.afterRevision, `events[${index}].afterRevision`),
    changes,
    actor: stringValue(item.actor, `events[${index}].actor`),
    at: stringValue(item.at, `events[${index}].at`),
  };
}

export function validateWorkspaceExport(
  value: unknown,
  componentRegistry: ComponentRegistry,
): WorkspaceExport {
  const item = record(value, "workspace export");
  if (item.format !== WORKSPACE_EXPORT_FORMAT) {
    throw new WorkspaceValidationError(`Unsupported workspace export format: ${String(item.format)}`);
  }
  if (item.version !== 1 && item.version !== WORKSPACE_EXPORT_VERSION) {
    throw new WorkspaceValidationError(`Unsupported workspace export version: ${String(item.version)}`);
  }
  const parsedEntities = arrayValue(item.entities, "entities").map(parseEntity);
  const entities = parsedEntities.map(({ entity }) => entity);
  const entityIds = entities.map((entity) => entity.id);
  unique(entityIds, "entities");
  const entityIdSet = new Set(entityIds);

  const components = arrayValue(item.components, "components").map((component, index) =>
    parseComponent(upgradeLegacyComponent(component, index, item.version === 1), index, entityIdSet, componentRegistry),
  );
  for (const { entity, legacyName } of parsedEntities) {
    if (components.some((component) => component.entityId === entity.id && component.typeId === "name")) {
      continue;
    }
    if (!legacyName) {
      throw new WorkspaceValidationError(`Entity ${entity.id} is missing its Name component`);
    }
    const name = componentRegistry.get<{ value: string }>("name").validate({ value: legacyName });
    components.push({
      entityId: entity.id,
      typeId: "name",
      schemaVersion: componentRegistry.get("name").schemaVersion,
      data: name,
      active: true,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
  for (const entity of entities) {
    const name = components.find((component) => component.entityId === entity.id && component.typeId === "name");
    if (!name?.active) {
      throw new WorkspaceValidationError(`Entity ${entity.id} must have an active Name component`);
    }
  }
  const tagEntityIds = new Set(components.flatMap((component) =>
    component.active && component.typeId === "this-is-tag" ? [component.entityId] : [],
  ));
  for (const component of components) {
    if (!component.active || component.typeId !== "tag") continue;
    const tagIds = (component.data as { entityIds: string[] }).entityIds;
    for (const tagId of tagIds) {
      if (!entityIdSet.has(tagId) || !tagEntityIds.has(tagId) || tagId === component.entityId) {
        throw new WorkspaceValidationError(`Component ${component.entityId}/tag refers to an invalid Tag entity`);
      }
    }
  }
  unique(components.map((component) => `${component.entityId}\u0000${component.typeId}`), "components");

  const relations = arrayValue(item.relations, "relations").map((relation, index) =>
    parseRelation(relation, index, entityIdSet),
  );
  unique(relations.map((relation) => relation.id), "relations");
  unique(
    relations.map((relation) => `${relation.fromEntityId}\u0000${relation.toEntityId}\u0000${relation.type}`),
    "relations",
  );

  const events = arrayValue(item.events, "events").map((event, index) =>
    parseEvent(event, index, entityIdSet),
  );
  unique(events.map((event) => event.id), "events");
  unique(events.map((event) => event.operationId), "events");

  return {
    format: WORKSPACE_EXPORT_FORMAT,
    version: WORKSPACE_EXPORT_VERSION,
    exportedAt: stringValue(item.exportedAt, "exportedAt"),
    entities,
    components,
    relations,
    events,
  };
}
