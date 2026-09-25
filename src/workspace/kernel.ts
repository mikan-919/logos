import { RevisionConflictError, WorkspaceValidationError } from "./errors";
import { validateWorkspaceExport } from "./backup";
import { ComponentRegistry, workspaceComponentRegistry } from "./features";
import { buildWorkspaceSample } from "./sample";
import { WorkspaceStore } from "./store";
import { nameDefinition } from "./components/brain";
import { workspaceView, workspaceViews, type WorkspaceViewDefinition } from "./views";
import { WORKSPACE_EVENT_ENTITY_ID } from "./types";
import type {
  CommandMetadata,
  CalendarEntry,
  EntityQuery,
  EventData,
  NameData,
  ProgressData,
  TagData,
  TaskData,
  WorkspaceCommandName,
  WorkspaceComponent,
  WorkspaceEntity,
  WorkspaceEntityView,
  WorkspaceEvent,
  WorkspaceExport,
  WorkspaceReferences,
  WorkspaceRelation,
  WorkspaceSampleResult,
} from "./types";

const identifier = (prefix: string): string => `${prefix}_${crypto.randomUUID()}`;
const timestamp = (): string => new Date().toISOString();

export interface CreateEntityMetadata {
  operationId: string;
  actor?: string;
}

export interface CreateComponentInput {
  typeId: string;
  data: unknown;
}

export interface RestoreWorkspaceMetadata {
  operationId: string;
  actor?: string;
}

export interface SampleWorkspaceMetadata {
  operationId: string;
  actor?: string;
}

function actor(metadata: { actor?: string }): string {
  return metadata.actor?.trim() || "local-user";
}

function withNameComponent(registry: ComponentRegistry): ComponentRegistry {
  if (registry.has("name")) return registry;
  const combined = new ComponentRegistry([nameDefinition]);
  for (const typeId of registry.typeIds()) combined.register(registry.get(typeId));
  return combined;
}

export class WorkspaceKernel {
  private constructor(
    private readonly store: WorkspaceStore,
    private readonly componentRegistry: ComponentRegistry,
  ) {}

  static async open(
    workspace: string,
    componentRegistry: ComponentRegistry = workspaceComponentRegistry,
  ): Promise<WorkspaceKernel> {
    return new WorkspaceKernel(await WorkspaceStore.open(workspace), withNameComponent(componentRegistry));
  }

  static async restoreFromExport(
    workspace: string,
    value: unknown,
    metadata: RestoreWorkspaceMetadata,
    componentRegistry: ComponentRegistry = workspaceComponentRegistry,
  ): Promise<WorkspaceKernel> {
    if (!metadata.operationId.trim()) throw new WorkspaceValidationError("operationId is required");
    const registry = withNameComponent(componentRegistry);
    const snapshot = validateWorkspaceExport(value, registry);
    const store = await WorkspaceStore.open(workspace);
    try {
      const previous = store.eventByOperation(metadata.operationId);
      if (previous) {
        if (previous.command !== "workspace.restore") {
          throw new WorkspaceValidationError(
            `operationId ${metadata.operationId} was already used for ${previous.command}`,
          );
        }
        return new WorkspaceKernel(store, registry);
      }
      if (snapshot.events.some((event) => event.operationId === metadata.operationId)) {
        throw new WorkspaceValidationError(
          `operationId ${metadata.operationId} is already present in the workspace export`,
        );
      }
      const at = timestamp();
      store.restore(snapshot, {
        id: identifier("wevt"),
        schemaVersion: 1,
        operationId: metadata.operationId,
        entityId: WORKSPACE_EVENT_ENTITY_ID,
        command: "workspace.restore",
        beforeRevision: -1,
        afterRevision: -1,
        changes: {
          sourceFormat: snapshot.format,
          sourceVersion: snapshot.version,
          sourceExportedAt: snapshot.exportedAt,
          entityCount: snapshot.entities.length,
          componentCount: snapshot.components.length,
          relationCount: snapshot.relations.length,
          eventCount: snapshot.events.length,
        },
        actor: actor(metadata),
        at,
      });
      return new WorkspaceKernel(store, registry);
    } catch (error) {
      store.close();
      throw error;
    }
  }

