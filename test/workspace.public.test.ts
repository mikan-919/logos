import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
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
  test("builds Task, Note, Calendar, and Tag views from shared components", async () => {
    const kernel = await WorkspaceKernel.open(await workspace());
    const tag = kernel.createEntity("設計", { operationId: "create-tag" }, [
      { typeId: "this-is-tag", data: {} },
    ]);
    const shared = kernel.createEntity("同じEntity", { operationId: "create-shared" }, [
      { typeId: "task", data: { status: "doing" } },
      { typeId: "note", data: { body: "共有する本文" } },
      {
        typeId: "event",
        data: {
          startUtc: "2026-09-10T09:00:00Z",
          endUtc: "2026-09-10T10:00:00Z",
          timeZone: "Asia/Tokyo",
        },
      },
      { typeId: "tag", data: { entityIds: [tag.id] } },
    ]);
    const noteWithoutTag = kernel.createEntity("Tagなし", { operationId: "create-untagged" }, [
      { typeId: "note", data: { body: "本文" } },
    ]);

    expect(kernel.view("tasks")?.entities.map((entity) => entity.id)).toContain(shared.id);
    expect(kernel.view("calendar")?.entities.map((entity) => entity.id)).toContain(shared.id);
    expect(kernel.calendar("2026-09-10T00:00:00Z", "2026-09-11T00:00:00Z")).toMatchObject([
      { entity: { id: shared.id }, event: { typeId: "event" }, task: { typeId: "task" } },
    ]);
    expect(kernel.view("notes")?.entities.map((entity) => entity.id)).toEqual(
      expect.arrayContaining([shared.id, noteWithoutTag.id]),
    );
    expect(kernel.view("tagged-notes")?.entities.map((entity) => entity.id)).toEqual([shared.id]);
    expect(kernel.view("notes", ["task"])?.entities.map((entity) => entity.id)).toEqual([shared.id]);
    expect(kernel.view("tags")?.entities.map((entity) => entity.id)).toEqual([tag.id]);
    expect(() => kernel.createEntity("不正なTag割当", { operationId: "create-invalid-tag" }, [
      { typeId: "tag", data: { entityIds: ["missing-tag"] } },
    ])).toThrow("Unknown Tag entity");
    expect(() => kernel.disableComponent(tag.id, "this-is-tag", {
      operationId: "disable-assigned-tag",
      expectedRevision: tag.revision,
    })).toThrow("This entity is used as a Tag");
    kernel.close();
  });

  test("migrates version 1 backup names and components", async () => {
    const at = "2026-09-01T00:00:00.000Z";
    const legacyExport = {
      format: "logos.workspace",
      version: 1,
      exportedAt: at,
      entities: [{ id: "legacy-entity", name: "旧形式", createdAt: at, updatedAt: at, revision: 3 }],
      components: [
        { entityId: "legacy-entity", typeId: "body", schemaVersion: 1, data: { markdown: "本文" }, active: true, createdAt: at, updatedAt: at },
        { entityId: "legacy-entity", typeId: "progress", schemaVersion: 1, data: { status: "doing" }, active: true, createdAt: at, updatedAt: at },
        { entityId: "legacy-entity", typeId: "schedule", schemaVersion: 1, data: { startUtc: "2026-09-10T09:00:00Z", endUtc: "2026-09-10T10:00:00Z", timeZone: "UTC" }, active: true, createdAt: at, updatedAt: at },
      ],
      relations: [],
      events: [],
    };
    const restored = await WorkspaceKernel.restoreFromExport(
      await workspace(),
      legacyExport,
      { operationId: "restore-legacy-export" },
    );
    expect(restored.get("legacy-entity")).toMatchObject({
      name: "旧形式",
      components: expect.arrayContaining([
        expect.objectContaining({ typeId: "name", data: { value: "旧形式" } }),
        expect.objectContaining({ typeId: "note", data: { body: "本文" } }),
        expect.objectContaining({ typeId: "task", data: { status: "doing" } }),
        expect.objectContaining({ typeId: "event" }),
      ]),
    });
    restored.close();
  });

  test("migrates the existing SQLite schema and preserves its current state", async () => {
    const root = await workspace();
    const databaseDirectory = join(root, ".logos-workspace");
    const databasePath = join(databaseDirectory, "workspace.sqlite");
    await mkdir(databaseDirectory, { recursive: true });
    const database = new Database(databasePath);
    database.exec(`
      CREATE TABLE entities (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL, revision INTEGER NOT NULL, archived_at TEXT
      );
      CREATE TABLE components (
        entity_id TEXT NOT NULL REFERENCES entities(id), type_id TEXT NOT NULL,
        schema_version INTEGER NOT NULL, data_json TEXT NOT NULL, active INTEGER NOT NULL,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL, disabled_at TEXT,
        PRIMARY KEY (entity_id, type_id)
      );
      CREATE TABLE events (
        sequence INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE,
        schema_version INTEGER NOT NULL, operation_id TEXT NOT NULL UNIQUE,
        entity_id TEXT NOT NULL, command TEXT NOT NULL, before_revision INTEGER NOT NULL,
        after_revision INTEGER NOT NULL, changes_json TEXT NOT NULL, actor TEXT NOT NULL, at TEXT NOT NULL
      );
      CREATE TABLE relations (
        id TEXT PRIMARY KEY, from_entity_id TEXT NOT NULL REFERENCES entities(id),
        to_entity_id TEXT NOT NULL REFERENCES entities(id), type TEXT NOT NULL,
        active INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL, created_operation_id TEXT NOT NULL, removed_at TEXT,
        UNIQUE (from_entity_id, to_entity_id, type)
      );
      INSERT INTO entities VALUES ('legacy-db-entity', '旧DB', '2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z', 1, NULL);
      INSERT INTO components VALUES ('legacy-db-entity', 'body', 1, '{"markdown":"DB本文"}', 1, '2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z', NULL);
      INSERT INTO components VALUES ('legacy-db-entity', 'progress', 1, '{"status":"todo"}', 1, '2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z', NULL);
      INSERT INTO events VALUES (1, 'legacy-db-event', 1, 'legacy-db-create', 'legacy-db-entity', 'entity.create', -1, 0, '{}', 'tester', '2026-09-01T00:00:00.000Z');
      PRAGMA user_version = 1;
    `);
    database.close();

    const migrated = await WorkspaceKernel.open(root);
    expect(migrated.get("legacy-db-entity")).toMatchObject({
      name: "旧DB",
      components: expect.arrayContaining([
        expect.objectContaining({ typeId: "name", data: { value: "旧DB" } }),
        expect.objectContaining({ typeId: "note", data: { body: "DB本文" } }),
        expect.objectContaining({ typeId: "task", data: { status: "todo" } }),
      ]),
    });
    expect(migrated.history("legacy-db-entity")).toHaveLength(1);
    migrated.close();

    const migratedDatabase = new Database(databasePath);
    expect(migratedDatabase.query<{ name: string }, []>("PRAGMA table_info(entities)").all().some((column) => column.name === "name")).toBe(false);
    expect(migratedDatabase.query<{ user_version: number }, []>("PRAGMA user_version").get()?.user_version).toBe(2);
    migratedDatabase.close();
  });

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

  test("loads the sample workflow with entity history and keeps it after restart", async () => {
    const root = await workspace();
    let kernel = await WorkspaceKernel.open(root);
    const loaded = kernel.seedSample({ operationId: "sample-load", actor: "demo" });
    expect(loaded.replayed).toBe(false);
    expect(loaded.entities.map((entity) => entity.name)).toEqual([
      "勉強会を開催する",
      "記事を書く",
      "設計",
    ]);
    expect(loaded.entities[0]?.components).toHaveLength(4);
    expect(loaded.entities[0]?.components).toEqual(expect.arrayContaining([
      expect.objectContaining({ typeId: "name", data: { value: "勉強会を開催する" } }),
      expect.objectContaining({ typeId: "note", active: true }),
      expect.objectContaining({ typeId: "task", data: { status: "done" } }),
      expect.objectContaining({ typeId: "event", active: true }),
    ]));
    expect(kernel.history(loaded.entities[0]!.id).map((event) => event.command)).toEqual([
      "entity.create",
      "component.add",
      "component.add",
      "component.add",
    ]);
    expect(kernel.history().at(-1)).toMatchObject({
      operationId: "sample-load",
      command: "workspace.sample",
      actor: "demo",
      entityId: "__workspace__",
    });
    const firstState = loaded.entities;
    kernel.close();

    kernel = await WorkspaceKernel.open(root);
    const replayed = kernel.seedSample({ operationId: "sample-load", actor: "another-user" });
    expect(replayed.replayed).toBe(true);
    expect(replayed.entities).toEqual(firstState);
    expect(kernel.list()).toHaveLength(3);
    expect(kernel.history().filter((event) => event.command === "workspace.sample")).toHaveLength(1);
    kernel.close();
  });

  test("does not load samples into a non-empty workspace", async () => {
    const kernel = await WorkspaceKernel.open(await workspace());
    const existing = kernel.createEntity("既存データ", { operationId: "existing-create" });
    expect(() => kernel.seedSample({ operationId: "sample-occupied" })).toThrow(
      "empty workspace",
    );
    expect(kernel.list({ includeArchived: true })).toEqual([existing]);
    expect(kernel.history()).toHaveLength(1);
    kernel.close();
  });

  test("rolls back every sample write when its history event fails", async () => {
    const root = await workspace();
    const first = await WorkspaceKernel.open(root);
    const path = first.databasePath();
    first.close();
    const database = new Database(path);
    database.exec(`
      CREATE TRIGGER reject_sample_event
      BEFORE INSERT ON events
      WHEN NEW.operation_id = 'sample-failure'
      BEGIN
        SELECT RAISE(ABORT, 'forced sample failure');
      END;
    `);
    database.close();

    const kernel = await WorkspaceKernel.open(root);
    expect(() => kernel.seedSample({ operationId: "sample-failure" })).toThrow(
      "forced sample failure",
    );
    expect(kernel.list({ includeArchived: true })).toEqual([]);
    expect(kernel.history()).toEqual([]);
    kernel.close();
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
    expect(kernel.get(entity.id)?.components).toHaveLength(1);
    expect(kernel.get(entity.id)?.components[0]).toMatchObject({ typeId: "name", active: true });
    expect(kernel.history(entity.id)).toHaveLength(1);
    kernel.close();
  });

  test("validates optional Task and Event details", async () => {
    const kernel = await WorkspaceKernel.open(await workspace());
    let entity = kernel.createEntity("仕様を書く", { operationId: "create-detailed" });
    entity = kernel.addComponent(
      entity.id,
      "task",
      { operationId: "add-detailed-task", expectedRevision: entity.revision },
      { status: "doing", due: "2026-09-30", priority: "high", description: "APIの仕様" },
    );
    expect(entity.components.find((item) => item.typeId === "task")?.data).toEqual({
      status: "doing",
      due: "2026-09-30",
      priority: "high",
      description: "APIの仕様",
    });

    expect(() => kernel.updateComponent(
      entity.id,
      "task",
      { status: "doing", due: "2026-02-30", priority: "high", description: "APIの仕様" },
      { operationId: "invalid-task-date", expectedRevision: entity.revision },
    )).toThrow(WorkspaceValidationError);
    expect(() => kernel.updateComponent(
      entity.id,
      "task",
      { status: "doing", priority: "urgent" },
      { operationId: "invalid-task-priority", expectedRevision: entity.revision },
    )).toThrow(WorkspaceValidationError);

    entity = kernel.addComponent(
      entity.id,
      "event",
      { operationId: "add-detailed-event", expectedRevision: entity.revision },
      {
        startUtc: "2026-09-30T09:00:00Z",
        endUtc: "2026-09-30T10:00:00Z",
        timeZone: "Asia/Tokyo",
        location: "会議室A",
        description: "設計確認",
      },
    );
    expect(entity.components.find((item) => item.typeId === "event")?.data).toEqual({
      startUtc: "2026-09-30T09:00:00.000Z",
      endUtc: "2026-09-30T10:00:00.000Z",
      timeZone: "Asia/Tokyo",
      location: "会議室A",
      description: "設計確認",
    });
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
    expect(disabled.components.find((component) => component.typeId === "progress")).toMatchObject({ active: false, data: { status: "doing" } });
    const restored = kernel.restoreComponent(entity.id, "progress", {
      operationId: "restore-progress",
      expectedRevision: disabled.revision,
    });
    expect(restored.components.find((component) => component.typeId === "progress")).toMatchObject({ active: true, data: { status: "doing" } });
    kernel.close();
  });

  test("treats all eight component combinations as valid and queryable", async () => {
    const kernel = await WorkspaceKernel.open(await workspace());
    for (let mask = 0; mask < 8; mask++) {
      let entity = kernel.createEntity(`組み合わせ${mask}`, { operationId: `create-${mask}` });
      if (mask & 1) {
        entity = kernel.addComponent(
          entity.id,
          "note",
          { operationId: `note-${mask}`, expectedRevision: entity.revision },
          { body: `本文${mask}` },
        );
      }
      if (mask & 2) {
        entity = kernel.addComponent(
          entity.id,
          "task",
          { operationId: `task-${mask}`, expectedRevision: entity.revision },
          { status: "doing" },
        );
      }
      if (mask & 4) {
        entity = kernel.addComponent(
          entity.id,
          "event",
          { operationId: `event-${mask}`, expectedRevision: entity.revision },
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

  test("calendar reads active Events and does not require a Task", async () => {
    const kernel = await WorkspaceKernel.open(await workspace());
    let scheduled = kernel.createEntity("予定だけの対象", { operationId: "create-scheduled" });
    scheduled = kernel.addComponent(
      scheduled.id,
      "event",
      { operationId: "add-event", expectedRevision: scheduled.revision },
      {
        startUtc: "2026-09-08T23:00:00Z",
        endUtc: "2026-09-09T00:00:00Z",
        timeZone: "Asia/Tokyo",
      },
    );
    const entry = kernel.calendar("2026-09-08T00:00:00Z", "2026-09-10T00:00:00Z")[0];
    expect(entry?.entity.id).toBe(scheduled.id);
    expect(entry?.task).toBeUndefined();
    kernel.disableComponent(scheduled.id, "event", {
      operationId: "disable-event",
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
    expect(kernel.get(entity.id)).toMatchObject({
      revision: 0,
      components: [expect.objectContaining({ typeId: "name", data: { value: "原子的保存" } })],
    });
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
      components: expect.arrayContaining([
        expect.objectContaining({ typeId: "name", data: { value: "変更後" } }),
        expect.objectContaining({ typeId: "body", data: { markdown: "保持する本文" } }),
      ]),
    });
    const restored = kernel.restoreEntity(entity.id, {
      operationId: "restore",
      expectedRevision: entity.revision,
    });
    expect(restored).toMatchObject({ id: entity.id, name: "変更後" });
    expect(restored.archivedAt).toBeUndefined();
    kernel.close();
  });

  test("exports current state and history, then restores it without replaying events", async () => {
    const source = await workspace();
    let kernel = await WorkspaceKernel.open(source);
    let activity = kernel.createEntity("復元する活動", { operationId: "create-activity" });
    const task = kernel.createEntity("復元する作業", { operationId: "create-task" });
    activity = kernel.addComponent(
      activity.id,
      "body",
      { operationId: "add-body", expectedRevision: activity.revision },
      { markdown: "保持する本文" },
    );
    activity = kernel.addComponent(
      activity.id,
      "progress",
      { operationId: "add-progress", expectedRevision: activity.revision },
      { status: "doing" },
    );
    const relation = kernel.addReference(activity.id, task.id, {
      operationId: "add-reference",
      expectedRevision: activity.revision,
      actor: "author",
    });
    kernel.removeReference(activity.id, task.id, {
      operationId: "remove-reference",
      expectedRevision: activity.revision + 1,
    });
    let sourceEntity = kernel.get(activity.id);
    const sourceHistory = kernel.history(activity.id);
    const sourcePath = kernel.databasePath();
    kernel.close();

    const database = new Database(sourcePath);
    const at = new Date().toISOString();
    database.query(
      `INSERT INTO components
        (entity_id, type_id, schema_version, data_json, active, created_at, updated_at, disabled_at)
       VALUES (?, 'future-feature', 7, ?, 1, ?, ?, NULL)`,
    ).run(activity.id, JSON.stringify({ retained: true }), at, at);
    database.close();

    kernel = await WorkspaceKernel.open(source);
    sourceEntity = kernel.get(activity.id);
    const snapshot = kernel.exportWorkspace();
    expect(snapshot.format).toBe("logos.workspace");
    expect(snapshot.version).toBe(2);
    expect(snapshot.entities.some((entity) => entity.id === activity.id)).toBe(true);
    expect(snapshot.events.map((event) => event.operationId)).toEqual(
      ["create-activity", "create-task", "add-body", "add-progress", "add-reference", "remove-reference"],
    );
    expect(snapshot.components).toContainEqual(
      expect.objectContaining({ typeId: "future-feature", data: { retained: true } }),
    );
    expect(snapshot.relations).toContainEqual(expect.objectContaining({
      id: relation.id,
      active: false,
    }));
    kernel.close();

    const destination = await workspace();
    const restored = await WorkspaceKernel.restoreFromExport(destination, snapshot, {
      operationId: "restore-workspace",
      actor: "backup-user",
    });
    expect(restored.get(activity.id)).toEqual(sourceEntity);
    expect(restored.history(activity.id)).toEqual(sourceHistory);
    expect(restored.get(activity.id)?.components).toContainEqual(
      expect.objectContaining({ typeId: "future-feature", data: { retained: true } }),
    );
    expect(restored.exportWorkspace().relations).toEqual(snapshot.relations);
    expect(restored.history().at(-1)).toMatchObject({
      command: "workspace.restore",
      entityId: "__workspace__",
      operationId: "restore-workspace",
      actor: "backup-user",
    });
    restored.close();

    const reopened = await WorkspaceKernel.open(destination);
    expect(reopened.get(activity.id)).toEqual(sourceEntity);
    expect(reopened.get(task.id)?.name).toBe("復元する作業");
    expect(reopened.history(activity.id)).toEqual(sourceHistory);
    reopened.close();
  });

  test("rejects an invalid export before writing any restored state", async () => {
    const destination = await workspace();
    const invalid = {
      format: "logos.workspace",
      version: 1,
      exportedAt: new Date().toISOString(),
      entities: [],
      components: [],
      relations: [],
      events: [{
        id: "event-1",
        schemaVersion: 1,
        operationId: "operation-1",
        entityId: "missing",
        command: "entity.rename",
        beforeRevision: 0,
        afterRevision: 1,
        changes: { name: "不正" },
        actor: "tester",
        at: new Date().toISOString(),
      }],
    };
    await expect(
      WorkspaceKernel.restoreFromExport(destination, invalid, { operationId: "restore-invalid" }),
    ).rejects.toThrow("unknown entity");
    const kernel = await WorkspaceKernel.open(destination);
    expect(kernel.list({ includeArchived: true })).toEqual([]);
    expect(kernel.history()).toEqual([]);
    kernel.close();
  });

  test("does not replace a non-empty workspace and treats restore retry as idempotent", async () => {
    const source = await workspace();
    const sourceKernel = await WorkspaceKernel.open(source);
    sourceKernel.createEntity("バックアップ元", { operationId: "source-create" });
    const snapshot = sourceKernel.exportWorkspace();
    sourceKernel.close();

    const occupied = await workspace();
    const occupiedKernel = await WorkspaceKernel.open(occupied);
    const existing = occupiedKernel.createEntity("既存データ", { operationId: "existing-create" });
    occupiedKernel.close();
    await expect(
      WorkspaceKernel.restoreFromExport(occupied, snapshot, { operationId: "restore-occupied" }),
    ).rejects.toThrow("empty workspace");
    const stillOccupied = await WorkspaceKernel.open(occupied);
    expect(stillOccupied.get(existing.id)?.name).toBe("既存データ");
    stillOccupied.close();

    const destination = await workspace();
    const restored = await WorkspaceKernel.restoreFromExport(destination, snapshot, {
      operationId: "restore-retry",
    });
    restored.close();
    const replayed = await WorkspaceKernel.restoreFromExport(destination, snapshot, {
      operationId: "restore-retry",
    });
    expect(replayed.history().filter((event) => event.command === "workspace.restore")).toHaveLength(1);
    expect(replayed.list()).toHaveLength(1);
    replayed.close();
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
          components: expect.arrayContaining([
            expect.objectContaining({ typeId: "name", active: true, data: { value: "記事を書く" } }),
            expect.objectContaining({ typeId: "body", active: true, data: { markdown: "本文" } }),
          ]),
        },
      ],
    });
    const history = await app(
      new Request(`http://logos.local/api/workspace/entities/${entity.id}/history`),
    );
    expect(await history.json()).toMatchObject({
      events: [
        { command: "entity.create", operationId: "http-create" },
        { command: "component.add", operationId: "http-add-body" },
      ],
    });
    const exported = await app(new Request("http://logos.local/api/workspace/export"));
    const backup = await exported.json();
    expect(backup).toMatchObject({ format: "logos.workspace", version: 2 });
    const allHistory = await app(new Request("http://logos.local/api/workspace/history"));
    const allHistoryValue = await allHistory.json() as { events: Array<{ operationId: string }> };
    expect(allHistoryValue.events[0]).toMatchObject({ operationId: "http-create" });

    const destination = await workspace();
    const destinationApp = createWorkspaceHttpApp(destination);
    const restore = await destinationApp(new Request("http://logos.local/api/workspace/restore", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ backup, operationId: "http-restore", actor: "operator" }),
    }));
    expect(restore.status).toBe(200);
    expect(await restore.json()).toMatchObject({
      format: "logos.workspace",
      entities: [{ id: entity.id }],
      events: [
        { operationId: "http-create" },
        { operationId: "http-add-body" },
        { operationId: "http-restore", command: "workspace.restore", actor: "operator" },
      ],
    });
    const restoredEntity = await destinationApp(
      new Request(`http://logos.local/api/workspace/entities/${entity.id}`),
    );
    expect(await restoredEntity.json()).toMatchObject({ id: entity.id, revision: 1 });
  });

  test("loads and retries sample data through the HTTP command boundary", async () => {
    const root = await workspace();
    const app = createWorkspaceHttpApp(root);
    const first = await app(new Request("http://logos.local/api/workspace/sample", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ operationId: "http-sample", actor: "operator" }),
    }));
    expect(first.status).toBe(201);
    const firstValue = await first.json() as {
      entities: Array<{ id: string }>;
      replayed: boolean;
    };
    expect(firstValue.replayed).toBe(false);
    expect(firstValue.entities).toHaveLength(3);

    const retry = await app(new Request("http://logos.local/api/workspace/sample", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ operationId: "http-sample" }),
    }));
    expect(retry.status).toBe(200);
    const retryValue = await retry.json() as {
      entities: Array<{ id: string }>;
      replayed: boolean;
    };
    expect(retryValue).toMatchObject({ replayed: true, entities: firstValue.entities });

    const exported = await app(new Request("http://logos.local/api/workspace/export"));
    const snapshot = await exported.json();
    const restoreSnapshot = structuredClone(snapshot);
    expect(snapshot).toMatchObject({
      components: expect.arrayContaining([
        expect.objectContaining({ typeId: "name", data: { value: "勉強会を開催する" } }),
        expect.objectContaining({ typeId: "name", data: { value: "記事を書く" } }),
        expect.objectContaining({ typeId: "this-is-tag" }),
      ]),
      events: expect.arrayContaining([
        expect.objectContaining({ operationId: "http-sample", command: "workspace.sample" }),
      ]),
    });
    const destination = await workspace();
    const restored = await WorkspaceKernel.restoreFromExport(destination, restoreSnapshot, {
      operationId: "http-sample-restore",
    });
    expect(restored.list()).toHaveLength(3);
    expect(restored.history().some((event) => event.command === "workspace.sample")).toBe(true);
    restored.close();
  });

  test("exposes declared view requirements and extra query requirements over HTTP", async () => {
    const root = await workspace();
    const kernel = await WorkspaceKernel.open(root);
    const entity = kernel.createEntity("Note兼Task", { operationId: "create-note-task" }, [
      { typeId: "note", data: { body: "本文" } },
      { typeId: "task", data: { status: "todo" } },
    ]);
    kernel.createEntity("Noteのみ", { operationId: "create-note-only" }, [
      { typeId: "note", data: { body: "別の本文" } },
    ]);
    kernel.close();

    const app = createWorkspaceHttpApp(root);
    const definitions = await app(new Request("http://logos.local/api/workspace/views"));
    expect(await definitions.json()).toMatchObject({
      views: expect.arrayContaining([
        expect.objectContaining({ id: "tasks", requires: ["name", "task"] }),
        expect.objectContaining({ id: "notes", requires: ["name", "note"] }),
      ]),
    });
    const filtered = await app(new Request("http://logos.local/api/workspace/views/notes?require=task"));
    expect(await filtered.json()).toMatchObject({
      definition: { id: "notes" },
      entities: [{ id: entity.id }],
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
      "event",
      { operationId: "add-event", expectedRevision: activity.revision },
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
    expect(await calendar.json()).toMatchObject({
      entries: [{ entity: { id: activity.id }, event: { typeId: "event" } }],
    });
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
    const removeEvent = await app(new Request(
      `http://logos.local/api/workspace/entities/${activity.id}/components/event`,
      {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ operationId: "http-disable", expectedRevision: activity.revision + 1 }),
      },
    ));
    expect(removeEvent.status).toBe(200);
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
    expect(html).toContain(">Task</button>");
    expect(html).toContain("Calendar");
    expect(html).toContain(">Note</button>");
    expect(html).toContain("components");
    expect(html).toContain("role=\"tablist\"");
    expect(html).toContain("renderListPane(type)");
    expect(html).toContain("renderCalendar(selected)");
    expect(html).not.toContain("component-count");
    expect(html).toContain("activeComponents(entity).length + ' components</button>'");
    expect(html).toContain(".component-popover");
    expect(html).toContain("tagged-notes");
    expect(html).toContain("未対応Component");
    expect(html).toContain("履歴");
    expect(html).toContain("エクスポート");
    expect(html).toContain("復元ファイル");
    expect(html).toContain("サンプルを読み込む");
    expect(html).toContain("/api/workspace/sample");
    const script = html.match(/<script>([\s\S]+)<\/script>/)?.[1];
    expect(script).toBeDefined();
    expect(() => new Function(script!)).not.toThrow();
  });
});
