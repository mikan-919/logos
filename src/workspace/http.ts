import {
  RevisionConflictError,
  WorkspaceKernel,
  WorkspaceValidationError,
} from "./kernel";
import type { ComponentDataMap, ComponentTypeId } from "./types";
import { COMPONENT_TYPE_IDS } from "./types";
import { workspacePage } from "./ui";

const json = (value: unknown, status = 200): Response =>
  Response.json(value, { status, headers: { "cache-control": "no-store" } });

interface CommandBody {
  operationId?: string;
  expectedRevision?: number;
  name?: string;
  data?: unknown;
}

async function body(request: Request): Promise<CommandBody> {
  try {
    return (await request.json()) as CommandBody;
  } catch {
    throw new WorkspaceValidationError("Request body must be JSON");
  }
}

function typeId(value: string): ComponentTypeId {
  if (!COMPONENT_TYPE_IDS.includes(value as ComponentTypeId)) {
    throw new WorkspaceValidationError(`Unknown component type: ${value}`);
  }
  return value as ComponentTypeId;
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
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    let kernel: WorkspaceKernel | undefined;
    try {
      if (request.method === "GET" && url.pathname === "/") {
        return new Response(workspacePage, { headers: { "content-type": "text/html; charset=utf-8" } });
      }
      kernel = await WorkspaceKernel.open(workspace);
      if (request.method === "GET" && url.pathname === "/api/workspace/entities") {
        return json({ entities: kernel.list() });
      }
      if (request.method === "POST" && url.pathname === "/api/workspace/entities") {
        const input = await body(request);
        return json(kernel.createEntity(input.name ?? "", { operationId: operationId(input.operationId) }), 201);
      }
      const componentMatch = url.pathname.match(
        /^\/api\/workspace\/entities\/([^/]+)\/components\/([^/]+)$/,
      );
      if (componentMatch && (request.method === "POST" || request.method === "PUT")) {
        const entityId = decodeURIComponent(componentMatch[1]!);
        const componentType = typeId(decodeURIComponent(componentMatch[2]!));
        const input = await body(request);
        const metadata = {
          operationId: operationId(input.operationId),
          expectedRevision: expectedRevision(input.expectedRevision),
        };
        if (request.method === "POST") {
          return json(
            kernel.addComponent(
              entityId,
              componentType,
              metadata,
              input.data as ComponentDataMap[typeof componentType] | undefined,
            ),
            201,
          );
        }
        return json(
          kernel.updateComponent(
            entityId,
            componentType,
            input.data as ComponentDataMap[typeof componentType],
            metadata,
          ),
        );
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