  close(): void {
    this.store.close();
  }

  databasePath(): string {
    return this.store.path;
  }

  componentTypeIds(): string[] {
    return this.componentRegistry.typeIds();
  }

  viewDefinitions(): WorkspaceViewDefinition[] {
    return workspaceViews;
  }

  exportWorkspace(): WorkspaceExport {
    return this.store.exportWorkspace(timestamp());
  }

  seedSample(metadata: SampleWorkspaceMetadata): WorkspaceSampleResult {
    if (!metadata.operationId.trim()) throw new WorkspaceValidationError("operationId is required");
    const previous = this.store.eventByOperation(metadata.operationId);
    if (previous) {
      if (previous.command !== "workspace.sample") {
        throw new WorkspaceValidationError(
          `operationId ${metadata.operationId} was already used for ${previous.command}`,
        );
      }
      return this.sampleResult(previous, true);
    }
    if (!this.store.isEmpty()) {
      throw new WorkspaceValidationError("Sample data requires an empty workspace");
    }
    const plan = buildWorkspaceSample(metadata.operationId, actor(metadata), this.componentRegistry);
    this.store.saveSample(plan.entities, plan.components, plan.relations, plan.events);
    return {
      operationId: metadata.operationId,
      replayed: false,
      entities: plan.entityIds.map((entityId) => this.requiredEntity(entityId)),
    };
  }

  get(entityId: string): WorkspaceEntityView | undefined {
    return this.store.entity(entityId);
  }

  list(query: EntityQuery = {}): WorkspaceEntityView[] {
    const name = query.name?.trim().toLocaleLowerCase();
    return this.store.entities().filter((entity) => {
      if (!query.includeArchived && entity.archivedAt) return false;
      if (name && !entity.name.toLocaleLowerCase().includes(name)) return false;
      const progress = entity.components.find(
        (component) => (component.typeId === "task" || component.typeId === "progress") && component.active,
      ) as WorkspaceComponent<ProgressData> | undefined;
      if (query.hasProgress !== undefined && Boolean(progress) !== query.hasProgress) return false;
      if (query.progress && progress?.data.status !== query.progress) return false;
      return true;
    });
  }

  query(requiredComponents: string[], query: EntityQuery = {}): WorkspaceEntityView[] {
    const required = [...new Set(requiredComponents)];
    return this.list(query).filter((entity) =>
      required.every((typeId) => entity.components.some(
        (component) => component.typeId === typeId && component.active,
      )),
    );
  }

  view(id: string, extraRequirements: string[] = []): {
    definition: WorkspaceViewDefinition;
    entities: WorkspaceEntityView[];
  } | undefined {
    const definition = workspaceView(id);
    if (!definition) return undefined;
    return {
      definition,
      entities: this.query([...definition.requires, ...extraRequirements]),
    };
  }

  history(entityId?: string): WorkspaceEvent[] {
    return this.store.events(entityId);
  }

  references(entityId: string): WorkspaceReferences {
    this.requiredEntity(entityId);
    return this.store.references(entityId);
  }

