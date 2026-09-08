import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { createServer } from "node:net";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type {
  WorkspaceEntityView,
  WorkspaceExport,
  WorkspaceRelation,
} from "../src/workspace/types";

interface RunningWorkspaceServer {
  readonly baseUrl: string;
  readonly process: Bun.Subprocess;
  stop(): Promise<void>;
}

const workspaces: string[] = [];
const servers: RunningWorkspaceServer[] = [];
const workspaceCli = join(import.meta.dir, "..", "src", "workspace", "cli.ts");

async function workspace(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "logos-backup-e2e-"));
  workspaces.push(path);
  return path;
}

async function freePort(): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not determine an available TCP port"));
        return;
      }
      const port = address.port;
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

async function startServer(root: string): Promise<RunningWorkspaceServer> {
  const port = await freePort();
  const child = Bun.spawn(
    [process.execPath, "run", workspaceCli, "serve", "--port", String(port)],
    { cwd: root, stdout: "ignore", stderr: "pipe" },
  );
  const baseUrl = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/workspace/entities`);
      if (response.ok) {
        const server: RunningWorkspaceServer = {
          baseUrl,
          process: child,
          async stop(): Promise<void> {
            child.kill();
            await child.exited;
          },
        };
        servers.push(server);
        return server;
      }
    } catch {
      // The child can need a few attempts while Bun starts the HTTP listener.
    }
    if (child.exitCode !== null) {
      const stderr = child.stderr ? await new Response(child.stderr).text() : "";
      throw new Error(`Workspace server exited during startup: ${stderr}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  child.kill();
  await child.exited;
  const stderr = child.stderr ? await new Response(child.stderr).text() : "";
  throw new Error(`Workspace server did not start: ${stderr}`);
}

async function request<T>(
  baseUrl: string,
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const options: RequestInit = { method: init?.method ?? "GET" };
  if (init?.body !== undefined) {
    options.headers = { "content-type": "application/json" };
    options.body = JSON.stringify(init.body);
  }
  const response = await fetch(`${baseUrl}${path}`, options);
  const payload = await response.json() as unknown;
  if (!response.ok) {
    throw new Error(`${response.status} ${init?.method ?? "GET"} ${path}: ${JSON.stringify(payload)}`);
  }
  return payload as T;
}

async function component(
  server: RunningWorkspaceServer,
  entity: WorkspaceEntityView,
  typeId: string,
  data: unknown,
): Promise<WorkspaceEntityView> {
  return request<WorkspaceEntityView>(
    server.baseUrl,
    `/api/workspace/entities/${encodeURIComponent(entity.id)}/components/${encodeURIComponent(typeId)}`,
    {
      method: "POST",
      body: { operationId: `add-${typeId}-${entity.id}`, expectedRevision: entity.revision, data },
    },
  );
}

async function relation(
  server: RunningWorkspaceServer,
  from: WorkspaceEntityView,
  to: WorkspaceEntityView,
  operationId: string,
): Promise<WorkspaceRelation> {
  return request<WorkspaceRelation>(
    server.baseUrl,
    `/api/workspace/entities/${encodeURIComponent(from.id)}/references`,
    {
      method: "POST",
      body: { operationId, expectedRevision: from.revision, targetEntityId: to.id },
    },
  );
}

