import { WorkspaceValidationError } from "../errors";

export function componentRecord(value: unknown, typeId: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new WorkspaceValidationError(`${typeId} data must be an object`);
  }
  return value as Record<string, unknown>;
}
