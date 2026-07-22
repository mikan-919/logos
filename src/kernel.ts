import { EventStore } from "./event-store";
import {
  ENTITY_TYPES,
  RELATION_TYPES,
  type ActiveContext,
  type AgentContext,
  type Component,
  type Entity,
  type EntityType,
  type Evidence,
  type EvidenceKind,
  type Hypothesis,
  type HypothesisStatus,
  type Relation,
  type RelationType,
  type SemanticEvent,
  type SemanticState,
} from "./types";

export class IdentityConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdentityConflictError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const now = (): string => new Date().toISOString();
const id = (prefix: string): string => `${prefix}_${crypto.randomUUID()}`;

function emptyState(): SemanticState {
  return {
    entities: new Map(),
    components: new Map(),
    evidence: new Map(),
    relations: new Map(),
    hypotheses: new Map(),
    merges: new Map(),
    context: { updatedAt: new Date(0).toISOString() },
    events: [],
  };
}

function applyEvent(state: SemanticState, event: SemanticEvent): void {
  state.events.push(event);
  switch (event.type) {
    case "entity.created":
      state.entities.set(event.payload.id, event.payload);
      break;
    case "component.attached":
      state.components.set(event.payload.id, event.payload);
      break;
    case "evidence.recorded":
      state.evidence.set(event.payload.id, event.payload);
      break;
    case "relation.created":
      state.relations.set(event.payload.id, event.payload);
      break;
    case "hypothesis.proposed":
      state.hypotheses.set(event.payload.id, event.payload);
      break;
    case "hypothesis.resolved": {
      const hypothesis = state.hypotheses.get(event.payload.hypothesisId);
      if (hypothesis) {
        state.hypotheses.set(hypothesis.id, {
          ...hypothesis,
          status: event.payload.status,
          resolvedAt: event.at,
        });
      }
      break;
    }
    case "context.updated":
      state.context = event.payload;
      break;
    case "agent.context_delivered":
      break;
    case "entity.merged":
      state.merges.set(event.payload.mergeId, {
        sourceEntityId: event.payload.sourceEntityId,
        targetEntityId: event.payload.targetEntityId,
        active: true,
      });
      break;
    case "entity.merge_reverted": {
      const merge = state.merges.get(event.payload.mergeId);
      if (merge) state.merges.set(event.payload.mergeId, { ...merge, active: false });
      break;
    }
  }
}

export interface ComponentInput {
  kind: string;
  provider?: Component["provider"];
  externalId?: string;
  url?: string;
  data: Record<string, unknown>;
}

export interface EvidenceInput {
  kind: EvidenceKind;
  description: string;
  source?: string;
  resolver?: string;
}

export interface HypothesisInput {
  fromEntityId: string;
  toEntityId: string;
  relationType: RelationType;
  confidence: number;
  evidenceIds: string[];
  resolver: string;
}

export class LogosKernel {
  private constructor(
    private readonly store: EventStore,
    private readonly state: SemanticState,
  ) {}

  static async open(workspace: string): Promise<LogosKernel> {
    const store = await EventStore.open(workspace);
    const state = emptyState();
    for (const event of await store.readAll()) applyEvent(state, event);
    return new LogosKernel(store, state);
  }

  private async emit(event: SemanticEvent): Promise<void> {
    await this.store.append(event);
    applyEvent(this.state, event);
  }

  private assertEntity(entityId: string): Entity {
    const entity = this.state.entities.get(entityId);
    if (!entity) throw new ValidationError(`Unknown entity: ${entityId}`);
    return entity;
  }

  private assertEvidence(evidenceIds: string[]): void {
    if (evidenceIds.length === 0) throw new ValidationError("Canonical relations require evidence");
    for (const evidenceId of evidenceIds) {
      if (!this.state.evidence.has(evidenceId)) {
        throw new ValidationError(`Unknown evidence: ${evidenceId}`);
      }
    }
  }

  async createEntity(type: EntityType, title: string): Promise<Entity> {
    if (!ENTITY_TYPES.includes(type)) throw new ValidationError(`Unsupported entity type: ${type}`);
    if (!title.trim()) throw new ValidationError("Entity title is required");
    const entity: Entity = { id: id("ent"), type, title: title.trim(), createdAt: now() };
    await this.emit({ id: id("evt"), type: "entity.created", at: entity.createdAt, payload: entity });
    return entity;
  }