afterEach(async () => {
  for (const server of servers.splice(0).reverse()) await server.stop();
  await Promise.all(workspaces.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("workspace backup over running servers", () => {
  test("exports real HTTP data and restores it on another server", async () => {
    const sourceRoot = await workspace();
    const destinationRoot = await workspace();
    let source = await startServer(sourceRoot);
    const destination = await startServer(destinationRoot);

    let activity = await request<WorkspaceEntityView>(source.baseUrl, "/api/workspace/entities", {
      method: "POST",
      body: { operationId: "create-activity", name: "勉強会を開催する" },
    });
    const task = await request<WorkspaceEntityView>(source.baseUrl, "/api/workspace/entities", {
      method: "POST",
      body: { operationId: "create-task", name: "会場を予約する" },
    });
    const note = await request<WorkspaceEntityView>(source.baseUrl, "/api/workspace/entities", {
      method: "POST",
      body: { operationId: "create-note", name: "関連メモ" },
    });

    activity = await component(source, activity, "body", { markdown: "開催目的と内容" });
    activity = await component(source, activity, "progress", { status: "doing" });
    activity = await component(source, activity, "schedule", {
      startUtc: "2026-09-10T09:00:00Z",
      endUtc: "2026-09-10T10:30:00Z",
      timeZone: "Asia/Tokyo",
    });
    activity = await component(source, activity, "estimate", { minutes: 90 });

    activity = await request<WorkspaceEntityView>(
      source.baseUrl,
      `/api/workspace/entities/${encodeURIComponent(activity.id)}/components/body`,
      {
        method: "PUT",
        body: {
          operationId: "update-body",
          expectedRevision: activity.revision,
          data: { markdown: "更新した開催目的と内容" },
        },
      },
    );
    activity = await request<WorkspaceEntityView>(
      source.baseUrl,
      `/api/workspace/entities/${encodeURIComponent(activity.id)}/components/estimate`,
      {
        method: "PUT",
        body: {
          operationId: "update-estimate",
          expectedRevision: activity.revision,
          data: { minutes: 120 },
        },
      },
    );

    let changedTask = await component(source, task, "body", { markdown: "会場候補" });
    changedTask = await request<WorkspaceEntityView>(
      source.baseUrl,
      `/api/workspace/entities/${encodeURIComponent(changedTask.id)}/components/body`,
      {
        method: "DELETE",
        body: { operationId: "disable-task-body", expectedRevision: changedTask.revision },
      },
    );

    const activeRelation = await relation(source, activity, changedTask, "add-active-reference");
    activity = await request<WorkspaceEntityView>(
      source.baseUrl,
      `/api/workspace/entities/${encodeURIComponent(activity.id)}`,
    );
    await relation(source, activity, note, "add-removed-reference");
    activity = await request<WorkspaceEntityView>(
      source.baseUrl,
      `/api/workspace/entities/${encodeURIComponent(activity.id)}`,
    );
    const removedRelation = await request<WorkspaceRelation>(
      source.baseUrl,
      `/api/workspace/entities/${encodeURIComponent(activity.id)}/references/${encodeURIComponent(note.id)}`,
      {
        method: "DELETE",
        body: { operationId: "remove-reference", expectedRevision: activity.revision },
      },
    );
    expect(activeRelation.active).toBe(true);
    expect(removedRelation.active).toBe(false);

    await source.stop();
    const sourceIndex = servers.indexOf(source);
    if (sourceIndex >= 0) servers.splice(sourceIndex, 1);
    const sourceDatabase = new Database(join(sourceRoot, ".logos-workspace", "workspace.sqlite"));
    const unknownAt = new Date().toISOString();
    sourceDatabase
      .query(
        `INSERT INTO components
          (entity_id, type_id, schema_version, data_json, active, created_at, updated_at, disabled_at)
         VALUES (?, 'future-feature', 7, ?, 1, ?, ?, NULL)`,
      )
      .run(activity.id, JSON.stringify({ retained: true, source: "real-server" }), unknownAt, unknownAt);
    sourceDatabase.close();
    source = await startServer(sourceRoot);

    const sourceExport = await request<WorkspaceExport>(source.baseUrl, "/api/workspace/export");
    expect(sourceExport.entities.map((entity) => entity.id)).toEqual(
      expect.arrayContaining([activity.id, changedTask.id, note.id]),
    );
    expect(sourceExport.components).toContainEqual(expect.objectContaining({
      entityId: activity.id,
      typeId: "estimate",
      data: { minutes: 120 },
    }));
    expect(sourceExport.components).toContainEqual(expect.objectContaining({
      entityId: changedTask.id,
      typeId: "body",
      active: false,
      data: { markdown: "会場候補" },
    }));
    expect(sourceExport.components).toContainEqual(expect.objectContaining({
      entityId: activity.id,
      typeId: "future-feature",
      schemaVersion: 7,
      data: { retained: true, source: "real-server" },
    }));
    expect(sourceExport.relations).toEqual(expect.arrayContaining([
      activeRelation,
      removedRelation,
    ]));

    const restored = await request<WorkspaceExport>(destination.baseUrl, "/api/workspace/restore", {
      method: "POST",
      body: { operationId: "restore-from-real-server", actor: "backup-user", backup: sourceExport },
    });
    const destinationExport = await request<WorkspaceExport>(destination.baseUrl, "/api/workspace/export");

    expect(restored.entities).toEqual(sourceExport.entities);
    expect(restored.components).toEqual(sourceExport.components);
    expect(restored.relations).toEqual(sourceExport.relations);
    expect(destinationExport.entities).toEqual(sourceExport.entities);
    expect(destinationExport.components).toEqual(sourceExport.components);
    expect(destinationExport.relations).toEqual(sourceExport.relations);
    expect(destinationExport.events.slice(0, -1)).toEqual(sourceExport.events);
    expect(destinationExport.events.at(-1)).toMatchObject({
      command: "workspace.restore",
      entityId: "__workspace__",
      operationId: "restore-from-real-server",
    });

    const sourceHistory = await request<{ events: unknown[] }>(source.baseUrl, "/api/workspace/history");
    const destinationHistory = await request<{ events: unknown[] }>(destination.baseUrl, "/api/workspace/history");
    expect(destinationHistory.events.slice(0, -1)).toEqual(sourceHistory.events);
    for (const entity of sourceExport.entities) {
      const entityPath = `/api/workspace/entities/${encodeURIComponent(entity.id)}/history`;
      const sourceEntityHistory = await request<{ events: unknown[] }>(source.baseUrl, entityPath);
      const destinationEntityHistory = await request<{ events: unknown[] }>(destination.baseUrl, entityPath);
      expect(destinationEntityHistory.events).toEqual(sourceEntityHistory.events);
    }

    const destinationRelations = await request<{ outgoing: WorkspaceRelation[]; incoming: WorkspaceRelation[] }>(
      destination.baseUrl,
      `/api/workspace/entities/${encodeURIComponent(activity.id)}/references`,
    );
    expect(destinationRelations.outgoing).toEqual([activeRelation]);

    const replayed = await request<WorkspaceExport>(destination.baseUrl, "/api/workspace/restore", {
      method: "POST",
      body: { operationId: "restore-from-real-server", actor: "retry-user", backup: sourceExport },
    });
    expect(replayed.entities).toEqual(sourceExport.entities);
    expect(replayed.events).toEqual(destinationExport.events);
  });
});
