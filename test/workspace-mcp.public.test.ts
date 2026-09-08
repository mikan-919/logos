import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WorkspaceKernel } from "../src/workspace/kernel";
import { handleWorkspaceMcpMessage } from "../src/workspace/mcp";

const workspaces: string[] = [];

async function workspace(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "logos-workspace-mcp-"));
  workspaces.push(path);
  return path;
}

afterEach(async () => {
  await Promise.all(workspaces.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

async function call(root: string, name: string, args: Record<string, unknown> = {}): Promise<any> {
  return await handleWorkspaceMcpMessage(root, {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name, arguments: args },
  });
}

describe("workspace MCP read interface", () => {
  test("advertises only bounded read tools", async () => {
    const response = await handleWorkspaceMcpMessage(await workspace(), {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
    }) as any;
    expect(response.result.tools.map((tool: { name: string }) => tool.name)).toEqual([
      "logos_workspace_entities_list",
      "logos_workspace_entity_get",
    ]);
  });

  test("lists filtered entities with a strict result limit", async () => {
    const root = await workspace();
    const kernel = await WorkspaceKernel.open(root);
    for (let index = 0; index < 3; index++) {
      const entity = kernel.createEntity(`Task ${index}`, { operationId: `create-${index}` });
      kernel.addComponent(entity.id, "progress", {
        operationId: `progress-${index}`,
        expectedRevision: entity.revision,
      }, { status: index === 0 ? "doing" : "todo" });
    }
    kernel.close();

    const response = await call(root, "logos_workspace_entities_list", { progress: "todo", limit: 1 });
    const payload = JSON.parse(response.result.content[0].text);
    expect(payload.entities).toHaveLength(1);
    expect(payload.entities[0].components).toContainEqual(
      expect.objectContaining({ typeId: "progress", data: { status: "todo" } }),
    );
    expect(payload.selection).toEqual({ limit: 1, truncated: true });
  });

  test("gets components and references without writing history", async () => {
    const root = await workspace();
    const kernel = await WorkspaceKernel.open(root);
    const source = kernel.createEntity("Source", { operationId: "create-source" });
    const target = kernel.createEntity("Target", { operationId: "create-target" });
    kernel.addReference(source.id, target.id, {
      operationId: "reference",
      expectedRevision: source.revision,
      actor: "tester",
    });
    const historyLength = kernel.history().length;
    kernel.close();

    const response = await call(root, "logos_workspace_entity_get", { entityId: source.id });
    const payload = JSON.parse(response.result.content[0].text);
    expect(payload.entity).toMatchObject({ id: source.id, name: "Source" });
    expect(payload.references.outgoing).toContainEqual(
      expect.objectContaining({ fromEntityId: source.id, toEntityId: target.id, type: "references" }),
    );

    const reopened = await WorkspaceKernel.open(root);
    expect(reopened.history()).toHaveLength(historyLength);
    reopened.close();
  });

  test("rejects invalid arguments and unknown entities", async () => {
    const root = await workspace();
    const invalidLimit = await call(root, "logos_workspace_entities_list", { limit: 51 });
    expect(invalidLimit.error).toMatchObject({ code: -32000, message: "limit must be an integer from 1 to 50" });
    const missing = await call(root, "logos_workspace_entity_get", { entityId: "missing" });
    expect(missing.error).toMatchObject({ code: -32000, message: "Unknown entity: missing" });
  });
});
