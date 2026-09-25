import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WorkspaceValidationError } from "../src/workspace/errors";
import { ComponentRegistry } from "../src/workspace/features";
import { WorkspaceKernel } from "../src/workspace/kernel";
import { createWorkspaceHttpApp } from "../src/workspace/http";
import { estimateProjection } from "../src/workspace/projections/estimate";

const workspaces: string[] = [];

async function workspace(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "logos-extension-"));
  workspaces.push(path);
  return path;
}

afterEach(async () => {
  await Promise.all(workspaces.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("workspace component registry", () => {
  test("adds a registered component without a component-specific kernel or table", async () => {
    const registry = new ComponentRegistry([
      {
        typeId: "score",
        schemaVersion: 1,
        validate(value: unknown): { points: number } {
          const points = (value as { points?: unknown })?.points;
          if (!Number.isInteger(points)) throw new WorkspaceValidationError("score.points must be an integer");
          return { points: points as number };
        },
      },
    ]);
    const root = await workspace();
    let kernel = await WorkspaceKernel.open(root, registry);
    const entity = kernel.createEntity("登録実験", { operationId: "create" });
    const updated = kernel.addComponent(
      entity.id,
      "score",
      { operationId: "add-score", expectedRevision: entity.revision },
      { points: 3 },
    );
    expect(kernel.componentTypeIds()).toEqual(["name", "score"]);
    expect(updated.components.find((component) => component.typeId === "score")).toMatchObject({
      typeId: "score",
      schemaVersion: 1,
      data: { points: 3 },
    });
    kernel.close();

    kernel = await WorkspaceKernel.open(root, registry);
    expect(kernel.get(entity.id)?.components.find((component) => component.typeId === "score")?.data).toEqual({ points: 3 });
    kernel.close();
  });

  test("rejects duplicate registrations", () => {
    expect(() => new ComponentRegistry([
      { typeId: "same", schemaVersion: 1, validate: (value) => value },
      { typeId: "same", schemaVersion: 1, validate: (value) => value },
    ])).toThrow("Duplicate component type");
  });

  test("adds Estimate to existing entities without changing other component meanings", async () => {
    const root = await workspace();
    const kernel = await WorkspaceKernel.open(root);
    let entity = kernel.createEntity("記事を書く", { operationId: "create-article" });
    entity = kernel.addComponent(
      entity.id,
      "body",
      { operationId: "add-body", expectedRevision: entity.revision },
      { markdown: "記事の本文" },
    );
    const originalId = entity.id;
    entity = kernel.addComponent(
      entity.id,
      "estimate",
      { operationId: "add-estimate", expectedRevision: entity.revision },
      { minutes: 90 },
    );

    expect(kernel.componentTypeIds()).toEqual([
      "name", "task", "note", "event", "tag", "this-is-tag",
      "body", "progress", "schedule", "estimate",
    ]);
    expect(entity.id).toBe(originalId);
    expect(entity.components).toEqual(expect.arrayContaining([
      expect.objectContaining({ typeId: "body", data: { markdown: "記事の本文" } }),
      expect.objectContaining({ typeId: "estimate", schemaVersion: 1, data: { minutes: 90 } }),
      expect.objectContaining({ typeId: "name", data: { value: "記事を書く" } }),
    ]));
    const historyLength = kernel.history(entity.id).length;
    expect(() => kernel.updateComponent(
      entity.id,
      "estimate",
      { minutes: 0 },
      { operationId: "invalid-estimate", expectedRevision: entity.revision },
    )).toThrow("positive integer");
    expect(kernel.get(entity.id)?.revision).toBe(entity.revision);
    expect(kernel.history(entity.id)).toHaveLength(historyLength);
    kernel.close();
  });

  test("builds an Estimate projection and exposes it over HTTP", async () => {
    const root = await workspace();
    const kernel = await WorkspaceKernel.open(root);
    let article = kernel.createEntity("記事", { operationId: "create-article" });
    article = kernel.addComponent(
      article.id,
      "estimate",
      { operationId: "estimate-article", expectedRevision: article.revision },
      { minutes: 90 },
    );
    let meeting = kernel.createEntity("勉強会", { operationId: "create-meeting" });
    meeting = kernel.addComponent(
      meeting.id,
      "estimate",
      { operationId: "estimate-meeting", expectedRevision: meeting.revision },
      { minutes: 30 },
    );
    kernel.createEntity("見積なし", { operationId: "create-without-estimate" });
    expect(estimateProjection(kernel.list())).toMatchObject({
      totalMinutes: 120,
      entries: [
        { entity: { id: article.id }, estimate: { data: { minutes: 90 } } },
        { entity: { id: meeting.id }, estimate: { data: { minutes: 30 } } },
      ],
    });
    kernel.close();

    const response = await createWorkspaceHttpApp(root)(
      new Request("http://logos.local/api/workspace/estimates"),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ totalMinutes: 120 });
  });
});
