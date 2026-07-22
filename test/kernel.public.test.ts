import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { IdentityConflictError, LogosKernel } from "../src/kernel";

const workspaces: string[] = [];

async function workspace(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "logos-test-"));
  workspaces.push(path);
  return path;
}

afterEach(async () => {
  await Promise.all(workspaces.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("semantic kernel public API", () => {
  test("canonical relations require inspectable provenance and survive reload", async () => {
    const root = await workspace();
    const kernel = await LogosKernel.open(root);
    const work = await kernel.createEntity("WorkItem", "Cache policy");
    const branch = await kernel.createEntity("Branch", "feature/cache-policy");
    const evidence = await kernel.recordEvidence({
      kind: "operation",
      description: "Branch created from the active work item",
      source: "logos branch create",
    });
    const relation = await kernel.createRelation(branch.id, "implements", work.id, [evidence.id]);

    const reopened = await LogosKernel.open(root);
    expect(reopened.explainRelation(relation.id)).toEqual({ relation, evidence: [evidence] });
    expect(reopened.history().map((event) => event.type)).toEqual([
      "entity.created",
      "entity.created",
      "evidence.recorded",
      "relation.created",
    ]);
  });

  test("hypotheses stay separate until accepted", async () => {
    const kernel = await LogosKernel.open(await workspace());
    const pullRequest = await kernel.createEntity("PullRequest", "Add cache policy");
    const work = await kernel.createEntity("WorkItem", "Cache policy");
    const evidence = await kernel.recordEvidence({
      kind: "local-rule",
      description: "PR body mentions ENG-142",
      resolver: "explicit-reference/v1",
    });
    const hypothesis = await kernel.proposeRelation({
      fromEntityId: pullRequest.id,
      toEntityId: work.id,
      relationType: "implements",
      confidence: 0.95,
      evidenceIds: [evidence.id],
      resolver: "explicit-reference/v1",
    });

    expect(kernel.snapshot().relations).toHaveLength(0);
    expect(kernel.snapshot().hypotheses[0]?.status).toBe("candidate");
    await kernel.resolveHypothesis(hypothesis.id, "accepted");
    expect(kernel.snapshot().relations).toHaveLength(1);
    expect(kernel.snapshot().hypotheses[0]?.status).toBe("accepted");
  });

  test("duplicate external identity is rejected instead of silently merged", async () => {
    const kernel = await LogosKernel.open(await workspace());
    const first = await kernel.createEntity("WorkItem", "First");
    const second = await kernel.createEntity("WorkItem", "Second");
    await kernel.attachComponent(first.id, {
      kind: "LinearIssue",
      provider: "linear",
      externalId: "ENG-142",
      data: {},
    });

    expect(
      kernel.attachComponent(second.id, {
        kind: "LinearIssue",
        provider: "linear",
        externalId: "ENG-142",
        data: {},
      }),
    ).rejects.toBeInstanceOf(IdentityConflictError);
  });

  test("merge is an explicit reversible event", async () => {
    const kernel = await LogosKernel.open(await workspace());
    const source = await kernel.createEntity("WorkItem", "Cache task");
    const target = await kernel.createEntity("WorkItem", "Cache policy");
    const evidence = await kernel.recordEvidence({ kind: "human", description: "Confirmed by user" });
    const mergeId = await kernel.mergeEntity(source.id, target.id, evidence.id);
    expect(kernel.canonicalEntityId(source.id)).toBe(target.id);

    await kernel.revertMerge(mergeId);
    expect(kernel.canonicalEntityId(source.id)).toBe(source.id);
  });
});
