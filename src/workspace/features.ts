import { WorkspaceValidationError } from "./errors";
import { bodyDefinition } from "./components/body";
import { progressDefinition } from "./components/progress";
import { scheduleDefinition } from "./components/schedule";
import { estimateDefinition } from "./components/estimate";

export interface FeatureDefinition<T = unknown> {
  typeId: string;
  schemaVersion: number;
  initialData?: () => T;
  validate: (data: unknown) => T;
}

export class ComponentRegistry {
  private readonly definitions = new Map<string, FeatureDefinition>();

  constructor(definitions: FeatureDefinition[] = []) {
    for (const definition of definitions) this.register(definition);
  }

  register<T>(definition: FeatureDefinition<T>): this {
    if (!definition.typeId.trim()) {
      throw new WorkspaceValidationError("Component typeId is required");
    }
    if (this.definitions.has(definition.typeId)) {
      throw new WorkspaceValidationError(`Duplicate component type: ${definition.typeId}`);
    }
    this.definitions.set(definition.typeId, definition as FeatureDefinition);
    return this;
  }

  has(typeId: string): boolean {
    return this.definitions.has(typeId);
  }

  get<T = unknown>(typeId: string): FeatureDefinition<T> {
    const definition = this.definitions.get(typeId);
    if (!definition) throw new WorkspaceValidationError(`Unknown component type: ${typeId}`);
    return definition as FeatureDefinition<T>;
  }

  typeIds(): string[] {
    return [...this.definitions.keys()];
  }
}

export const workspaceComponentRegistry = new ComponentRegistry([
  bodyDefinition,
  progressDefinition,
  scheduleDefinition,
  estimateDefinition,
]);
