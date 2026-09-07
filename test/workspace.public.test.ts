import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkspaceHttpApp } from "../src/workspace/http";
import {
  RevisionConflictError,
  WorkspaceKernel,
  WorkspaceValidationError,
} from "../src/workspace/kernel";

const workspaces: string[] = [];

async function workspace(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "logos-workspace-"));
  workspaces.push(path);
  return path;
}

afterEach(async () => {
  await Promise.all(workspaces.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("functional workspace kernel", () => {
  test("keeps one entity ID while body and schedule are added, updated, and reloaded", async () => {
    const root = await workspace();
    const kernel = await WorkspaceKernel.open(root);
    const created = kernel.createEntity("勉強会を開催する", { operationId: "create-study-group" });
    const withBody = kernel.addComponent(
      created.id,
      "body",
      { operationId: "add-body", expectedRevision: created.revision },
      { markdown: "目的と内容" },
    );
    const withSchedule = kernel.addComponent(
      created.id,
      "schedule",
      { operationId: "add-schedule", expectedRevision: withBody.revision },
      {
        startUtc: "2026-09-10T09:00:00Z",
        endUtc: "2026-09-10T10:30:00Z",
        timeZone: "Asia/Tokyo",
      },
    );
    const updated = kernel.updateComponent(
      created.id,
      "schedule",
      {
        startUtc: "2026-09-10T10:00:00Z",
        endUtc: "2026-09-10T11:30:00Z",
        timeZone: "Asia/Tokyo",
      },
      { operationId: "move-schedule", expectedRevision: withSchedule.revision },
    );

    expect(updated.id).toBe(created.id);
    expect(updated.components.find((item) => item.typeId === "body")?.data).toEqual({
      markdown: "目的と内容",
    });
    expect(updated.revision).toBe(3);
    kernel.close();

    const reopened = await WorkspaceKernel.open(root);
    expect(reopened.get(created.id)).toEqual(updated);
    expect(reopened.history(created.id).map((event) => event.command)).toEqual([
      "entity.create",
      "component.add",
      "component.add",
      "component.update",
    ]);
    expect(reopened.databasePath()).toBe(join(root, ".logos-workspace", "workspace.sqlite"));
    reopened.close();
  });

  test("rejects invalid schedule without changing state or history", async () => {
    const kernel = await WorkspaceKernel.open(await workspace());
    const entity = kernel.createEntity("記事を書く", { operationId: "create-article" });

    expect(() =>
      kernel.addComponent(
        entity.id,
        "schedule",
        { operationId: "invalid-schedule", expectedRevision: entity.revision },
        {
          startUtc: "2026-09-10T10:00:00Z",
          endUtc: "2026-09-10T09:00:00Z",
          timeZone: "Asia/Tokyo",
        },
      ),
    ).toThrow(WorkspaceValidationError);
    expect(kernel.get(entity.id)?.revision).toBe(0);
    expect(kernel.get(entity.id)?.components).toHaveLength(0);
    expect(kernel.history(entity.id)).toHaveLength(1);
    kernel.close();
  });

  test("detects stale revisions and returns the first result for an operation retry", async () => {
    const kernel = await WorkspaceKernel.open(await workspace());
    const entity = kernel.createEntity("勉強会", { operationId: "create" });
    const first = kernel.addComponent(
      entity.id,
      "body",
      { operationId: "add-body", expectedRevision: 0 },
      { markdown: "first" },
    );
    const replayed = kernel.addComponent(
      entity.id,
      "body",
      { operationId: "add-body", expectedRevision: 0 },
      { markdown: "different retry body" },
    );
    expect(replayed).toEqual(first);
    expect(kernel.history(entity.id)).toHaveLength(2);
    expect(() =>
      kernel.updateComponent(
        entity.id,
        "body",
        { markdown: "stale write" },
        { operationId: "stale-write", expectedRevision: 0 },
      ),
    ).toThrow(RevisionConflictError);
    expect(kernel.get(entity.id)?.components[0]?.data).toEqual({ markdown: "first" });
    kernel.close();
  });

  test("disables and restores a component without losing its data", async () => {
    const kernel = await WorkspaceKernel.open(await workspace());
    const entity = kernel.createEntity("記事を書く", { operationId: "create" });
    const added = kernel.addComponent(
      entity.id,
      "progress",
      { operationId: "add-progress", expectedRevision: 0 },
      { status: "doing" },
    );
    const disabled = kernel.disableComponent(entity.id, "progress", {
      operationId: "disable-progress",
      expectedRevision: added.revision,
    });
    expect(disabled.components[0]).toMatchObject({ active: false, data: { status: "doing" } });
    const restored = kernel.restoreComponent(entity.id, "progress", {
      operationId: "restore-progress",
      expectedRevision: disabled.revision,
    });
    expect(restored.components[0]).toMatchObject({ active: true, data: { status: "doing" } });
    kernel.close();
  });
});

describe("functional workspace HTTP surface", () => {
  test("creates an entity and persists body input through the common command path", async () => {
    const root = await workspace();
    const app = createWorkspaceHttpApp(root);
    const create = await app(
      new Request("http://logos.local/api/workspace/entities", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "記事を書く", operationId: "http-create" }),
      }),
    );
    expect(create.status).toBe(201);
    const entity = (await create.json()) as { id: string; revision: number };
    const addBody = await app(
      new Request(`http://logos.local/api/workspace/entities/${entity.id}/components/body`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          operationId: "http-add-body",
          expectedRevision: entity.revision,
          data: { markdown: "本文" },
        }),
      }),
    );
    expect(addBody.status).toBe(201);

    const list = await app(new Request("http://logos.local/api/workspace/entities"));
    expect(await list.json()).toMatchObject({
      entities: [
        {
          id: entity.id,
          name: "記事を書く",
          revision: 1,
          components: [{ typeId: "body", active: true, data: { markdown: "本文" } }],
        },
      ],
    });
  });

  test("returns the current entity with a conflict response", async () => {
    const root = await workspace();
    const app = createWorkspaceHttpApp(root);
    const create = await app(
      new Request("http://logos.local/api/workspace/entities", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "対象", operationId: "create" }),
      }),
    );
    const entity = (await create.json()) as { id: string };
    await app(
      new Request(`http://logos.local/api/workspace/entities/${entity.id}/components/body`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ operationId: "add", expectedRevision: 0, data: { markdown: "a" } }),
      }),
    );
    const conflict = await app(
      new Request(`http://logos.local/api/workspace/entities/${entity.id}/components/body`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ operationId: "update", expectedRevision: 0, data: { markdown: "b" } }),
      }),
    );
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({ actualRevision: 1, entity: { id: entity.id } });
  });

  test("serves the input page", async () => {
    const app = createWorkspaceHttpApp(await workspace());
    const response = await app(new Request("http://logos.local/"));
    expect(response.headers.get("content-type")).toContain("text/html");
    const html = await response.text();
    expect(html).toContain("対象を作成");
    expect(html).toContain("実施予定を追加");
    const script = html.match(/<script>([\s\S]+)<\/script>/)?.[1];
    expect(script).toBeDefined();
    expect(() => new Function(script!)).not.toThrow();
  });
});
