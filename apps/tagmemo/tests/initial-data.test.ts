import { expect, test } from "vite-plus/test";
import { loadInitialData } from "../src/initial-data.ts";
import { renderInitialHtml } from "../src/render-initial.ts";
import { setup } from "./helpers.ts";

test("初回 HTML に閲覧可能なメモを埋め込み、内容をエスケープする", async () => {
  const { db, app, cookie, origin } = await setup();
  try {
    const request = (path: string, method = "GET", data?: unknown) =>
      app.request(`${origin}${path}`, {
        method,
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: data === undefined ? undefined : JSON.stringify(data),
      });
    const session = await (await request("/api/auth/get-session")).json();
    const entity = await (await request("/api/entities", "POST")).json();
    await request(`/api/entities/${entity.id}/components`, "POST", {
      typeKey: "logos.name",
      value: { value: "<img src=x onerror=alert(1)>" },
    });
    await request(`/api/entities/${entity.id}/components`, "POST", {
      typeKey: "tagmemo.memo",
      value: { body: "本文" },
    });
    const data = await loadInitialData(db, session.user.id);
    expect(data.notes).toMatchObject([{ id: entity.id, body: "本文" }]);
    expect((await loadInitialData(db, "00000000-0000-4000-8000-000000000002")).notes).toEqual([]);
    const html = renderInitialHtml('<html><body><div id="app"></div></body></html>', data);
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).toContain("\\u003cimg src=x");
    expect(html).toContain('<span class="count">1 件</span>');
    expect(html).not.toContain("<img src=x");
  } finally {
    await db.destroy();
  }
});