  async attachComponent(entityId: string, input: ComponentInput): Promise<Component> {
    this.assertEntity(entityId);
    if (!input.kind.trim()) throw new ValidationError("Component kind is required");
    if (input.provider && input.externalId) {
      const collision = [...this.state.components.values()].find(
        (component) =>
          component.provider === input.provider &&
          component.externalId === input.externalId &&
          this.canonicalEntityId(component.entityId) !== this.canonicalEntityId(entityId),
      );
      if (collision) {
        throw new IdentityConflictError(
          `${input.provider}:${input.externalId} already represents ${collision.entityId}`,
        );
      }
    }
    const component: Component = {
      id: id("cmp"),
      entityId,
      kind: input.kind,
      data: input.data,
      observedAt: now(),
      ...(input.provider ? { provider: input.provider } : {}),
      ...(input.externalId ? { externalId: input.externalId } : {}),
      ...(input.url ? { url: input.url } : {}),
    };
    await this.emit({ id: id("evt"), type: "component.attached", at: component.observedAt, payload: component });
    return component;
  }

  async recordEvidence(input: EvidenceInput): Promise<Evidence> {
    if (!input.description.trim()) throw new ValidationError("Evidence description is required");
    const evidence: Evidence = {
      id: id("evd"),
      kind: input.kind,
      description: input.description.trim(),
      createdAt: now(),
      ...(input.source ? { source: input.source } : {}),
      ...(input.resolver ? { resolver: input.resolver } : {}),
    };
    await this.emit({ id: id("evt"), type: "evidence.recorded", at: evidence.createdAt, payload: evidence });
    return evidence;
  }

  async createRelation(
    fromEntityId: string,
    type: RelationType,
    toEntityId: string,
    evidenceIds: string[],
  ): Promise<Relation> {
    this.assertEntity(fromEntityId);
    this.assertEntity(toEntityId);
    if (!RELATION_TYPES.includes(type)) throw new ValidationError(`Unsupported relation type: ${type}`);
    this.assertEvidence(evidenceIds);
    const existing = [...this.state.relations.values()].find(
      (relation) =>
        relation.fromEntityId === fromEntityId &&
        relation.toEntityId === toEntityId &&
        relation.type === type,
    );
    if (existing) return existing;
    const relation: Relation = {
      id: id("rel"),
      fromEntityId,
      toEntityId,
      type,
      evidenceIds: [...new Set(evidenceIds)],
      createdAt: now(),
    };
    await this.emit({ id: id("evt"), type: "relation.created", at: relation.createdAt, payload: relation });
    return relation;
  }

  async proposeRelation(input: HypothesisInput): Promise<Hypothesis> {
    this.assertEntity(input.fromEntityId);
    this.assertEntity(input.toEntityId);
    for (const evidenceId of input.evidenceIds) {
      if (!this.state.evidence.has(evidenceId)) throw new ValidationError(`Unknown evidence: ${evidenceId}`);
    }
    if (input.confidence < 0 || input.confidence > 1) {
      throw new ValidationError("Hypothesis confidence must be between 0 and 1");
    }
    const hypothesis: Hypothesis = {
      id: id("hyp"),
      ...input,
      evidenceIds: [...new Set(input.evidenceIds)],
      status: "candidate",
      createdAt: now(),
    };
    await this.emit({ id: id("evt"), type: "hypothesis.proposed", at: hypothesis.createdAt, payload: hypothesis });
    return hypothesis;
  }

  async resolveHypothesis(
    hypothesisId: string,
    status: Exclude<HypothesisStatus, "candidate">,
  ): Promise<Hypothesis> {
    const hypothesis = this.state.hypotheses.get(hypothesisId);
    if (!hypothesis) throw new ValidationError(`Unknown hypothesis: ${hypothesisId}`);
    if (hypothesis.status !== "candidate") throw new ValidationError(`Hypothesis is already ${hypothesis.status}`);
    let relationId: string | undefined;
    if (status === "accepted") {
      const relation = await this.createRelation(
        hypothesis.fromEntityId,
        hypothesis.relationType,
        hypothesis.toEntityId,
        hypothesis.evidenceIds,
      );
      relationId = relation.id;
    }
    const at = now();
    await this.emit({
      id: id("evt"),
      type: "hypothesis.resolved",
      at,
      payload: { hypothesisId, status, ...(relationId ? { relationId } : {}) },
    });
    return this.state.hypotheses.get(hypothesisId)!;
  }

  async setContext(update: Omit<ActiveContext, "updatedAt">): Promise<ActiveContext> {
    for (const entityId of Object.values(update)) {
      if (entityId) this.assertEntity(entityId);
    }
    const context: ActiveContext = { ...update, updatedAt: now() };
    await this.emit({ id: id("evt"), type: "context.updated", at: context.updatedAt, payload: context });
    return context;
  }

