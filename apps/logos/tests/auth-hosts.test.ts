import { expect, test } from "vite-plus/test";
import { connectDatabase } from "@logos/db";
import { createLogosApp } from "../src/app.ts";
import { createAuth } from "../src/auth.ts";
import { migrate } from "../src/migrate.ts";

test("共通の認証を別アプリのホストから利用できる", async () => {
  const db = await connectDatabase("file::memory:");
  try {
    const auth = createAuth(
      db,
      "http://localhost:5173",
      "test-secret-at-least-thirty-two-characters",
      ["otherapp.example.com"],
    );
    await migrate(db, auth);
    const app = createLogosApp(db, auth);
    const origin = "https://otherapp.example.com";
    const signup = await app.request(`${origin}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({
        name: "別アプリ",
        email: "other@example.com",
        password: "password1234",
      }),
    });
    expect(signup.status).toBe(200);
    const cookie = signup.headers.get("set-cookie")?.split(";")[0];
    expect(cookie).toBeTruthy();
    const session = await app.request(`${origin}/api/auth/get-session`, {
      headers: { Cookie: cookie ?? "" },
    });
    expect((await session.json()).user.email).toBe("other@example.com");
  } finally {
    await db.destroy();
  }
});
