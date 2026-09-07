import { WorkspaceValidationError } from "../errors";
import type { BodyData } from "../types";
import type { FeatureDefinition } from "../features";
import { componentRecord } from "./shared";

function validateBody(value: unknown): BodyData {
  const data = componentRecord(value, "body");
  if (typeof data.markdown !== "string") {
    throw new WorkspaceValidationError("body.markdown must be a string");
  }
  return { markdown: data.markdown };
}

export const bodyDefinition: FeatureDefinition<BodyData> = {
  typeId: "body",
  schemaVersion: 1,
  initialData: () => ({ markdown: "" }),
  validate: validateBody,
};
