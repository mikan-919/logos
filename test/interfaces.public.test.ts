import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHttpApp } from "../src/http";
import { LogosKernel } from "../src/kernel";
import { handleMcpMessage } from "../src/mcp";
import { runCli } from "../src/cli";

const workspaces: string[] = [];

async function workspace(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "logos-interface-"));
  workspaces.push(path);
  return path;
}

afterEach(async () => {
  await Promise.all(workspaces.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("write-time grounding", () => {
  test("registers a branch as implementing the active work item", async () => {
    const root = await workspace();
    const work = (await runCli(["entity", "create", "WorkItem", "Cache policy"], { cwd: root })) as {
      id: string;
    };
    await runCli(["work", "start", work.id], { cwd: root });
    const branch = (await runCli(["branch", "register", "feature/cache-policy"], { cwd: root })) as {
      entity: { id: string };
      relation: { type: string; toEntityId: string };
    };

    expect(branch.relation).toMatchObject({ type: "implements", toEntityId: work.id });
    const explanation = (await runCli(["explain", (branch as any).relation.id], { cwd: root })) as {
      evidence: Array<{ kind: string; source?: string }>;
    };
    expect(explanation.evidence[0]).toMatchObject({ kind: "operation", source: "logos branch register" });
  });
});

describe("HTTP review surface", () => {
  test("shows candidates and lets a human accept one", async () => {
    const root = await workspace();
    const kernel = await LogosKernel.open(root);
    const branch = await kernel.createEntity("Branch", "feature/cache");
    const work = await kernel.createEntity("WorkItem", "Cache policy");
    const evidence = await kernel.recordEvidence({ kind: "local-rule", description: "Known branch convention" });
    const hypothesis = await kernel.proposeRelation({
      fromEntityId: branch.id,
      toEntityId: work.id,
      relationType: "implements",
      confidence: 0.9,
      evidenceIds: [evidence.id],
      resolver: "branch-convention/v1",
    });
    const app = createHttpApp(root);

    const list = await app(new Request("http://logos.local/api/hypotheses"));
    expect(list.status).toBe(200);
    expect((await list.json()).hypotheses).toHaveLength(1);
    const accepted = await app(
      new Request(`http://logos.local/api/hypotheses/${hypothesis.id}/accept`, { method: "POST" }),
    );
    expect(accepted.status).toBe(200);
    expect((await accepted.json()).status).toBe("accepted");
  });

  test("serves a lightweight provenance review page", async () => {
    const app = createHttpApp(await workspace());
    const response = await app(new Request("http://logos.local/"));
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(await response.text()).toContain("Semantic Review");
  });
});

describe("MCP-compatible agent interface", () => {
  test("advertises bounded read and propose tools", async () => {
    const root = await workspace();
    const response = await handleMcpMessage(root, {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
    });
    const names = response.result.tools.map((tool: { name: string }) => tool.name);
    expect(names).toEqual(["logos_context_get", "logos_explain", "logos_relation_propose"]);
  });

  test("delivers active context and writes an auditable session event", async () => {
    const root = await workspace();
    const kernel = await LogosKernel.open(root);
    const work = await kernel.createEntity("WorkItem", "Cache policy");
    await kernel.setContext({ workItemId: work.id });

    const response = await handleMcpMessage(root, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "logos_context_get", arguments: { operation: "implement" } },
    });
    const payload = JSON.parse(response.result.content[0].text);
    expect(payload.entities[0].id).toBe(work.id);
    const reopened = await LogosKernel.open(root);
    expect(reopened.history().at(-1)?.type).toBe("agent.context_delivered");
  });

  test("review operation can select unresolved hypotheses beyond active work", async () => {
    const root = await workspace();
    const kernel = await LogosKernel.open(root);
    const work = await kernel.createEntity("WorkItem", "Cache policy");
    const branch = await kernel.createEntity("Branch", "feature/cache");
    await kernel.attachComponent(branch.id, {
      kind: "GitHubBranch",
      provider: "github",
      externalId: "branch-1",
      data: { name: "feature/cache", state: "open" },
    });
    const evidence = await kernel.recordEvidence({ kind: "local-rule", description: "Branch convention" });
    await kernel.proposeRelation({
      fromEntityId: branch.id,
      toEntityId: work.id,
      relationType: "implements",
      confidence: 0.8,
      evidenceIds: [evidence.id],
      resolver: "branch-rule/v1",
    });

    const response = await handleMcpMessage(root, {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "logos_context_get", arguments: { operation: "review-hypotheses" } },
    });
    const payload = JSON.parse(response.result.content[0].text);
    expect(payload.hypotheses).toHaveLength(1);
    expect(payload.components[0].data).toMatchObject({ state: "open" });
  });
});
