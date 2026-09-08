import { WorkspaceValidationError } from "./errors";
import { WorkspaceKernel } from "./kernel";
import type { EntityQuery, ProgressStatus } from "./types";

interface McpRequest {
  jsonrpc: "2.0";
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}

const tools = [
  {
    name: "logos_workspace_entities_list",
    description: "List workspace entities and their components without changing workspace state.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Case-insensitive entity name filter." },
        hasProgress: { type: "boolean" },
        progress: { type: "string", enum: ["todo", "doing", "done"] },
        includeArchived: { type: "boolean", default: false },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 25 },
      },
      additionalProperties: false,
    },
  },
  {
    name: "logos_workspace_entity_get",
    description: "Get one workspace entity, its components, and its references without changing workspace state.",
    inputSchema: {
      type: "object",
      properties: { entityId: { type: "string" } },
      required: ["entityId"],
      additionalProperties: false,
    },
  },
];

const textResult = (value: unknown) => ({ content: [{ type: "text", text: JSON.stringify(value) }] });

function optionalBoolean(value: unknown, name: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") throw new WorkspaceValidationError(`${name} must be a boolean`);
  return value;
}

function listArguments(value: unknown): { query: EntityQuery; limit: number } {
  if (value === undefined) return { query: {}, limit: 25 };
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new WorkspaceValidationError("arguments must be an object");
  }
  const args = value as Record<string, unknown>;
  const allowed = new Set(["name", "hasProgress", "progress", "includeArchived", "limit"]);
  const unsupported = Object.keys(args).find((key) => !allowed.has(key));
  if (unsupported) throw new WorkspaceValidationError(`Unsupported argument: ${unsupported}`);
  if (args.name !== undefined && typeof args.name !== "string") {
    throw new WorkspaceValidationError("name must be a string");
  }
  const statuses: ProgressStatus[] = ["todo", "doing", "done"];
  if (args.progress !== undefined && !statuses.includes(args.progress as ProgressStatus)) {
    throw new WorkspaceValidationError("progress must be todo, doing, or done");
  }
  const hasProgress = optionalBoolean(args.hasProgress, "hasProgress");
  const includeArchived = optionalBoolean(args.includeArchived, "includeArchived");
  const limit = args.limit ?? 25;
  if (!Number.isInteger(limit) || Number(limit) < 1 || Number(limit) > 50) {
    throw new WorkspaceValidationError("limit must be an integer from 1 to 50");
  }
  return {
    query: {
      ...(args.name !== undefined ? { name: args.name as string } : {}),
      ...(hasProgress !== undefined ? { hasProgress } : {}),
      ...(args.progress !== undefined ? { progress: args.progress as ProgressStatus } : {}),
      ...(includeArchived !== undefined ? { includeArchived } : {}),
    },
    limit: Number(limit),
  };
}

function requiredEntityId(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new WorkspaceValidationError("arguments must be an object");
  }
  const args = value as Record<string, unknown>;
  if (Object.keys(args).some((key) => key !== "entityId")) {
    throw new WorkspaceValidationError("Only entityId is supported");
  }
  if (typeof args.entityId !== "string" || !args.entityId.trim()) {
    throw new WorkspaceValidationError("entityId is required");
  }
  return args.entityId;
}

export async function handleWorkspaceMcpMessage(workspace: string, request: McpRequest): Promise<unknown> {
  const base = { jsonrpc: "2.0" as const, id: request.id ?? null };
  try {
    if (request.method === "initialize") {
      return {
        ...base,
        result: {
          protocolVersion: "2025-06-18",
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "logos-workspace", version: "0.1.0" },
        },
      };
    }
    if (request.method === "notifications/initialized") return { ...base, result: {} };
    if (request.method === "tools/list") return { ...base, result: { tools } };
    if (request.method !== "tools/call") {
      return { ...base, error: { code: -32601, message: `Method not found: ${request.method}` } };
    }

    const name = request.params?.name;
    const args = request.params?.arguments;
    const kernel = await WorkspaceKernel.open(workspace);
    try {
      if (name === "logos_workspace_entities_list") {
        const { query, limit } = listArguments(args);
        const matches = kernel.list(query);
        return {
          ...base,
          result: textResult({ entities: matches.slice(0, limit), selection: { limit, truncated: matches.length > limit } }),
        };
      }
      if (name === "logos_workspace_entity_get") {
        const entityId = requiredEntityId(args);
        const entity = kernel.get(entityId);
        if (!entity) throw new WorkspaceValidationError(`Unknown entity: ${entityId}`);
        return { ...base, result: textResult({ entity, references: kernel.references(entityId) }) };
      }
      return { ...base, error: { code: -32602, message: `Unknown tool: ${String(name)}` } };
    } finally {
      kernel.close();
    }
  } catch (error) {
    return { ...base, error: { code: -32000, message: (error as Error).message } };
  }
}

export async function startWorkspaceMcpServer(workspace: string): Promise<void> {
  const decoder = new TextDecoder();
  let buffered = "";
  for await (const chunk of Bun.stdin.stream()) {
    buffered += decoder.decode(chunk, { stream: true });
    const lines = buffered.split("\n");
    buffered = lines.pop() ?? "";
    for (const line of lines.filter(Boolean)) {
      const response = await handleWorkspaceMcpMessage(workspace, JSON.parse(line) as McpRequest);
      process.stdout.write(`${JSON.stringify(response)}\n`);
    }
  }
}
