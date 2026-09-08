import {
  RevisionConflictError,
  WorkspaceKernel,
  WorkspaceValidationError,
} from "./kernel";
import { workspacePage } from "./ui";
import { estimateProjection } from "./projections/estimate";

const json = (value: unknown, status = 200): Response =>
  Response.json(value, { status, headers: { "cache-control": "no-store" } });

interface CommandBody {
  operationId?: string;
  expectedRevision?: number;
  actor?: string;
  name?: string;
  data?: unknown;
  backup?: unknown;
  action?: "rename" | "archive" | "restore";
  targetEntityId?: string;
}

async function body(request: Request): Promise<CommandBody> {
  try {
    return (await request.json()) as CommandBody;
  } catch {
    throw new WorkspaceValidationError("Request body must be JSON");
  }
}

function typeId(kernel: WorkspaceKernel, value: string): string {
  if (!kernel.componentTypeIds().includes(value)) {
    throw new WorkspaceValidationError(`Unknown component type: ${value}`);
  }
  return value;
}

function operationId(value: string | undefined): string {
  if (!value) throw new WorkspaceValidationError("operationId is required");
  return value;
}

function expectedRevision(value: number | undefined): number {
  if (!Number.isInteger(value) || value === undefined || value < 0) {
    throw new WorkspaceValidationError("expectedRevision must be a non-negative integer");
  }
  return value;
}

