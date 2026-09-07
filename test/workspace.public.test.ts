import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
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

  test("treats all eight component combinations as valid and queryable", async () => {
    const kernel = await WorkspaceKernel.open(await workspace());
    for (let mask = 0; mask < 8; mask++) {
      let entity = kernel.createEntity(`組み合わせ${mask}`, { operationId: `create-${mask}` });
      if (mask & 1) {
        entity = kernel.addComponent(
          entity.id,
          "body",
          { operationId: `body-${mask}`, expectedRevision: entity.revision },
          { markdown: `本文${mask}` },
        );
      }
      if (mask & 2) {
        entity = kernel.addComponent(
          entity.id,
          "progress",
          { operationId: `progress-${mask}`, expectedRevision: entity.revision },
          { status: "doing" },
        );
      }
      if (mask & 4) {
        entity = kernel.addComponent(
          entity.id,
          "schedule",
          { operationId: `schedule-${mask}`, expectedRevision: entity.revision },
          {
            startUtc: `2026-09-1${mask}T09:00:00Z`,
            endUtc: `2026-09-1${mask}T10:00:00Z`,
            timeZone: "Asia/Tokyo",
          },
        );
      }
    }

    expect(kernel.list()).toHaveLength(8);
    expect(kernel.list({ hasProgress: true })).toHaveLength(4);
    expect(kernel.list({ hasProgress: false })).toHaveLength(4);
    expect(kernel.list({ progress: "doing" })).toHaveLength(4);
    expect(kernel.calendar("2026-09-10T00:00:00Z", "2026-09-20T00:00:00Z")).toHaveLength(4);
    kernel.close();
  });

  test("adds, removes, and restores a reference while retaining its origin", async () => {
    const root = await workspace();
    const kernel = await WorkspaceKernel.open(root);
    const activity = kernel.createEntity("勉強会", { operationId: "create-activity" });
    const task = kernel.createEntity("会場を予約する", { operationId: "create-task" });
    const added = kernel.addReference(activity.id, task.id, {
      operationId: "add-reference",
      expectedRevision: activity.revision,
      actor: "tester",
    });
    expect(added).toMatchObject({
      type: "references",
      active: true,
      createdBy: "tester",
      createdOperationId: "add-reference",
    });
    const removed = kernel.removeReference(activity.id, task.id, {
      operationId: "remove-reference",
      expectedRevision: 1,
    });
    expect(removed.active).toBe(false);
    const restored = kernel.addReference(activity.id, task.id, {
      operationId: "restore-reference",
      expectedRevision: 2,
    });
    expect(restored).toMatchObject({
      id: added.id,
      active: true,
      createdBy: "tester",
      createdOperationId: "add-reference",
    });
    kernel.close();

    const reopened = await WorkspaceKernel.open(root);
    expect(reopened.references(activity.id).outgoing).toEqual([restored]);
    expect(reopened.references(task.id).incoming).toEqual([restored]);
    expect(reopened.history(activity.id).map((event) => event.command)).toEqual([
      "entity.create",
      "relation.add",
      "relation.remove",
      "relation.add",
    ]);
    reopened.close();
  });

  test("calendar reads active schedules and does not require progress", async () => {
    const kernel = await WorkspaceKernel.open(await workspace());
    let scheduled = kernel.createEntity("予定だけの対象", { operationId: "create-scheduled" });
    scheduled = kernel.addComponent(
      scheduled.id,
      "schedule",
      { operationId: "add-schedule", expectedRevision: scheduled.revision },
      {
        startUtc: "2026-09-08T23:00:00Z",
        endUtc: "2026-09-09T00:00:00Z",
        timeZone: "Asia/Tokyo",
      },
    );
    const entry = kernel.calendar("2026-09-08T00:00:00Z", "2026-09-10T00:00:00Z")[0];
    expect(entry?.entity.id).toBe(scheduled.id);
    expect(entry?.progress).toBeUndefined();
    kernel.disableComponent(scheduled.id, "schedule", {
      operationId: "disable-schedule",
      expectedRevision: scheduled.revision,
    });
    expect(kernel.calendar("2026-09-08T00:00:00Z", "2026-09-10T00:00:00Z")).toEqual([]);
    kernel.close();
  });

  test("rolls back current state when event insertion fails", async () => {
    const root = await workspace();
    let kernel = await WorkspaceKernel.open(root);
    const entity = kernel.createEntity("原子的保存", { operationId: "create" });
    const path = kernel.databasePath();
    kernel.close();
    const database = new Database(path);
    database.exec(`
      CREATE TRIGGER reject_forced_event
      BEFORE INSERT ON events
      WHEN NEW.operation_id = 'force-failure'
      BEGIN
        SELECT RAISE(ABORT, 'forced event failure');
      END;
    `);
    database.close();

    kernel = await WorkspaceKernel.open(root);
    expect(() =>
      kernel.addComponent(
        entity.id,
        "body",
        { operationId: "force-failure", expectedRevision: 0 },
        { markdown: "保存されない本文" },
      ),
    ).toThrow("forced event failure");
    expect(kernel.get(entity.id)).toMatchObject({ revision: 0, components: [] });
    expect(kernel.history(entity.id)).toHaveLength(1);
    kernel.close();
  });

  test("preserves an unknown component while known components change", async () => {
    const root = await workspace();
    let kernel = await WorkspaceKernel.open(root);
    const entity = kernel.createEntity("未知Componentを持つ対象", { operationId: "create" });
    const path = kernel.databasePath();
    kernel.close();
    const database = new Database(path);
    const at = new Date().toISOString();
    database.query(
      `INSERT INTO components
        (entity_id, type_id, schema_version, data_json, active, created_at, updated_at, disabled_at)
       VALUES (?, 'future-feature', 7, ?, 1, ?, ?, NULL)`,
    ).run(entity.id, JSON.stringify({ retained: true }), at, at);
    database.close();

    kernel = await WorkspaceKernel.open(root);
    kernel.addComponent(
      entity.id,
      "body",
      { operationId: "add-body", expectedRevision: 0 },
      { markdown: "既知の本文" },
    );
    expect(kernel.get(entity.id)?.components).toContainEqual(
      expect.objectContaining({
        typeId: "future-feature",
        schemaVersion: 7,
        active: true,
        data: { retained: true },
      }),
    );
    kernel.close();
  });

  test("renames, archives, and restores without changing identity or components", async () => {
    const kernel = await WorkspaceKernel.open(await workspace());
    let entity = kernel.createEntity("変更前", { operationId: "create" });
    entity = kernel.addComponent(
      entity.id,
      "body",
      { operationId: "body", expectedRevision: entity.revision },
      { markdown: "保持する本文" },
    );
    entity = kernel.renameEntity(entity.id, "変更後", {
      operationId: "rename",
      expectedRevision: entity.revision,
    });
    entity = kernel.archiveEntity(entity.id, {
      operationId: "archive",
      expectedRevision: entity.revision,
    });
    expect(kernel.list()).toEqual([]);
    expect(kernel.list({ includeArchived: true })[0]).toMatchObject({
      id: entity.id,
      name: "変更後",
      components: [expect.objectContaining({ data: { markdown: "保持する本文" } })],
    });
    const restored = kernel.restoreEntity(entity.id, {
      operationId: "restore",
      expectedRevision: entity.revision,
    });
    expect(restored).toMatchObject({ id: entity.id, name: "変更後" });
    expect(restored.archivedAt).toBeUndefined();
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

  test("exposes calendar, filtering, feature removal, and references through commands", async () => {
    const root = await workspace();
    const kernel = await WorkspaceKernel.open(root);
    let activity = kernel.createEntity("勉強会", { operationId: "create-activity" });
    const task = kernel.createEntity("会場予約", { operationId: "create-task" });
    activity = kernel.addComponent(
      activity.id,
      "schedule",
      { operationId: "add-schedule", expectedRevision: activity.revision },
      {
        startUtc: "2026-09-09T09:00:00Z",
        endUtc: "2026-09-09T10:00:00Z",
        timeZone: "UTC",
      },
    );
    kernel.close();
    const app = createWorkspaceHttpApp(root);

    const calendar = await app(new Request(
      "http://logos.local/api/workspace/calendar?startUtc=2026-09-09T00%3A00%3A00Z&endUtc=2026-09-10T00%3A00%3A00Z",
    ));
    expect(await calendar.json()).toMatchObject({ entries: [{ entity: { id: activity.id } }] });
    const addReference = await app(new Request(
      `http://logos.local/api/workspace/entities/${activity.id}/references`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          operationId: "http-reference",
          expectedRevision: activity.revision,
          targetEntityId: task.id,
        }),
      },
    ));
    expect(addReference.status).toBe(201);
    const references = await app(new Request(
      `http://logos.local/api/workspace/entities/${activity.id}/references`,
    ));
    expect(await references.json()).toMatchObject({ outgoing: [{ toEntityId: task.id }] });
    const filtered = await app(new Request(
      "http://logos.local/api/workspace/entities?name=%E4%BC%9A%E5%A0%B4",
    ));
    expect(await filtered.json()).toMatchObject({ entities: [{ id: task.id }] });
    const removeSchedule = await app(new Request(
      `http://logos.local/api/workspace/entities/${activity.id}/components/schedule`,
      {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ operationId: "http-disable", expectedRevision: activity.revision + 1 }),
      },
    ));
    expect(removeSchedule.status).toBe(200);
    const emptyCalendar = await app(new Request(
      "http://logos.local/api/workspace/calendar?startUtc=2026-09-09T00%3A00%3A00Z&endUtc=2026-09-10T00%3A00%3A00Z",
    ));
    expect(await emptyCalendar.json()).toEqual({ entries: [] });
  });

  test("notifies another view after a persisted command", async () => {
    const root = await workspace();
    const app = createWorkspaceHttpApp(root);
    const events = await app(new Request("http://logos.local/api/workspace/events"));
    const reader = events.body!.getReader();
    const decoder = new TextDecoder();
    expect(decoder.decode((await reader.read()).value)).toContain("event: ready");
    const created = await app(new Request("http://logos.local/api/workspace/entities", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "通知対象", operationId: "notify-create" }),
    }));
    const entity = (await created.json()) as { id: string };
    expect(decoder.decode((await reader.read()).value)).toContain(entity.id);
    await reader.cancel();
  });

  test("serves the input page", async () => {
    const app = createWorkspaceHttpApp(await workspace());
    const response = await app(new Request("http://logos.local/"));
    expect(response.headers.get("content-type")).toContain("text/html");
    const html = await response.text();
    expect(html).toContain("対象一覧");
    expect(html).toContain("週カレンダー");
    expect(html).toContain("見積時間一覧");
    expect(html).toContain("保存した値を復元");
    expect(html).toContain("未対応のComponent");
    const script = html.match(/<script>([\s\S]+)<\/script>/)?.[1];
    expect(script).toBeDefined();
    expect(() => new Function(script!)).not.toThrow();
  });
});
