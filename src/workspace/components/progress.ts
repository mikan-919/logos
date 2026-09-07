import { WorkspaceValidationError } from "../errors";
import type { ProgressData } from "../types";
import type { FeatureDefinition } from "../features";
import { componentRecord } from "./shared";

function validateProgress(value: unknown): ProgressData {
  const data = componentRecord(value, "progress");
  if (data.status !== "todo" && data.status !== "doing" && data.status !== "done") {
    throw new WorkspaceValidationError("progress.status must be todo, doing, or done");
  }
  return { status: data.status };
}

export const progressDefinition: FeatureDefinition<ProgressData> = {
  typeId: "progress",
  schemaVersion: 1,
  initialData: () => ({ status: "todo" }),
  validate: validateProgress,
};
