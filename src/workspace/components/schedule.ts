import { WorkspaceValidationError } from "../errors";
import type { ScheduleData } from "../types";
import type { FeatureDefinition } from "../features";
import { componentRecord } from "./shared";

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
  const data = componentRecord(value, "schedule");
  const startUtc = utcInstant(data.startUtc, "schedule.startUtc");
  const endUtc = utcInstant(data.endUtc, "schedule.endUtc");
  if (Date.parse(endUtc) <= Date.parse(startUtc)) {
    throw new WorkspaceValidationError("schedule.endUtc must be after schedule.startUtc");
  }
  return { startUtc, endUtc, timeZone: timeZone(data.timeZone) };
}

export const scheduleDefinition: FeatureDefinition<ScheduleData> = {
  typeId: "schedule",
  schemaVersion: 1,
  validate: validateSchedule,
};
