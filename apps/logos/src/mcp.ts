import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import type { createLogosApi } from "@logos/backend";
import { z } from "zod/v4";

const id = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
const typeKey = z
  .string()
  .max(200)
  .regex(/^[a-z][a-z0-9_.-]*$/i);
const value = z.record(z.string(), z.unknown());

export function createLogosMcp(api: ReturnType<typeof createLogosApi>) {
  return createMcpHandler(() => {
    const server = new McpServer({ name: "logos", version: "0.0.0" });

    async function call(method: string, path: string, data?: unknown) {
      const response = await api.request(`http://logos${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: data === undefined ? undefined : JSON.stringify(data),
      });
      const result = response.status === 204 ? { ok: true } : await response.json();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result) }],
        isError: !response.ok,
      };
    }

    server.registerTool(
      "list_entities",
      {
        description:
          "閲覧できる Entity の ID を一覧表示する。has で必要な Component 型を指定できる。",
        inputSchema: z.object({
          has: z.array(typeKey).max(20).optional(),
          limit: z.number().int().min(1).max(100).optional(),
          after: id.optional(),
        }),
        annotations: { readOnlyHint: true },
      },
      async ({ has, limit, after }) => {
        const query = new URLSearchParams();
        if (has?.length) query.set("has", has.join(","));
        if (limit !== undefined) query.set("limit", String(limit));
        if (after) query.set("after", after);
        return call("GET", `/entities?${query}`);
      },
    );

    server.registerTool(
      "get_entity",
      {
        description: "Entity とその Component を取得する。",
        inputSchema: z.object({ id }),
        annotations: { readOnlyHint: true },
      },
      ({ id }) => call("GET", `/entities/${id}`),
    );

    server.registerTool(
      "create_entity",
      {
        description: "Entity を作成する。作成者に閲覧・編集・管理権限が付く。",
        inputSchema: z.object({}),
      },
      () => call("POST", "/entities"),
    );

    server.registerTool(
      "delete_entity",
      {
        description: "Entity を削除する。管理権限が必要。参照されている Entity は削除できない。",
        inputSchema: z.object({ id }),
        annotations: { destructiveHint: true },
      },
      ({ id }) => call("DELETE", `/entities/${id}`),
    );

    server.registerTool(
      "list_component_types",
      {
        description: "登録済み Component 型と JSON Schema を一覧表示する。",
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true },
      },
      () => call("GET", "/component-types"),
    );

    server.registerTool(
      "register_component_type",
      {
        description: "Component 型を JSON Schema で登録する。キーは登録後に変更できない。",
        inputSchema: z.object({ key: typeKey, schema: value }),
      },
      ({ key, schema }) => call("POST", "/component-types", { key, schema }),
    );

    server.registerTool(
      "add_component",
      {
        description: "Entity に Component を追加する。値は型の JSON Schema に従う。",
        inputSchema: z.object({ entityId: id, typeKey, value }),
      },
      ({ entityId, typeKey, value }) =>
        call("POST", `/entities/${entityId}/components`, { typeKey, value }),
    );

    server.registerTool(
      "update_component",
      {
        description: "Component を更新する。取得時の revision を渡す。",
        inputSchema: z.object({
          entityId: id,
          typeKey,
          revision: z.string().regex(/^[1-9][0-9]*$/),
          value,
        }),
      },
      ({ entityId, typeKey, revision, value }) =>
        call("PUT", `/entities/${entityId}/components/${encodeURIComponent(typeKey)}`, {
          revision,
          value,
        }),
    );

    server.registerTool(
      "delete_component",
      {
        description: "Component を削除する。取得時の revision を渡す。",
        inputSchema: z.object({
          entityId: id,
          typeKey,
          revision: z.string().regex(/^[1-9][0-9]*$/),
        }),
        annotations: { destructiveHint: true },
      },
      ({ entityId, typeKey, revision }) =>
        call(
          "DELETE",
          `/entities/${entityId}/components/${encodeURIComponent(typeKey)}?revision=${encodeURIComponent(revision)}`,
        ),
    );

    return server;
  });
}
