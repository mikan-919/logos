import { expect, test } from "vite-plus/test";
import worker from "../src/worker.ts";
import { setup } from "../../logos/tests/helpers.ts";

test("TagMemo Worker は共通 API から初回表示を作り、API 要求を転送する", async () => {
  const { db, app, cookie, origin } = await setup();
  const html = '<html><body><div id="app"></div></body></html>';
  const env = {
    ASSETS: { fetch: async () => new Response(html, { headers: { "Content-Type": "text/html" } }) },
    LOGOS: { fetch: async (request: Request) => app.request(request) },
  };
  const request = (path: string, method = "GET", data?: unknown) =>
    app.request(`${origin}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  try {
    expect((await worker.fetch(new Request(`${origin}/api/entities`), env)).status).toBe(401);
    const initial = await worker.fetch(
      new Request(`${origin}/tagmemo/`, { headers: { Cookie: cookie } }),
      env,
    );
    expect(initial.status).toBe(200);
    expect((await request("/api/component-types/tagmemo.memo")).status).toBe(200);
    const entity = await (await request("/api/entities", "POST")).json();
    await request(`/api/entities/${entity.id}/components`, "POST", {
      typeKey: "logos.name",
      value: { value: "<img src=x onerror=alert(1)>" },
    });
    await request(`/api/entities/${entity.id}/components`, "POST", {
      typeKey: "tagmemo.memo",
      value: { body: "本文" },
    });
    const page = await worker.fetch(
      new Request(`${origin}/tagmemo/`, { headers: { Cookie: cookie } }),
      env,
    );
    const rendered = await page.text();
    expect(rendered).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(rendered).toContain("\\u003cimg src=x");
    expect(rendered).toContain('<span class="count">1 件</span>');
    expect(page.headers.get("Cache-Control")).toBe("private, no-store");
    const anonymous = await worker.fetch(new Request(`${origin}/tagmemo/`), env);
    expect(await anonymous.text()).toBe(html);
  } finally {
    await db.destroy();
  }
});
