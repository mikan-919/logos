import { PGlite } from "@electric-sql/pglite";
import type { Database } from "@logos/db";
import { expect, test } from "vite-plus/test";
import { Kysely, PGliteDialect } from "kysely";
import { up } from "../../db/src/migrations/20260926_initial.ts";
import { createLogosApi } from "../src/index.ts";

const alice = "00000000-0000-4000-8000-000000000001";
const bob = "00000000-0000-4000-8000-000000000002";

async function setup() {
  const pglite = new PGlite();
  const db = new Kysely<Database>({ dialect: new PGliteDialect({ pglite }) });
  await up(db as unknown as Kysely<unknown>);
  const app = createLogosApi({
    db,
    authenticate: (request) => {
      const userId = request.headers.get("x-test-user");
      if (!userId) return null;
      return { userId, appId: request.headers.get("x-test-app") ?? "tasks" };
    },
  });
  async function request(
    method: string,
    path: string,
    data?: Record<string, unknown>,
    userId = alice,
    appId = "tasks",
  ) {
    return app.request(path, {
      method,
      headers: { "content-type": "application/json", "x-test-user": userId, "x-test-app": appId },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  }
  return { db, request };
}

test("ECS search and cross-app component updates", async () => {
  const { db, request } = await setup();
  try {
    const entity = await (await request("POST", "/entities")).json();
    const id: string = entity.id;
    expect(id).toMatch(/^[0-9a-f-]{36}$/);

    const nameType = await request("POST", "/component-types", {
      key: "logos.name",
      ownerApp: "logos",
      schema: { type: "object", properties: { value: { type: "string" } }, required: ["value"] },
    });
    expect(nameType.status).toBe(201);
    const taskType = await request("POST", "/component-types", {
      key: "tasks.task",
      schema: {
        type: "object",
        properties: { status: { enum: ["todo", "done"] } },
        required: ["status"],
      },
    });
    expect(taskType.status).toBe(201);

    const name = await request("POST", `/entities/${id}/components`, {
      typeKey: "logos.name",
      value: { value: "設計" },
    });
    expect(name.status).toBe(201);
    const task = await request("POST", `/entities/${id}/components`, {
      typeKey: "tasks.task",
      value: { status: "todo" },
    });
    expect(task.status).toBe(201);

    const found = await request(
      "GET",
      "/entities?has=logos.name,tasks.task",
      undefined,
      alice,
      "calendar",
    );
    expect((await found.json()).ids).toEqual([id]);
    const nextPage = await request("GET", `/entities?has=logos.name,tasks.task&after=${id}`);
    expect((await nextPage.json()).ids).toEqual([]);
    const updated = await request(
      "PUT",
      `/entities/${id}/components/tasks.task`,
      { value: { status: "done" }, revision: "1" },
      alice,
      "calendar",
    );
    expect(updated.status).toBe(200);
    expect((await updated.json()).revision).toBe("2");
    const stale = await request("PUT", `/entities/${id}/components/tasks.task`, {
      value: { status: "todo" },
      revision: "1",
    });
    expect(stale.status).toBe(409);
    const invalid = await request("POST", `/entities/${id}/components`, {
      typeKey: "tasks.task",
      value: { status: "invalid" },
    });
    expect(invalid.status).toBe(422);
  } finally {
    await db.destroy();
  }
});

test("entity permissions and reference deletion", async () => {
  const { db, request } = await setup();
  try {
    const target = await (await request("POST", "/entities")).json();
    const source = await (await request("POST", "/entities")).json();
    const targetId: string = target.id;
    const sourceId: string = source.id;

    expect((await request("GET", `/entities/${sourceId}`, undefined, bob)).status).toBe(404);
    expect(
      (
        await request("POST", `/entities/${sourceId}/permissions`, {
          userId: bob,
          permission: "read",
        })
      ).status,
    ).toBe(204);
    expect((await request("GET", `/entities/${sourceId}`, undefined, bob)).status).toBe(200);
    expect(
      (await request("POST", `/entities/${sourceId}/components`, { typeKey: "x", value: {} }, bob))
        .status,
    ).toBe(403);

    const referenceType = await request("POST", "/component-types", {
      key: "logos.relatedTo",
      schema: {
        type: "object",
        properties: { entities: { type: "array", items: { type: "string", format: "uuid" } } },
        required: ["entities"],
      },
    });
    expect(referenceType.status).toBe(201);
    const reference = await request("POST", `/entities/${sourceId}/components`, {
      typeKey: "logos.relatedTo",
      value: { entities: [targetId] },
    });
    expect(reference.status).toBe(201);
    const visibleSource = await (
      await request("GET", `/entities/${sourceId}`, undefined, bob)
    ).json();
    expect(visibleSource.components[0].value.entities).toEqual([targetId]);
    expect((await request("GET", `/entities/${targetId}`, undefined, bob)).status).toBe(404);
    expect((await request("DELETE", `/entities/${targetId}`)).status).toBe(409);
    expect(
      (await request("DELETE", `/entities/${sourceId}/components/logos.relatedTo?revision=1`))
        .status,
    ).toBe(204);
    expect((await request("DELETE", `/entities/${targetId}`)).status).toBe(204);
    expect(
      (await request("DELETE", `/entities/${sourceId}/permissions/${alice}/manage`)).status,
    ).toBe(409);
  } finally {
    await db.destroy();
  }
});
