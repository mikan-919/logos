import { LogosKernel, ValidationError } from "./kernel";
import { RELATION_TYPES, type RelationType } from "./types";

interface McpRequest {
  jsonrpc: "2.0";
  id?: string | number;
  method: string;
  params?: Record<string, any>;
}

const tools = [
  {
    name: "logos_context_get",
    description: "Get bounded semantic context for the active work and record its delivery.",
    inputSchema: {
      type: "object",
      properties: { operation: { type: "string", description: "The operation the agent intends to perform." } },
      additionalProperties: false,
    },
  },
  {
    name: "logos_explain",
    description: "Explain a canonical relation or unresolved hypothesis with its provenance.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "logos_relation_propose",
    description: "Propose a relation as a hypothesis. This never creates a canonical fact.",
    inputSchema: {
      type: "object",
      properties: {
        fromEntityId: { type: "string" },
        toEntityId: { type: "string" },
        relationType: { type: "string", enum: RELATION_TYPES },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        reason: { type: "string" },
      },
      required: ["fromEntityId", "toEntityId", "relationType", "confidence", "reason"],
      additionalProperties: false,
    },
  },
];

const textResult = (value: unknown) => ({ content: [{ type: "text", text: JSON.stringify(value) }] });

export async function handleMcpMessage(workspace: string, request: McpRequest): Promise<any> {
  const base = { jsonrpc: "2.0" as const, id: request.id ?? null };
  try {
    if (request.method === "initialize") {
      return {
        ...base,
        result: {
          protocolVersion: "2025-06-18",
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "logos", version: "0.1.0" },
        },
      };
    }
    if (request.method === "notifications/initialized") return { ...base, result: {} };
    if (request.method === "tools/list") return { ...base, result: { tools } };
    if (request.method !== "tools/call") {
      return { ...base, error: { code: -32601, message: `Method not found: ${request.method}` } };
    }
    const kernel = await LogosKernel.open(workspace);
    const name = request.params?.name as string;
    const args = (request.params?.arguments ?? {}) as Record<string, any>;
    if (name === "logos_context_get") {
      return { ...base, result: textResult(await kernel.deliverAgentContext("mcp", args.operation)) };
    }
    if (name === "logos_explain") {
      const target = String(args.id ?? "");
      return { ...base, result: textResult(kernel.explain(target)) };
    }
    if (name === "logos_relation_propose") {
      const relationType = args.relationType as RelationType;
      if (!RELATION_TYPES.includes(relationType)) throw new ValidationError(`Unsupported relation type: ${relationType}`);
      const evidence = await kernel.recordEvidence({
        kind: "agent",
        description: String(args.reason ?? ""),
        source: "mcp:logos_relation_propose",
        resolver: "agent-proposal/v1",
      });
      const hypothesis = await kernel.proposeRelation({
        fromEntityId: String(args.fromEntityId),
        toEntityId: String(args.toEntityId),
        relationType,
        confidence: Number(args.confidence),
        evidenceIds: [evidence.id],
        resolver: "agent-proposal/v1",
      });
      return { ...base, result: textResult(hypothesis) };
    }
    return { ...base, error: { code: -32602, message: `Unknown tool: ${name}` } };
  } catch (error) {
    return { ...base, error: { code: -32000, message: (error as Error).message } };
  }
}

export async function startMcpServer(workspace: string): Promise<void> {
  const decoder = new TextDecoder();
  let buffered = "";
  for await (const chunk of Bun.stdin.stream()) {
    buffered += decoder.decode(chunk, { stream: true });
    const lines = buffered.split("\n");
    buffered = lines.pop() ?? "";
    for (const line of lines.filter(Boolean)) {
      const response = await handleMcpMessage(workspace, JSON.parse(line) as McpRequest);
      process.stdout.write(`${JSON.stringify(response)}\n`);
    }
  }
}
