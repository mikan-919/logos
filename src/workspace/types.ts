export const COMPONENT_TYPE_IDS = ["body", "progress", "schedule"] as const;

export type ComponentTypeId = (typeof COMPONENT_TYPE_IDS)[number];
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

export interface ComponentDataMap {
  body: BodyData;
  progress: ProgressData;
  schedule: ScheduleData;
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

export type WorkspaceCommandName =
  | "entity.create"
  | "entity.rename"
  | "entity.archive"
  | "entity.restore"
  | "component.add"
  | "component.disable"
  | "component.restore"
  | "component.update";

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
