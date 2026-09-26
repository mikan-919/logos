import { expect, test } from "vite-plus/test";
import { sql, type Kysely } from "kysely";
import { connectDatabase } from "../src/connect.ts";
import { down, up } from "../src/migrations/20260926_initial.ts";

test("SQLite 移行と参照の整合性", async () => {
  const db = await connectDatabase("file::memory:");
  try {
    await up(db as unknown as Kysely<unknown>);
    expect(
      (await db.selectFrom("permission_types").selectAll().execute()).map((row) => row.key),
    ).toEqual(["read", "write", "manage"]);
    await db
      .insertInto("entities")
      .values([{ id: "source" }, { id: "target" }])
      .execute();
    await db
      .insertInto("component_types")
      .values({ key: "ref", owner_app: "test", schema: "{}" })
      .execute();
    await db
      .insertInto("components")
      .values({ entity_id: "source", type_key: "ref", value: '{"entities":["target"]}' })
      .execute();
    await expect(db.deleteFrom("entities").where("id", "=", "target").execute()).rejects.toThrow();
    await expect(
      db.updateTable("components").set({ value: '{"entities":["missing"]}' }).execute(),
    ).rejects.toThrow();
    expect(
      (
        await sql<{
          value: string;
        }>`SELECT value FROM components WHERE entity_id = 'source'`.execute(db)
      ).rows[0]?.value,
    ).toBe('{"entities":["target"]}');
    await down(db as unknown as Kysely<unknown>);
  } finally {
    await db.destroy();
  }
});
