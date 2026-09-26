import { expect, test } from "vite-plus/test";
import { setup } from "./helpers.ts";

test("TagMemo の API は Entity にメモとタグを保存する", async () => {
  const { db, app, cookie, origin } = await setup();
  try {
    const request = (path: string, method = "GET", data?: unknown) =>
      app.request(`${origin}${path}`, {
        method,
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: data === undefined ? undefined : JSON.stringify(data),
      });
    expect((await app.request(`${origin}/api/entities`)).status).toBe(401);
    for (const [key, schema] of [
      [
        "logos.name",
        { type: "object", properties: { value: { type: "string" } }, required: ["value"] },
      ],
      [
        "tagmemo.memo",
        { type: "object", properties: { body: { type: "string" } }, required: ["body"] },
      ],
    ] as const) {
      expect((await request("/api/component-types", "POST", { key, schema })).status).toBe(201);
    }
    const entity = await (await request("/api/entities", "POST")).json();
    expect(
      (
        await request(`/api/entities/${entity.id}/components`, "POST", {
          typeKey: "logos.name",
          value: { value: "設計メモ" },
        })
      ).status,
    ).toBe(201);
    expect(
      (
        await request(`/api/entities/${entity.id}/components`, "POST", {
          typeKey: "tagmemo.memo",
          value: { body: "本文" },
        })
      ).status,
    ).toBe(201);
    expect((await (await request("/api/entities?has=tagmemo.memo")).json()).ids).toEqual([
      entity.id,
    ]);
    const stored = await (await request(`/api/entities/${entity.id}`)).json();
    expect(stored.components.map((item: { type_key: string }) => item.type_key)).toEqual([
      "logos.name",
      "tagmemo.memo",
    ]);
    const signedOut = await app.request(`${origin}/api/auth/sign-out`, {
      method: "POST",
      headers: { Cookie: cookie, Origin: origin },
    });
    expect(signedOut.status).toBe(200);
    expect((await request(`/api/entities/${entity.id}`)).status).toBe(401);
    const signedIn = await app.request(`${origin}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ email: "test@example.com", password: "password1234" }),
    });
    expect(signedIn.status).toBe(200);
    const newCookie = signedIn.headers.get("set-cookie")?.split(";")[0];
    expect(newCookie).toBeTruthy();
    expect(
      (
        await app.request(`${origin}/api/entities/${entity.id}`, {
          headers: { Cookie: newCookie ?? "" },
        })
      ).status,
    ).toBe(200);
  } finally {
    await db.destroy();
  }
});
