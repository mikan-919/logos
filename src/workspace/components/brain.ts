import { WorkspaceValidationError } from "../errors";
import type { FeatureDefinition } from "../features";
import type { EventData, NameData, NoteData, TagData, TaskData, TaskPriority } from "../types";
import { scheduleDefinition } from "./schedule";
import { componentRecord } from "./shared";

function validateName(value: unknown): NameData {
  const data = componentRecord(value, "name");
  if (typeof data.value !== "string" || !data.value.trim()) {
    throw new WorkspaceValidationError("name.value must be a non-empty string");
  }
  return { value: data.value.trim() };
}

function validateTask(value: unknown): TaskData {
  const data = componentRecord(value, "task");
  if (data.status !== "todo" && data.status !== "doing" && data.status !== "done") {
    throw new WorkspaceValidationError("task.status must be todo, doing, or done");
  }
  const due = optionalDate(data.due, "task.due");
  const priority = optionalPriority(data.priority);
  const description = optionalText(data.description, "task.description");
  return {
    status: data.status,
    ...(due ? { due } : {}),
    ...(priority ? { priority } : {}),
    ...(description ? { description } : {}),
  };
}

function validateNote(value: unknown): NoteData {
  const data = componentRecord(value, "note");
  if (typeof data.body !== "string") {
    throw new WorkspaceValidationError("note.body must be a string");
  }
  return { body: data.body };
}

function validateEvent(value: unknown): EventData {
  const data = componentRecord(value, "event");
  const schedule = scheduleDefinition.validate(data);
  const location = optionalText(data.location, "event.location");
  const description = optionalText(data.description, "event.description");
  return {
    ...schedule,
    ...(location ? { location } : {}),
    ...(description ? { description } : {}),
  };
}

function optionalText(value: unknown, field: string): string | undefined {
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "string") throw new WorkspaceValidationError(`${field} must be a string`);
  return value;
}

function optionalDate(value: unknown, field: string): string | undefined {
  const date = optionalText(value, field);
  if (date === undefined) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new WorkspaceValidationError(`${field} must be a calendar date`);
  }
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new WorkspaceValidationError(`${field} must be a valid calendar date`);
  }
  return date;
}

function optionalPriority(value: unknown): TaskPriority | undefined {
  if (value === undefined || value === "") return undefined;
  if (value !== "low" && value !== "medium" && value !== "high") {
    throw new WorkspaceValidationError("task.priority must be low, medium, or high");
  }
  return value;
}

function validateTag(value: unknown): TagData {
  const data = componentRecord(value, "tag");
  if (!Array.isArray(data.entityIds) || !data.entityIds.every((id) => typeof id === "string" && id)) {
    throw new WorkspaceValidationError("tag.entityIds must be an array of entity IDs");
  }
  if (new Set(data.entityIds).size !== data.entityIds.length) {
    throw new WorkspaceValidationError("tag.entityIds must not contain duplicates");
  }
  return { entityIds: data.entityIds };
}

export const nameDefinition: FeatureDefinition<NameData> = {
  typeId: "name",
  schemaVersion: 1,
  validate: validateName,
};

export const taskDefinition: FeatureDefinition<TaskData> = {
  typeId: "task",
  schemaVersion: 1,
  initialData: () => ({ status: "todo", priority: "medium" }),
  validate: validateTask,
};

export const noteDefinition: FeatureDefinition<NoteData> = {
  typeId: "note",
  schemaVersion: 1,
  initialData: () => ({ body: "" }),
  validate: validateNote,
};

export const eventDefinition: FeatureDefinition<EventData> = {
  typeId: "event",
  schemaVersion: 1,
  validate: validateEvent,
};

export const tagDefinition: FeatureDefinition<TagData> = {
  typeId: "tag",
  schemaVersion: 1,
  initialData: () => ({ entityIds: [] }),
  validate: validateTag,
};

export const thisIsTagDefinition: FeatureDefinition<Record<string, never>> = {
  typeId: "this-is-tag",
  schemaVersion: 1,
  initialData: () => ({}),
  validate: (value) => {
    const data = componentRecord(value, "this-is-tag");
    if (Object.keys(data).length) {
      throw new WorkspaceValidationError("this-is-tag does not accept data");
    }
    return {};
  },
};
