import { readFile } from "node:fs/promises";
import { LogosKernel, ValidationError } from "./kernel";
import type { Component, Entity, EntityType, RelationType } from "./types";

interface LinearProjectRecord {
  [key: string]: unknown;
  id: string;
  key?: string;
  name: string;
  url?: string;
}

interface LinearIssueRecord {
  [key: string]: unknown;
  id: string;
  identifier: string;
  title: string;
  description?: string;
  url?: string;
  projectId?: string;
  logosEntityId?: string;
}

interface LinearExport {
  projects?: LinearProjectRecord[];
  issues?: LinearIssueRecord[];
}

interface GitHubRepositoryRecord {
  [key: string]: unknown;
  id: string;
  name: string;
  url?: string;
}

interface GitHubRecord {
  [key: string]: unknown;
  id: string;
  title?: string;
  name?: string;
  message?: string;
  body?: string;
  url?: string;
  number?: number;
  repositoryId: string;
  branchId?: string;
  logosEntityId?: string;
}

interface GitHubExport {
  repositories?: GitHubRepositoryRecord[];
  issues?: GitHubRecord[];
  branches?: GitHubRecord[];
  commits?: GitHubRecord[];
  pullRequests?: GitHubRecord[];
}

export interface ImportResult {
  imported: number;
  reused: number;
  relations: number;
}

async function parseFile<T>(path: string): Promise<T> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch (error) {
    throw new ValidationError(`Cannot read connector export ${path}: ${(error as Error).message}`);
  }
}

async function upsertExternal(
  kernel: LogosKernel,
  input: {
    provider: "github" | "linear";
    externalId: string;
    entityType: EntityType;
    title: string;
    kind: string;
    url?: string;
    data: Record<string, unknown>;
    logosEntityId?: string;
  },
): Promise<{ entity: Entity; created: boolean }> {
  const existing = kernel.findByExternalIdentity(input.provider, input.externalId);
  if (existing) {
    await kernel.attachComponent(existing.id, {
      kind: input.kind,
      provider: input.provider,
      externalId: input.externalId,
      data: input.data,
      ...(input.url ? { url: input.url } : {}),
    });
    return { entity: existing, created: false };
  }
  const entity = input.logosEntityId
    ? kernel.snapshot().entities.find((candidate) => candidate.id === input.logosEntityId)
    : undefined;
  if (input.logosEntityId && !entity) throw new ValidationError(`Unknown propagated Logos ID: ${input.logosEntityId}`);
  const target = entity ?? (await kernel.createEntity(input.entityType, input.title));
  await kernel.attachComponent(target.id, {
    kind: input.kind,
    provider: input.provider,
    externalId: input.externalId,
    data: input.data,
    ...(input.url ? { url: input.url } : {}),
  });
  return { entity: target, created: !entity };
}

async function structuralRelation(
  kernel: LogosKernel,
  fromEntityId: string,
  type: RelationType,
  toEntityId: string,
  description: string,
): Promise<void> {
  const exists = kernel
    .snapshot()
    .relations.some(
      (relation) =>
        relation.fromEntityId === fromEntityId && relation.toEntityId === toEntityId && relation.type === type,
    );
  if (exists) return;
  const evidence = await kernel.recordEvidence({
    kind: "external-structure",
    description,
    resolver: "external-structure/v1",
  });
  await kernel.createRelation(fromEntityId, type, toEntityId, [evidence.id]);
}

export async function importLinear(kernel: LogosKernel, path: string): Promise<ImportResult> {
  const data = await parseFile<LinearExport>(path);
  let imported = 0;
  let reused = 0;
  let relations = 0;
  const projects = new Map<string, Entity>();
  for (const project of data.projects ?? []) {
    const result = await upsertExternal(kernel, {
      provider: "linear",
      externalId: project.id,
      entityType: "Project",
      title: project.name,
      kind: "LinearProject",
      data: { ...project },
      ...(project.url ? { url: project.url } : {}),
    });
    projects.set(project.id, result.entity);
    result.created ? imported++ : reused++;
  }
  for (const issue of data.issues ?? []) {
    const result = await upsertExternal(kernel, {
      provider: "linear",
      externalId: issue.identifier,
      entityType: "WorkItem",
      title: issue.title,
      kind: "LinearIssue",
      data: { ...issue },
      ...(issue.url ? { url: issue.url } : {}),
      ...(issue.logosEntityId ? { logosEntityId: issue.logosEntityId } : {}),
    });
    result.created ? imported++ : reused++;
    const project = issue.projectId ? projects.get(issue.projectId) : undefined;
    if (project) {
      await structuralRelation(
        kernel,
        result.entity.id,
        "belongsTo",
        project.id,
        `${issue.identifier} belongs to Linear project ${issue.projectId}`,
      );
      relations++;
    }
  }
  return { imported, reused, relations };
}

function titleOf(record: GitHubRecord, fallback: string): string {
  return record.title ?? record.name ?? record.message ?? fallback;
}