  async mergeEntity(sourceEntityId: string, targetEntityId: string, evidenceId: string): Promise<string> {
    this.assertEntity(sourceEntityId);
    this.assertEntity(targetEntityId);
    this.assertEvidence([evidenceId]);
    if (sourceEntityId === targetEntityId) throw new ValidationError("Cannot merge an entity into itself");
    const mergeId = id("mrg");
    await this.emit({
      id: id("evt"),
      type: "entity.merged",
      at: now(),
      payload: { mergeId, sourceEntityId, targetEntityId, evidenceId },
    });
    return mergeId;
  }

  async revertMerge(mergeId: string): Promise<void> {
    const merge = this.state.merges.get(mergeId);
    if (!merge?.active) throw new ValidationError(`Unknown active merge: ${mergeId}`);
    await this.emit({ id: id("evt"), type: "entity.merge_reverted", at: now(), payload: { mergeId } });
  }

  canonicalEntityId(entityId: string): string {
    this.assertEntity(entityId);
    const visited = new Set<string>();
    let current = entityId;
    while (true) {
      if (visited.has(current)) throw new ValidationError("Merge cycle detected");
      visited.add(current);
      const merge = [...this.state.merges.values()].find(
        (candidate) => candidate.active && candidate.sourceEntityId === current,
      );
      if (!merge) return current;
      current = merge.targetEntityId;
    }
  }

  findByExternalIdentity(provider: Component["provider"], externalId: string): Entity | undefined {
    const component = [...this.state.components.values()].find(
      (candidate) => candidate.provider === provider && candidate.externalId === externalId,
    );
    return component ? this.state.entities.get(this.canonicalEntityId(component.entityId)) : undefined;
  }

  explainRelation(relationId: string): { relation: Relation; evidence: Evidence[] } {
    const relation = this.state.relations.get(relationId);
    if (!relation) throw new ValidationError(`Unknown relation: ${relationId}`);
    return {
      relation,
      evidence: relation.evidenceIds.map((evidenceId) => this.state.evidence.get(evidenceId)!),
    };
  }

  history(): SemanticEvent[] {
    return [...this.state.events];
  }

  snapshot(): {
    entities: Entity[];
    components: Component[];
    evidence: Evidence[];
    relations: Relation[];
    hypotheses: Hypothesis[];
    context: ActiveContext;
  } {
    return {
      entities: [...this.state.entities.values()],
      components: [...this.state.components.values()],
      evidence: [...this.state.evidence.values()],
      relations: [...this.state.relations.values()],
      hypotheses: [...this.state.hypotheses.values()],
      context: { ...this.state.context },
    };
  }

  agentContext(): AgentContext {
    const activeIds = new Set(Object.values(this.state.context).filter((value) => value.startsWith?.("ent_")));
    const relations = [...this.state.relations.values()].filter(
      (relation) => activeIds.has(relation.fromEntityId) || activeIds.has(relation.toEntityId),
    );
    for (const relation of relations) {
      activeIds.add(relation.fromEntityId);
      activeIds.add(relation.toEntityId);
    }
    const hypotheses = [...this.state.hypotheses.values()].filter(
      (hypothesis) =>
        hypothesis.status === "candidate" &&
        (activeIds.has(hypothesis.fromEntityId) || activeIds.has(hypothesis.toEntityId)),
    );
    const evidenceIds = new Set([
      ...relations.flatMap((relation) => relation.evidenceIds),
      ...hypotheses.flatMap((hypothesis) => hypothesis.evidenceIds),
    ]);
    return {
      active: { ...this.state.context },
      entities: [...activeIds].flatMap((entityId) => {
        const entity = this.state.entities.get(entityId);
        return entity ? [entity] : [];
      }),
      relations,
      evidence: [...evidenceIds].flatMap((evidenceId) => {
        const evidence = this.state.evidence.get(evidenceId);
        return evidence ? [evidence] : [];
      }),
      hypotheses,
    };
  }

  async deliverAgentContext(consumer: string, operation?: string): Promise<AgentContext> {
    const context = this.agentContext();
    const at = now();
    await this.emit({
      id: id("evt"),
      type: "agent.context_delivered",
      at,
      payload: {
        sessionId: id("ses"),
        consumer,
        entityIds: context.entities.map((entity) => entity.id),
        ...(operation ? { operation } : {}),
      },
    });
    return context;
  }
}
