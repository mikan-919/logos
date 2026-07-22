export const ENTITY_TYPES = [
  "Project",
  "Feature",
  "WorkItem",
  "Requirement",
  "Repository",
  "Branch",
  "Commit",
  "PullRequest",
  "Decision",
  "Release",
  "Person",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export const RELATION_TYPES = [
  "belongsTo",
  "implements",
  "derivesFrom",
  "blocks",
  "dependsOn",
  "references",
  "discusses",
  "documents",
  "releasedAs",
  "authoredBy",
] as const;

export type RelationType = (typeof RELATION_TYPES)[number];
export type EvidenceKind =
  | "operation"
  | "external-reference"
  | "external-structure"
  | "local-rule"
  | "temporal"
  | "text"
  | "agent"
  | "human";

export interface Entity {
  id: string;
  type: EntityType;
  title: string;
  createdAt: string;
}

export interface Component {
  id: string;
  entityId: string;
  kind: string;
  provider?: "github" | "linear" | "local";
  externalId?: string;
  url?: string;
  data: Record<string, unknown>;
  observedAt: string;
}

export interface Evidence {
  id: string;
  kind: EvidenceKind;
  description: string;
  source?: string;
  resolver?: string;
  createdAt: string;
}

export interface Relation {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  type: RelationType;
  evidenceIds: string[];
  createdAt: string;
}

export type HypothesisStatus = "candidate" | "accepted" | "rejected";

export interface Hypothesis {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  relationType: RelationType;
  confidence: number;
  evidenceIds: string[];
  resolver: string;
  status: HypothesisStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface ActiveContext {
  projectId?: string;
  workItemId?: string;
  repositoryId?: string;
  branchId?: string;
  updatedAt: string;
}

export type SemanticEvent =
  | { id: string; type: "entity.created"; at: string; payload: Entity }
  | { id: string; type: "component.attached"; at: string; payload: Component }
  | { id: string; type: "component.refreshed"; at: string; payload: Component }
  | { id: string; type: "evidence.recorded"; at: string; payload: Evidence }
  | { id: string; type: "relation.created"; at: string; payload: Relation }
  | { id: string; type: "hypothesis.proposed"; at: string; payload: Hypothesis }
  | {
      id: string;
      type: "hypothesis.resolved";
      at: string;
      payload: { hypothesisId: string; status: "accepted" | "rejected"; relationId?: string };
    }
  | { id: string; type: "context.updated"; at: string; payload: ActiveContext }
  | {
      id: string;
      type: "agent.context_delivered";
      at: string;
      payload: { sessionId: string; consumer: string; operation?: string; entityIds: string[] };
    }
  | {
      id: string;
      type: "entity.merged";
      at: string;
      payload: { mergeId: string; sourceEntityId: string; targetEntityId: string; evidenceId: string };
    }
  | { id: string; type: "entity.merge_reverted"; at: string; payload: { mergeId: string } };

export interface SemanticState {
  entities: Map<string, Entity>;
  components: Map<string, Component>;
  evidence: Map<string, Evidence>;
  relations: Map<string, Relation>;
  hypotheses: Map<string, Hypothesis>;
  merges: Map<string, { sourceEntityId: string; targetEntityId: string; active: boolean }>;
  context: ActiveContext;
  events: SemanticEvent[];
}

export interface AgentContext {
  active: ActiveContext;
  entities: Entity[];
  components: Component[];
  relations: Relation[];
  evidence: Evidence[];
  hypotheses: Hypothesis[];
}
