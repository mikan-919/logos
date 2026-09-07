import { WorkspaceValidationError } from "../errors";
import type { FeatureDefinition } from "../features";
import { componentRecord } from "./shared";

export interface EstimateData {
  minutes: number;
}

function validateEstimate(value: unknown): EstimateData {
  const data = componentRecord(value, "estimate");
  if (!Number.isInteger(data.minutes) || (data.minutes as number) <= 0) {
    throw new WorkspaceValidationError("estimate.minutes must be a positive integer");
  }
  return { minutes: data.minutes as number };
}

export const estimateDefinition: FeatureDefinition<EstimateData> = {
  typeId: "estimate",
  schemaVersion: 1,
  validate: validateEstimate,
};
