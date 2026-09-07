import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WorkspaceValidationError } from "../src/workspace/errors";
import { ComponentRegistry } from "../src/workspace/features";
import { WorkspaceKernel } from "../src/workspace/kernel";

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
    expect(kernel.componentTypeIds()).toEqual(["score"]);
    expect(updated.components[0]).toMatchObject({
      typeId: "score",
      schemaVersion: 1,
      data: { points: 3 },
    });
    kernel.close();

    kernel = await WorkspaceKernel.open(root, registry);
    expect(kernel.get(entity.id)?.components[0]?.data).toEqual({ points: 3 });
    kernel.close();
  });

  test("rejects duplicate registrations", () => {
    expect(() => new ComponentRegistry([
      { typeId: "same", schemaVersion: 1, validate: (value) => value },
      { typeId: "same", schemaVersion: 1, validate: (value) => value },
    ])).toThrow("Duplicate component type");
  });
});
