import { estimateDefinition, type EstimateData } from "../components/estimate";
import type { WorkspaceComponent, WorkspaceEntity, WorkspaceEntityView } from "../types";

export interface EstimateEntry {
  entity: WorkspaceEntity;
  estimate: WorkspaceComponent<EstimateData>;
}

function entityState(entity: WorkspaceEntityView): WorkspaceEntity {
  return {
    id: entity.id,
    name: entity.name,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    revision: entity.revision,
    ...(entity.archivedAt ? { archivedAt: entity.archivedAt } : {}),
  };
}

export function estimateProjection(entities: WorkspaceEntityView[]): {
  entries: EstimateEntry[];
  totalMinutes: number;
} {
  const entries = entities.flatMap((entity) => {
    const rawEstimate = entity.components.find(
      (component) => component.typeId === "estimate" && component.active,
    );
    if (!rawEstimate) return [];
    const estimate: WorkspaceComponent<EstimateData> = {
      ...rawEstimate,
      data: estimateDefinition.validate(rawEstimate.data),
    };
    return [{ entity: entityState(entity), estimate }];
  }).sort((left, right) =>
    right.estimate.data.minutes - left.estimate.data.minutes
    || left.entity.name.localeCompare(right.entity.name),
  );
  return {
    entries,
    totalMinutes: entries.reduce((total, entry) => total + entry.estimate.data.minutes, 0),
  };
}
