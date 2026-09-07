export type ProgressStatus = "todo" | "doing" | "done";

export interface BodyData {
  markdown: string;
}

export interface ProgressData {
  status: ProgressStatus;
}

export interface ScheduleData {
  startUtc: string;
  endUtc: string;
  timeZone: string;
}

export interface WorkspaceEntity {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  archivedAt?: string;
}

export interface WorkspaceComponent<T = unknown> {
  entityId: string;
  typeId: string;
  schemaVersion: number;
  data: T;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  disabledAt?: string;
}

export interface WorkspaceEntityView extends WorkspaceEntity {
  components: WorkspaceComponent[];
}

export interface WorkspaceRelation {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  type: "references";
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdOperationId: string;
  removedAt?: string;
}

export interface WorkspaceReferences {
  outgoing: WorkspaceRelation[];
  incoming: WorkspaceRelation[];
}

export interface EntityQuery {
  name?: string;
  hasProgress?: boolean;
  progress?: ProgressStatus;
  includeArchived?: boolean;
}

export interface CalendarEntry {
  entity: WorkspaceEntity;
  schedule: WorkspaceComponent<ScheduleData>;
  progress?: WorkspaceComponent<ProgressData>;
}

export type WorkspaceCommandName =
  | "entity.create"
  | "entity.rename"
  | "entity.archive"
  | "entity.restore"
  | "component.add"
  | "component.disable"
  | "component.restore"
  | "component.update"
  | "relation.add"
  | "relation.remove";

export interface WorkspaceEvent {
  id: string;
  schemaVersion: 1;
  operationId: string;
  entityId: string;
  command: WorkspaceCommandName;
  beforeRevision: number;
  afterRevision: number;
  changes: Record<string, unknown>;
  actor: string;
  at: string;
}

export interface CommandMetadata {
  operationId: string;
  expectedRevision: number;
  actor?: string;
}
