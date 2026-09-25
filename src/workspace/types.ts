export type TaskStatus = "todo" | "doing" | "done";
export type ProgressStatus = TaskStatus;
export type TaskPriority = "low" | "medium" | "high";

export const WORKSPACE_EVENT_ENTITY_ID = "__workspace__" as const;

export interface BodyData {
  markdown: string;
}

export interface NameData {
  value: string;
}

export interface TaskData {
  status: TaskStatus;
  due?: string;
  priority?: TaskPriority;
  description?: string;
}

export interface NoteData {
  body: string;
}

export interface TagData {
  entityIds: string[];
}

export interface ProgressData {
  status: ProgressStatus;
}

export interface EventData {
  startUtc: string;
  endUtc: string;
  timeZone: string;
  location?: string;
  description?: string;
}

export type ScheduleData = EventData;

export interface WorkspaceEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  archivedAt?: string;
}

export interface WorkspaceEntitySummary extends WorkspaceEntity {
  name: string;
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

export interface WorkspaceEntityView extends WorkspaceEntitySummary {
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
  entity: WorkspaceEntitySummary;
  event: WorkspaceComponent<EventData>;
  task?: WorkspaceComponent<TaskData>;
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
  | "relation.remove"
  | "workspace.sample"
  | "workspace.restore";

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

export interface WorkspaceExport {
  format: "logos.workspace";
  version: 1 | 2;
  exportedAt: string;
  entities: WorkspaceEntity[];
  components: WorkspaceComponent[];
  relations: WorkspaceRelation[];
  events: WorkspaceEvent[];
}

export interface WorkspaceSampleResult {
  operationId: string;
  replayed: boolean;
  entities: WorkspaceEntityView[];
}

export interface CommandMetadata {
  operationId: string;
  expectedRevision: number;
  actor?: string;
}