export function createWorkspaceHttpApp(workspace: string): (request: Request) => Promise<Response> {
  const subscribers = new Set<ReadableStreamDefaultController<Uint8Array>>();
  const encoder = new TextEncoder();
  const notify = (entityId: string): void => {
    const message = encoder.encode(`data: ${JSON.stringify({ entityId })}\n\n`);
    for (const subscriber of subscribers) {
      try {
        subscriber.enqueue(message);
      } catch {
        subscribers.delete(subscriber);
      }
    }
  };
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    let kernel: WorkspaceKernel | undefined;
    try {
      if (request.method === "GET" && url.pathname === "/") {
        return new Response(workspacePage, { headers: { "content-type": "text/html; charset=utf-8" } });
      }
      if (request.method === "GET" && url.pathname === "/api/workspace/events") {
        let activeController: ReadableStreamDefaultController<Uint8Array> | undefined;
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            activeController = controller;
            subscribers.add(controller);
            controller.enqueue(encoder.encode("event: ready\ndata: {}\n\n"));
          },
          cancel() {
            if (activeController) subscribers.delete(activeController);
          },
        });
        return new Response(stream, {
          headers: {
            "content-type": "text/event-stream",
            "cache-control": "no-store",
            connection: "keep-alive",
          },
        });
      }
      kernel = await WorkspaceKernel.open(workspace);
      if (request.method === "GET" && url.pathname === "/api/workspace/entities") {
        const progress = url.searchParams.get("progress");
        const hasProgress = url.searchParams.get("hasProgress");
        return json({
          entities: kernel.list({
            ...(url.searchParams.get("name") ? { name: url.searchParams.get("name")! } : {}),
            ...(progress === "todo" || progress === "doing" || progress === "done" ? { progress } : {}),
            ...(hasProgress === "true" || hasProgress === "false"
              ? { hasProgress: hasProgress === "true" }
              : {}),
            ...(url.searchParams.get("includeArchived") === "true" ? { includeArchived: true } : {}),
          }),
        });
      }
      if (request.method === "POST" && url.pathname === "/api/workspace/sample") {
        const input = await body(request);
        const result = kernel.seedSample({
          operationId: operationId(input.operationId),
          ...(input.actor === undefined ? {} : { actor: input.actor }),
        });
        for (const entity of result.entities) notify(entity.id);
        return json(result, result.replayed ? 200 : 201);
      }
      if (request.method === "POST" && url.pathname === "/api/workspace/entities") {
        const input = await body(request);
        const entity = kernel.createEntity(input.name ?? "", { operationId: operationId(input.operationId) });
        notify(entity.id);
        return json(entity, 201);
      }
      if (request.method === "GET" && url.pathname === "/api/workspace/calendar") {
        return json({
          entries: kernel.calendar(
            url.searchParams.get("startUtc") ?? "",
            url.searchParams.get("endUtc") ?? "",
          ),
        });
      }
      if (request.method === "GET" && url.pathname === "/api/workspace/estimates") {
        return json(estimateProjection(kernel.list()));
      }
      if (request.method === "GET" && url.pathname === "/api/workspace/history") {
        return json({ events: kernel.history() });
      }
      if (request.method === "GET" && url.pathname === "/api/workspace/export") {
        return json(kernel.exportWorkspace());
      }
      if (request.method === "POST" && url.pathname === "/api/workspace/restore") {
        const input = await body(request);
        const restored = await WorkspaceKernel.restoreFromExport(
          workspace,
          input.backup,
          {
            operationId: operationId(input.operationId),
            ...(input.actor === undefined ? {} : { actor: input.actor }),
          },
        );
        try {
          const snapshot = restored.exportWorkspace();
          for (const entity of snapshot.entities) notify(entity.id);
          return json(snapshot);
        } finally {
          restored.close();
        }
      }
      const entityHistoryMatch = url.pathname.match(
        /^\/api\/workspace\/entities\/([^/]+)\/history$/,
      );
      if (entityHistoryMatch && request.method === "GET") {
        const entityId = decodeURIComponent(entityHistoryMatch[1]!);
        if (!kernel.get(entityId)) return json({ error: "Not found" }, 404);
        return json({ events: kernel.history(entityId) });
      }
      const entityMatch = url.pathname.match(/^\/api\/workspace\/entities\/([^/]+)$/);
      if (entityMatch && request.method === "GET") {
        const entity = kernel.get(decodeURIComponent(entityMatch[1]!));
        return entity ? json(entity) : json({ error: "Not found" }, 404);
      }
      if (entityMatch && request.method === "PATCH") {
        const entityId = decodeURIComponent(entityMatch[1]!);
        const input = await body(request);
        const metadata = {
          operationId: operationId(input.operationId),
          expectedRevision: expectedRevision(input.expectedRevision),
        };
        const entity = input.action === "rename"
          ? kernel.renameEntity(entityId, input.name ?? "", metadata)
          : input.action === "archive"
            ? kernel.archiveEntity(entityId, metadata)
            : input.action === "restore"
              ? kernel.restoreEntity(entityId, metadata)
              : (() => { throw new WorkspaceValidationError("Unknown entity action"); })();
        notify(entityId);
        return json(entity);
      }
      const referencesMatch = url.pathname.match(/^\/api\/workspace\/entities\/([^/]+)\/references$/);
      if (referencesMatch && request.method === "GET") {
        return json(kernel.references(decodeURIComponent(referencesMatch[1]!)));
      }
      if (referencesMatch && request.method === "POST") {
        const entityId = decodeURIComponent(referencesMatch[1]!);
        const input = await body(request);
        if (!input.targetEntityId) throw new WorkspaceValidationError("targetEntityId is required");
        const relation = kernel.addReference(entityId, input.targetEntityId, {
          operationId: operationId(input.operationId),
          expectedRevision: expectedRevision(input.expectedRevision),
        });
        notify(entityId);
        notify(input.targetEntityId);
        return json(relation, 201);
      }
      const referenceMatch = url.pathname.match(
        /^\/api\/workspace\/entities\/([^/]+)\/references\/([^/]+)$/,
      );
      if (referenceMatch && request.method === "DELETE") {
        const entityId = decodeURIComponent(referenceMatch[1]!);
        const targetEntityId = decodeURIComponent(referenceMatch[2]!);
        const input = await body(request);
        const relation = kernel.removeReference(entityId, targetEntityId, {
          operationId: operationId(input.operationId),
          expectedRevision: expectedRevision(input.expectedRevision),
        });
        notify(entityId);
        notify(targetEntityId);
        return json(relation);
      }
      const restoreComponentMatch = url.pathname.match(
        /^\/api\/workspace\/entities\/([^/]+)\/components\/([^/]+)\/restore$/,
      );
      if (restoreComponentMatch && request.method === "POST") {
        const entityId = decodeURIComponent(restoreComponentMatch[1]!);
        const componentType = typeId(kernel, decodeURIComponent(restoreComponentMatch[2]!));
        const input = await body(request);
        const entity = kernel.restoreComponent(entityId, componentType, {
          operationId: operationId(input.operationId),
          expectedRevision: expectedRevision(input.expectedRevision),
        });
        notify(entityId);
        return json(entity);
      }
      const componentMatch = url.pathname.match(
        /^\/api\/workspace\/entities\/([^/]+)\/components\/([^/]+)$/,
      );
      if (componentMatch && (request.method === "POST" || request.method === "PUT" || request.method === "DELETE")) {
        const entityId = decodeURIComponent(componentMatch[1]!);
        const componentType = typeId(kernel, decodeURIComponent(componentMatch[2]!));
        const input = await body(request);
        const metadata = {
          operationId: operationId(input.operationId),
          expectedRevision: expectedRevision(input.expectedRevision),
        };
        if (request.method === "DELETE") {
          const entity = kernel.disableComponent(entityId, componentType, metadata);
          notify(entityId);
          return json(entity);
        }
        if (request.method === "POST") {
          const entity = kernel.addComponent(
              entityId,
              componentType,
              metadata,
              input.data,
          );
          notify(entityId);
          return json(entity, 201);
        }
        const entity = kernel.updateComponent(
            entityId,
            componentType,
            input.data,
            metadata,
        );
        notify(entityId);
        return json(entity);
      }
      return json({ error: "Not found" }, 404);
    } catch (error) {
      if (error instanceof RevisionConflictError) {
        return json(
          {
            error: error.message,
            expectedRevision: error.expectedRevision,
            actualRevision: error.actualRevision,
            entity: kernel?.get(error.entityId),
          },
          409,
        );
      }
      if (error instanceof WorkspaceValidationError) return json({ error: error.message }, 400);
      return json({ error: (error as Error).message }, 500);
    } finally {
      kernel?.close();
    }
  };
}

export function startWorkspaceHttpServer(workspace: string, port = 4318): ReturnType<typeof Bun.serve> {
  return Bun.serve({ port, fetch: createWorkspaceHttpApp(workspace) });
}
