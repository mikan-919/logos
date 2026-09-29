import { expect, test } from "vite-plus/test";
import worker from "../src/worker.ts";

test("MCP 要求を Logos Worker に転送する", async () => {
  const request = new Request("http://localhost:5173/mcp", { method: "POST" });
  const response = new Response("forwarded");
  const result = await worker.fetch(request, {
    LOGOS: {
      fetch(forwarded) {
        expect(forwarded).toBe(request);
        return Promise.resolve(response);
      },
    },
    ASSETS: { fetch: () => Promise.reject(new Error("ASSETS を呼びません")) },
  });
  expect(result).toBe(response);
});
