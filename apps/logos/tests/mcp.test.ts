import { expect, test } from "vite-plus/test";
import { setup } from "./helpers.ts";

test("MCP は認証と API の権限を使って Entity を操作する", async () => {
  const { app, db, cookie, origin } = await setup();
  try {
    async function mcp(method: string, params?: object, authenticated = true) {
      const response = await app.request(`${origin}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "MCP-Protocol-Version": "2026-07-28",
          "Mcp-Method": method,
          ...(method === "tools/call" ? { "Mcp-Name": (params as { name: string }).name } : {}),
          ...(authenticated ? { Cookie: cookie } : {}),
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method,
          params: {
            ...params,
            _meta: {
              "io.modelcontextprotocol/protocolVersion": "2026-07-28",
              "io.modelcontextprotocol/clientCapabilities": {},
              "io.modelcontextprotocol/clientInfo": { name: "test", version: "1" },
            },
          },
        }),
      });
      return response;
    }

    expect((await mcp("tools/list", undefined, false)).status).toBe(401);
    expect(
      (
        await app.request(`${origin}/mcp`, {
          method: "POST",
          headers: { Cookie: cookie, Origin: "https://example.com" },
        })
      ).status,
    ).toBe(403);
    const listed = await mcp("tools/list");
    expect(listed.status, await listed.clone().text()).toBe(200);
    const tools = await listed.json();
    expect(tools.result.tools.map((tool: { name: string }) => tool.name)).toContain(
      "create_entity",
    );

    const created = await mcp("tools/call", { name: "create_entity", arguments: {} });
    expect(created.status).toBe(200);
    const entity = JSON.parse((await created.json()).result.content[0].text);
    expect(entity.id).toBeTruthy();
    const fetched = await mcp("tools/call", { name: "get_entity", arguments: { id: entity.id } });
    expect(JSON.parse((await fetched.json()).result.content[0].text).id).toBe(entity.id);

    const added = await mcp("tools/call", {
      name: "add_component",
      arguments: { entityId: entity.id, typeKey: "logos.name", value: { value: "試験" } },
    });
    const component = JSON.parse((await added.json()).result.content[0].text);
    expect(component.revision).toBe("1");
    const updated = await mcp("tools/call", {
      name: "update_component",
      arguments: {
        entityId: entity.id,
        typeKey: "logos.name",
        revision: component.revision,
        value: { value: "更新" },
      },
    });
    const changed = JSON.parse((await updated.json()).result.content[0].text);
    expect(changed.revision).toBe("2");
    const deleted = await mcp("tools/call", {
      name: "delete_component",
      arguments: { entityId: entity.id, typeKey: "logos.name", revision: changed.revision },
    });
    expect(JSON.parse((await deleted.json()).result.content[0].text)).toEqual({ ok: true });
  } finally {
    await db.destroy();
  }
});
