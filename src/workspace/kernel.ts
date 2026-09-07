import { RevisionConflictError, WorkspaceValidationError } from "./errors";
import { featureDefinition, isKnownComponentType } from "./features";
import { WorkspaceStore } from "./store";
import type {
  CommandMetadata,
  ComponentDataMap,
  ComponentTypeId,
  WorkspaceCommandName,
  WorkspaceComponent,
  WorkspaceEntity,
  WorkspaceEntityView,
  WorkspaceEvent,
} from "./types";

const identifier = (prefix: string): string => `${prefix}_${crypto.randomUUID()}`;
const timestamp = (): string => new Date().toISOString();

export interface CreateEntityMetadata {
  operationId: string;
  actor?: string;
}

function actor(metadata: { actor?: string }): string {
  return metadata.actor?.trim() || "local-user";
}

export class WorkspaceKernel {
  private constructor(private readonly store: WorkspaceStore) {}

  static async open(workspace: string): Promise<WorkspaceKernel> {
    return new WorkspaceKernel(await WorkspaceStore.open(workspace));
  }

  close(): void {
    this.store.close();
  }

  databasePath(): string {
    return this.store.path;
  }

  get(entityId: string): WorkspaceEntityView | undefined {
    return this.store.entity(entityId);
  }

  list(): WorkspaceEntityView[] {
    return this.store.entities();
  }

  history(entityId?: string): WorkspaceEvent[] {
    return this.store.events(entityId);
  }

  createEntity(name: string, metadata: CreateEntityMetadata): WorkspaceEntityView {
    const replay = this.replay(metadata.operationId, "entity.create");
    if (replay) return this.requiredEntity(replay.entityId);
    const trimmedName = name.trim();
    if (!trimmedName) throw new WorkspaceValidationError("Entity name is required");
    const at = timestamp();
    const entity: WorkspaceEntity = {
      id: identifier("went"),
      name: trimmedName,
      createdAt: at,
      updatedAt: at,
      revision: 0,
    };
    this.store.save(entity, {
      id: identifier("wevt"),
      schemaVersion: 1,
      operationId: metadata.operationId,
      entityId: entity.id,
      command: "entity.create",
      beforeRevision: -1,
      afterRevision: 0,
      changes: { entity },
      actor: actor(metadata),
      at,
    });
    return this.requiredEntity(entity.id);
  }

  renameEntity(entityId: string, name: string, metadata: CommandMetadata): WorkspaceEntityView {
    const trimmedName = name.trim();
    if (!trimmedName) throw new WorkspaceValidationError("Entity name is required");
    return this.updateEntity(entityId, "entity.rename", metadata, (entity, at) => ({
      entity: { ...entity, name: trimmedName, updatedAt: at, revision: entity.revision + 1 },
      changes: { name: { from: entity.name, to: trimmedName } },
    }));
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

  addComponent<T extends ComponentTypeId>(
    entityId: string,
    typeId: T,
    metadata: CommandMetadata,
    initialData?: ComponentDataMap[T],
  ): WorkspaceEntityView {
    return this.mutateComponent(entityId, typeId, "component.add", metadata, (current, at) => {
      if (current?.active) return { component: current, changes: { typeId, unchanged: true }, increment: false };
      const definition = featureDefinition(typeId);
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
    typeId: ComponentTypeId,
    metadata: CommandMetadata,
  ): WorkspaceEntityView {
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
    typeId: ComponentTypeId,
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

  updateComponent<T extends ComponentTypeId>(
    entityId: string,
    typeId: T,
    data: ComponentDataMap[T],
    metadata: CommandMetadata,
  ): WorkspaceEntityView {
    return this.mutateComponent(entityId, typeId, "component.update", metadata, (current, at) => {
      if (!current?.active) {
        throw new WorkspaceValidationError(`Active component not found: ${typeId}`);
      }
      const definition = featureDefinition(typeId);
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
    typeId: ComponentTypeId,
    command: WorkspaceCommandName,
    metadata: CommandMetadata,
    change: (
      current: WorkspaceComponent | undefined,
      at: string,
    ) => { component: WorkspaceComponent; changes: Record<string, unknown>; increment: boolean },
  ): WorkspaceEntityView {
    if (!isKnownComponentType(typeId)) {
      throw new WorkspaceValidationError(`Unknown component type: ${typeId}`);
    }
    const replay = this.replay(metadata.operationId, command);
    if (replay) return this.requiredEntity(replay.entityId);
    const currentEntity = this.requiredEntity(entityId);
    this.assertRevision(currentEntity, metadata.expectedRevision);
    const at = timestamp();
    const result = change(this.store.component(entityId, typeId), at);
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
    this.store.save(nextEntity, event, result.component);
    return this.requiredEntity(entityId);
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

  private requiredEntity(entityId: string): WorkspaceEntityView {
    const entity = this.store.entity(entityId);
    if (!entity) throw new WorkspaceValidationError(`Unknown entity: ${entityId}`);
    return entity;
  }

  private assertRevision(entity: WorkspaceEntity, expectedRevision: number): void {
    if (entity.revision !== expectedRevision) {
      throw new RevisionConflictError(entity.id, expectedRevision, entity.revision);
    }
  }
}

export { RevisionConflictError, WorkspaceValidationError };
