import { WorkspaceValidationError } from "./errors";
import type {
  BodyData,
  ComponentDataMap,
  ComponentTypeId,
  ProgressData,
  ScheduleData,
} from "./types";

export interface FeatureDefinition<T> {
  typeId: ComponentTypeId;
  schemaVersion: number;
  initialData?: () => T;
  validate: (data: unknown) => T;
}

function record(value: unknown, typeId: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new WorkspaceValidationError(`${typeId} data must be an object`);
  }
  return value as Record<string, unknown>;
}

function validateBody(value: unknown): BodyData {
  const data = record(value, "body");
  if (typeof data.markdown !== "string") {
    throw new WorkspaceValidationError("body.markdown must be a string");
  }
  return { markdown: data.markdown };
}

function validateProgress(value: unknown): ProgressData {
  const data = record(value, "progress");
  if (data.status !== "todo" && data.status !== "doing" && data.status !== "done") {
    throw new WorkspaceValidationError("progress.status must be todo, doing, or done");
  }
  return { status: data.status };
}

function utcInstant(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    throw new WorkspaceValidationError(`${field} must be an ISO 8601 UTC timestamp`);
  }
  const time = Date.parse(value);
  if (!Number.isFinite(time)) {
    throw new WorkspaceValidationError(`${field} must be a valid timestamp`);
  }
  return new Date(time).toISOString();
}

function timeZone(value: unknown): string {
  if (typeof value !== "string" || !value) {
    throw new WorkspaceValidationError("schedule.timeZone must be an IANA time zone");
  }
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
  } catch {
    throw new WorkspaceValidationError("schedule.timeZone must be an IANA time zone");
  }
  return value;
}

function validateSchedule(value: unknown): ScheduleData {
  const data = record(value, "schedule");
  const startUtc = utcInstant(data.startUtc, "schedule.startUtc");
  const endUtc = utcInstant(data.endUtc, "schedule.endUtc");
  if (Date.parse(endUtc) <= Date.parse(startUtc)) {
    throw new WorkspaceValidationError("schedule.endUtc must be after schedule.startUtc");
  }
  return { startUtc, endUtc, timeZone: timeZone(data.timeZone) };
}

const definitions: { [K in ComponentTypeId]: FeatureDefinition<ComponentDataMap[K]> } = {
  body: {
    typeId: "body",
    schemaVersion: 1,
    initialData: () => ({ markdown: "" }),
    validate: validateBody,
  },
  progress: {
    typeId: "progress",
    schemaVersion: 1,
    initialData: () => ({ status: "todo" }),
    validate: validateProgress,
  },
  schedule: {
    typeId: "schedule",
    schemaVersion: 1,
    validate: validateSchedule,
  },
};

export function featureDefinition<T extends ComponentTypeId>(
  typeId: T,
): FeatureDefinition<ComponentDataMap[T]> {
  return definitions[typeId];
}

export function isKnownComponentType(typeId: string): typeId is ComponentTypeId {
  return Object.hasOwn(definitions, typeId);
}