export async function importGitHub(kernel: LogosKernel, path: string): Promise<ImportResult> {
  const data = await parseFile<GitHubExport>(path);
  let imported = 0;
  let reused = 0;
  let relations = 0;
  const repositories = new Map<string, Entity>();
  const branches = new Map<string, Entity>();

  for (const repository of data.repositories ?? []) {
    const result = await upsertExternal(kernel, {
      provider: "github",
      externalId: repository.id,
      entityType: "Repository",
      title: repository.name,
      kind: "GitHubRepository",
      data: { ...repository },
      ...(repository.url ? { url: repository.url } : {}),
    });
    repositories.set(repository.id, result.entity);
    result.created ? imported++ : reused++;
  }

  const groups: Array<{ records: GitHubRecord[]; type: EntityType; kind: string }> = [
    { records: data.issues ?? [], type: "WorkItem", kind: "GitHubIssue" },
    { records: data.branches ?? [], type: "Branch", kind: "GitHubBranch" },
    { records: data.commits ?? [], type: "Commit", kind: "GitHubCommit" },
    { records: data.pullRequests ?? [], type: "PullRequest", kind: "GitHubPullRequest" },
  ];
  for (const group of groups) {
    for (const record of group.records) {
      const externalId = group.kind === "GitHubIssue" || group.kind === "GitHubPullRequest"
        ? `${record.repositoryId}#${record.number ?? record.id}`
        : record.id;
      const result = await upsertExternal(kernel, {
        provider: "github",
        externalId,
        entityType: group.type,
        title: titleOf(record, externalId),
        kind: group.kind,
        data: { ...record },
        ...(record.url ? { url: record.url } : {}),
        ...(record.logosEntityId ? { logosEntityId: record.logosEntityId } : {}),
      });
      result.created ? imported++ : reused++;
      if (group.kind === "GitHubBranch") branches.set(record.id, result.entity);
      const repository = repositories.get(record.repositoryId);
      if (repository) {
        await structuralRelation(
          kernel,
          result.entity.id,
          "belongsTo",
          repository.id,
          `${group.kind} ${externalId} belongs to GitHub repository ${record.repositoryId}`,
        );
        relations++;
      }
      const branch = record.branchId ? branches.get(record.branchId) : undefined;
      if (branch && group.kind === "GitHubPullRequest") {
        await structuralRelation(
          kernel,
          result.entity.id,
          "derivesFrom",
          branch.id,
          `Pull request ${externalId} was opened from branch ${record.branchId}`,
        );
        relations++;
      }
    }
  }
  return { imported, reused, relations };
}

function searchableText(component: Component, entity: Entity): string {
  return `${entity.title}\n${component.url ?? ""}\n${JSON.stringify(component.data)}`;
}

function containsExternalIdentifier(text: string, identifier: string): boolean {
  const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^A-Z0-9])${escaped}(?![A-Z0-9])`).test(text);
}

export async function resolveDeterministic(kernel: LogosKernel): Promise<{ proposed: number; skipped: number }> {
  const snapshot = kernel.snapshot();
  const entityById = new Map(snapshot.entities.map((entity) => [entity.id, entity]));
  const linearIdentities = snapshot.components.flatMap((component) => {
    if (component.provider !== "linear" || component.kind !== "LinearIssue" || !component.externalId) return [];
    return [{ identifier: component.externalId, entityId: component.entityId }];
  });
  let proposed = 0;
  let skipped = 0;
  const hypothesisKeys = new Set(
    snapshot.hypotheses.map(
      (hypothesis) => `${hypothesis.fromEntityId}:${hypothesis.relationType}:${hypothesis.toEntityId}`,
    ),
  );
  const relationKeys = new Set(
    snapshot.relations.map(
      (relation) => `${relation.fromEntityId}:${relation.type}:${relation.toEntityId}`,
    ),
  );
  for (const component of snapshot.components) {
    if (!["GitHubBranch", "GitHubCommit", "GitHubPullRequest"].includes(component.kind)) continue;
    const source = entityById.get(component.entityId);
    if (!source) continue;
    const text = searchableText(component, source);
    for (const target of linearIdentities) {
      if (component.entityId === target.entityId || !containsExternalIdentifier(text, target.identifier)) continue;
      const key = `${component.entityId}:implements:${target.entityId}`;
      if (hypothesisKeys.has(key) || relationKeys.has(key)) {
        skipped++;
        continue;
      }
      const evidence = await kernel.recordEvidence({
        kind: "external-reference",
        description: `${component.kind} explicitly references ${target.identifier}`,
        resolver: "explicit-reference/v1",
        ...(component.url ?? component.externalId
          ? { source: component.url ?? component.externalId! }
          : {}),
      });
      await kernel.proposeRelation({
        fromEntityId: component.entityId,
        toEntityId: target.entityId,
        relationType: "implements",
        confidence: 0.98,
        evidenceIds: [evidence.id],
        resolver: "explicit-reference/v1",
      });
      hypothesisKeys.add(key);
      proposed++;
    }
  }
  return { proposed, skipped };
}