  calendar(startUtc: string, endUtc: string): CalendarEntry[] {
    const start = Date.parse(startUtc);
    const end = Date.parse(endUtc);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      throw new WorkspaceValidationError("Calendar range must have a valid start and later end");
    }
    return this.query(["name", "event"]).flatMap((entity) => {
      const rawEvent = entity.components.find(
        (component) => component.typeId === "event" && component.active,
      );
      if (!rawEvent) return [];
      const eventData = this.componentRegistry.get<EventData>("event").validate(rawEvent.data);
      if (Date.parse(eventData.startUtc) >= end || Date.parse(eventData.endUtc) <= start) {
        return [];
      }
      const event: WorkspaceComponent<EventData> = { ...rawEvent, data: eventData };
      const rawTask = entity.components.find(
        (component) => component.typeId === "task" && component.active,
      );
      const task = rawTask
        ? { ...rawTask, data: this.componentRegistry.get<TaskData>("task").validate(rawTask.data) }
        : undefined;
      return [{
        entity: {
          id: entity.id,
          name: entity.name,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
          revision: entity.revision,
          ...(entity.archivedAt ? { archivedAt: entity.archivedAt } : {}),
        },
        event,
        ...(task ? { task } : {}),
      }];
    }).sort((left, right) =>
      left.event.data.startUtc.localeCompare(right.event.data.startUtc)
      || left.entity.name.localeCompare(right.entity.name),
    );
  }

  createEntity(
    name: string,
    metadata: CreateEntityMetadata,
    initialComponents: CreateComponentInput[] = [],
  ): WorkspaceEntityView {
    const replay = this.replay(metadata.operationId, "entity.create");
    if (replay) return this.requiredEntity(replay.entityId);
    const trimmedName = name.trim();
    if (!trimmedName) throw new WorkspaceValidationError("Entity name is required");
    const at = timestamp();
    const entity: WorkspaceEntity = {
      id: identifier("went"),
      createdAt: at,
      updatedAt: at,
      revision: 0,
    };
    const seen = new Set(["name"]);
    const components: WorkspaceComponent[] = [{
      entityId: entity.id,
      typeId: "name",
      schemaVersion: this.componentRegistry.get<NameData>("name").schemaVersion,
      data: this.componentRegistry.get<NameData>("name").validate({ value: trimmedName }),
      active: true,
      createdAt: at,
      updatedAt: at,
    }];
    for (const input of initialComponents) {
      if (seen.has(input.typeId)) {
        throw new WorkspaceValidationError(`Duplicate initial component: ${input.typeId}`);
      }
      seen.add(input.typeId);
      const definition = this.componentRegistry.get(input.typeId);
      const data = input.data ?? definition.initialData?.();
      if (data === undefined) {
        throw new WorkspaceValidationError(`Initial data is required for ${input.typeId}`);
      }
      const component: WorkspaceComponent = {
        entityId: entity.id,
        typeId: input.typeId,
        schemaVersion: definition.schemaVersion,
        data: definition.validate(data),
        active: true,
        createdAt: at,
        updatedAt: at,
      };
      if (input.typeId === "tag") this.validateTagReferences(entity.id, component.data as TagData);
      components.push(component);
    }
    this.store.save(entity, {
      id: identifier("wevt"),
      schemaVersion: 1,
      operationId: metadata.operationId,
      entityId: entity.id,
      command: "entity.create",
      beforeRevision: -1,
      afterRevision: 0,
      changes: { entityId: entity.id, initialComponents: components.map(({ typeId }) => typeId) },
      actor: actor(metadata),
      at,
    }, components);
    return this.requiredEntity(entity.id);
  }

  renameEntity(entityId: string, name: string, metadata: CommandMetadata): WorkspaceEntityView {
    const trimmedName = name.trim();
    if (!trimmedName) throw new WorkspaceValidationError("Entity name is required");
    const replay = this.replay(metadata.operationId, "entity.rename");
    if (replay) return this.requiredEntity(replay.entityId);
    const current = this.requiredEntity(entityId);
    this.assertRevision(current, metadata.expectedRevision);
    const at = timestamp();
    const next: WorkspaceEntity = {
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: at,
      revision: current.revision + 1,
      ...(current.archivedAt ? { archivedAt: current.archivedAt } : {}),
    };
    const nameComponent = this.store.component(entityId, "name");
    if (!nameComponent?.active) {
      throw new WorkspaceValidationError("Entity must have an active Name component");
    }
    const nextName: WorkspaceComponent = {
      ...nameComponent,
      data: this.componentRegistry.get<NameData>("name").validate({ value: trimmedName }),
      updatedAt: at,
    };
    this.store.save(next, this.event(
      "entity.rename",
      metadata,
      current.revision,
      next.revision,
      entityId,
      { name: { from: current.name, to: trimmedName } },
      at,
    ), [nextName]);
    return this.requiredEntity(entityId);
  }

  archiveEntity(entityId: string, metadata: CommandMetadata): WorkspaceEntityView {
    return this.updateEntity(entityId, "entity.archive", metadata, (entity, at) => ({
      entity: { ...entity, archivedAt: at, updatedAt: at, revision: entity.revision + 1 },
      changes: { archivedAt: at },
    }));
  }

  restoreEntity(entityId: string, metadata: CommandMetadata): WorkspaceEntityView {
    return this.updateEntity(entityId, "entity.restore", metadata, (entity, at) => {
      const { archivedAt: _, ...rest } = entity;
      return {
        entity: { ...rest, updatedAt: at, revision: entity.revision + 1 },
        changes: { archivedAt: null },
      };
    });
  }

  addComponent<T = unknown>(
    entityId: string,
    typeId: string,
    metadata: CommandMetadata,
    initialData?: T,
  ): WorkspaceEntityView {
    return this.mutateComponent(entityId, typeId, "component.add", metadata, (current, at) => {
      if (current?.active) return { component: current, changes: { typeId, unchanged: true }, increment: false };
      const definition = this.componentRegistry.get<T>(typeId);
      const data = current?.data ?? initialData ?? definition.initialData?.();
      if (data === undefined) {
        throw new WorkspaceValidationError(`Initial data is required for ${typeId}`);
      }
      const component: WorkspaceComponent = {
        entityId,
        typeId,
        schemaVersion: definition.schemaVersion,
        data: definition.validate(data),
        active: true,
        createdAt: current?.createdAt ?? at,
        updatedAt: at,
      };
      return {
        component,
        changes: { typeId, active: true, restored: Boolean(current) },
        increment: true,
      };
    });
  }

  disableComponent(
    entityId: string,
    typeId: string,
    metadata: CommandMetadata,
  ): WorkspaceEntityView {
    if (typeId === "name") {
      throw new WorkspaceValidationError("Name is required for every entity");
    }
    if (typeId === "this-is-tag" && this.store.entities().some((entity) => {
      const tag = entity.components.find((component) => component.typeId === "tag" && component.active);
      return Array.isArray((tag?.data as TagData | undefined)?.entityIds)
        && (tag!.data as TagData).entityIds.includes(entityId);
    })) {
      throw new WorkspaceValidationError("This entity is used as a Tag");
    }
    return this.mutateComponent(entityId, typeId, "component.disable", metadata, (current, at) => {
      if (!current?.active) {
        throw new WorkspaceValidationError(`Active component not found: ${typeId}`);
      }
      return {
        component: { ...current, active: false, updatedAt: at, disabledAt: at },
        changes: { typeId, active: false },
        increment: true,
      };
    });
  }

  restoreComponent(
    entityId: string,
    typeId: string,
    metadata: CommandMetadata,
  ): WorkspaceEntityView {
    return this.mutateComponent(entityId, typeId, "component.restore", metadata, (current, at) => {
      if (!current || current.active) {
        throw new WorkspaceValidationError(`Disabled component not found: ${typeId}`);
      }
      const { disabledAt: _, ...rest } = current;
      return {
        component: { ...rest, active: true, updatedAt: at },
        changes: { typeId, active: true },
        increment: true,
      };
    });
  }

  updateComponent<T = unknown>(
    entityId: string,
    typeId: string,
    data: T,
    metadata: CommandMetadata,
  ): WorkspaceEntityView {
    return this.mutateComponent(entityId, typeId, "component.update", metadata, (current, at) => {
      if (!current?.active) {
        throw new WorkspaceValidationError(`Active component not found: ${typeId}`);
      }
      const definition = this.componentRegistry.get<T>(typeId);
      const validated = definition.validate(data);
      return {
        component: {
          ...current,
          schemaVersion: definition.schemaVersion,
          data: validated,
          updatedAt: at,
        },
        changes: { typeId, data: validated },
        increment: true,
      };
    });
  }

  addReference(
    fromEntityId: string,
    toEntityId: string,
    metadata: CommandMetadata,
  ): WorkspaceRelation {
    if (fromEntityId === toEntityId) {
      throw new WorkspaceValidationError("An entity cannot reference itself");
    }
    this.requiredEntity(toEntityId);
    return this.mutateRelation(
      fromEntityId,
      toEntityId,
      "relation.add",
      metadata,
      (current, at) => {
        if (current?.active) {
          return { relation: current, changes: { toEntityId, unchanged: true }, increment: false };
        }
        let relation: WorkspaceRelation;
        if (current) {
          const { removedAt: _, ...retained } = current;
          relation = { ...retained, active: true, updatedAt: at };
        } else {
          relation = {
              id: identifier("wrel"),
              fromEntityId,
              toEntityId,
              type: "references",
              active: true,
              createdAt: at,
              updatedAt: at,
              createdBy: actor(metadata),
              createdOperationId: metadata.operationId,
          };
        }
        return {
          relation,
          changes: { toEntityId, active: true, restored: Boolean(current) },
          increment: true,
        };
      },
    );
  }

  removeReference(
    fromEntityId: string,
    toEntityId: string,
    metadata: CommandMetadata,
  ): WorkspaceRelation {
    return this.mutateRelation(
      fromEntityId,
      toEntityId,
      "relation.remove",
      metadata,
      (current, at) => {
        if (!current?.active) {
          throw new WorkspaceValidationError(`Active reference not found: ${toEntityId}`);
        }
        return {
          relation: { ...current, active: false, updatedAt: at, removedAt: at },
          changes: { toEntityId, active: false },
          increment: true,
        };
      },
    );
  }

  private updateEntity(
    entityId: string,
    command: WorkspaceCommandName,
    metadata: CommandMetadata,
    change: (
      entity: WorkspaceEntity,
      at: string,
    ) => { entity: WorkspaceEntity; changes: Record<string, unknown> },
  ): WorkspaceEntityView {
    const replay = this.replay(metadata.operationId, command);
    if (replay) return this.requiredEntity(replay.entityId);
    const current = this.requiredEntity(entityId);
    this.assertRevision(current, metadata.expectedRevision);
    const at = timestamp();
    const result = change(current, at);
    const event = this.event(command, metadata, current.revision, result.entity.revision, entityId, result.changes, at);
    this.store.save(result.entity, event);
    return this.requiredEntity(entityId);
  }

  private mutateComponent(
    entityId: string,
    typeId: string,
    command: WorkspaceCommandName,
    metadata: CommandMetadata,
    change: (
      current: WorkspaceComponent | undefined,
      at: string,
    ) => { component: WorkspaceComponent; changes: Record<string, unknown>; increment: boolean },
  ): WorkspaceEntityView {
    if (!this.componentRegistry.has(typeId)) {
      throw new WorkspaceValidationError(`Unknown component type: ${typeId}`);
    }
    const replay = this.replay(metadata.operationId, command);
    if (replay) return this.requiredEntity(replay.entityId);
    const currentEntity = this.requiredEntity(entityId);
    this.assertRevision(currentEntity, metadata.expectedRevision);
    const at = timestamp();
    const result = change(this.store.component(entityId, typeId), at);
    if (typeId === "tag" && result.component.active) {
      this.validateTagReferences(entityId, result.component.data as TagData);
    }
    const nextEntity: WorkspaceEntity = result.increment
      ? { ...currentEntity, updatedAt: at, revision: currentEntity.revision + 1 }
      : currentEntity;
    const event = this.event(
      command,
      metadata,
      currentEntity.revision,
      nextEntity.revision,
      entityId,
      result.changes,
      at,
    );
    this.store.save(nextEntity, event, [result.component]);
    return this.requiredEntity(entityId);
  }

  private mutateRelation(
    fromEntityId: string,
    toEntityId: string,
    command: "relation.add" | "relation.remove",
    metadata: CommandMetadata,
    change: (
      current: WorkspaceRelation | undefined,
      at: string,
    ) => { relation: WorkspaceRelation; changes: Record<string, unknown>; increment: boolean },
  ): WorkspaceRelation {
    const replay = this.replay(metadata.operationId, command);
    if (replay) {
      const replayToEntityId = replay.changes.toEntityId;
      if (typeof replayToEntityId !== "string") {
        throw new WorkspaceValidationError(`Reference event is missing its target: ${replay.id}`);
      }
      const relation = this.store.relation(replay.entityId, replayToEntityId);
      if (!relation) throw new WorkspaceValidationError(`Reference not found: ${replayToEntityId}`);
      return relation;
    }
    const currentEntity = this.requiredEntity(fromEntityId);
    this.assertRevision(currentEntity, metadata.expectedRevision);
    const at = timestamp();
    const result = change(this.store.relation(fromEntityId, toEntityId), at);
    const nextEntity: WorkspaceEntity = result.increment
      ? { ...currentEntity, updatedAt: at, revision: currentEntity.revision + 1 }
      : currentEntity;
      this.store.save(
      nextEntity,
      this.event(
        command,
        metadata,
        currentEntity.revision,
        nextEntity.revision,
        fromEntityId,
        result.changes,
        at,
      ),
      [],
      result.relation,
    );
    return result.relation;
  }

  private event(
    command: WorkspaceCommandName,
    metadata: CommandMetadata,
    beforeRevision: number,
    afterRevision: number,
    entityId: string,
    changes: Record<string, unknown>,
    at: string,
  ): WorkspaceEvent {
    return {
      id: identifier("wevt"),
      schemaVersion: 1,
      operationId: metadata.operationId,
      entityId,
      command,
      beforeRevision,
      afterRevision,
      changes,
      actor: actor(metadata),
      at,
    };
  }

  private replay(operationId: string, command: WorkspaceCommandName): WorkspaceEvent | undefined {
    if (!operationId.trim()) throw new WorkspaceValidationError("operationId is required");
    const event = this.store.eventByOperation(operationId);
    if (event && event.command !== command) {
      throw new WorkspaceValidationError(
        `operationId ${operationId} was already used for ${event.command}`,
      );
    }
    return event;
  }

  private sampleResult(event: WorkspaceEvent, replayed: boolean): WorkspaceSampleResult {
    const entityIds = event.changes.entityIds;
    if (!Array.isArray(entityIds) || !entityIds.every((entityId) => typeof entityId === "string")) {
      throw new WorkspaceValidationError(`Sample event is missing entity IDs: ${event.id}`);
    }
    return {
      operationId: event.operationId,
      replayed,
      entities: entityIds.map((entityId) => this.requiredEntity(entityId)),
    };
  }

  private requiredEntity(entityId: string): WorkspaceEntityView {
    const entity = this.store.entity(entityId);
    if (!entity) throw new WorkspaceValidationError(`Unknown entity: ${entityId}`);
    return entity;
  }

  private validateTagReferences(entityId: string, tag: TagData): void {
    for (const tagEntityId of tag.entityIds) {
      if (tagEntityId === entityId) {
        throw new WorkspaceValidationError("An entity cannot tag itself");
      }
      const target = this.store.entity(tagEntityId);
      if (!target) throw new WorkspaceValidationError(`Unknown Tag entity: ${tagEntityId}`);
      if (!target.components.some((component) => component.typeId === "this-is-tag" && component.active)) {
        throw new WorkspaceValidationError(`Entity is not marked as a Tag: ${tagEntityId}`);
      }
    }
  }

  private assertRevision(entity: WorkspaceEntity, expectedRevision: number): void {
    if (entity.revision !== expectedRevision) {
      throw new RevisionConflictError(entity.id, expectedRevision, entity.revision);
    }
  }
}

export { RevisionConflictError, WorkspaceValidationError };
