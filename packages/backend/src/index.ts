import type { Database, JsonObject, PermissionKey } from "@logos/db";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { sql, type Kysely } from "kysely";
import {
  body,
  entityResponse,
  invalid,
  isObject,
  key,
  lockEntity,
  lockReferences,
  permission,
  requirePermission,
  revision,
  serializeComponent,
  serializeType,
  schemaValidator,
  uuid,
  validateValue,
} from "./utils.ts";

export interface Identity {
  userId: string;
  appId: string;
}

export interface LogosApiOptions {
  db: Kysely<Database>;
  authenticate: (request: Request) => Identity | null | Promise<Identity | null>;
}

const componentTypeInput = validator("json", (value) => {
  if (!isObject(value)) invalid("JSON のオブジェクトが必要です");
  const typeKey = key(value.key);
  if (!isObject(value.schema) || value.schema.type !== "object")
    invalid("schema のルートは object 型にしてください");
  return {
    key: typeKey,
    schema: value.schema,
    ownerApp: typeof value.ownerApp === "string" ? value.ownerApp : undefined,
  };
});

const componentInput = validator("json", (value) => {
  if (!isObject(value)) invalid("JSON のオブジェクトが必要です");
  const typeKey = key(value.typeKey);
  if (!isObject(value.value)) invalid("value はオブジェクトにしてください");
  return { typeKey, value: value.value };
});

const componentUpdate = validator("json", (value) => {
  if (!isObject(value)) invalid("JSON のオブジェクトが必要です");
  if (!isObject(value.value)) invalid("value はオブジェクトにしてください");
  revision(value.revision);
  return { value: value.value, revision: value.revision as string };
});

const entityQuery = validator("query", (value) => ({
  has: value.has,
  limit: value.limit,
  after: value.after,
}));

const revisionQuery = validator("query", (value) => ({ revision: value.revision }));

export function createLogosApi({ db, authenticate }: LogosApiOptions) {
  const app = new Hono<{ Variables: { identity: Identity } }>();

  app.onError((error, c) => {
    if (error instanceof HTTPException) return c.json({ error: error.message }, error.status);
    console.error(error);
    return c.json({ error: "内部エラー" }, 500);
  });

  app.use("*", async (c, next) => {
    const identity = await authenticate(c.req.raw);
    if (!identity) throw new HTTPException(401, { message: "認証が必要です" });
    uuid(identity.userId);
    if (!identity.appId) invalid("アプリ ID が不正です");
    c.set("identity", identity);
    await next();
  });

  const routes = app
    .post("/entities", async (c) => {
      const { userId } = c.get("identity");
      const id = crypto.randomUUID();
      await db.transaction().execute(async (tx) => {
        await tx
          .insertInto("users")
          .values({ id: userId })
          .onConflict((oc) => oc.doNothing())
          .execute();
        await tx
          .insertInto("entities")
          .values({ id, created_at: sql`CURRENT_TIMESTAMP` })
          .execute();
        await tx
          .insertInto("entity_permissions")
          .values(
            (["read", "write", "manage"] as const).map((permissionKey) => ({
              entity_id: id,
              user_id: userId,
              permission_key: permissionKey,
            })),
          )
          .execute();
      });
      return c.json(await entityResponse(db, id), 201);
    })

    .get("/entities", entityQuery, async (c) => {
      const { userId } = c.get("identity");
      const has = c.req.query("has");
      const types = has ? [...new Set(has.split(",").map(key))] : [];
      if (types.length > 20) invalid("has は20種類までです");
      const limitValue = c.req.query("limit") ?? "100";
      const limit = Number(limitValue);
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) invalid("limit は1から100です");
      const after = c.req.query("after");
      if (after) uuid(after);

      let query = db
        .selectFrom("entities as e")
        .innerJoin("entity_permissions as p", "p.entity_id", "e.id")
        .where("p.user_id", "=", userId)
        .where("p.permission_key", "=", "read");
      if (after) query = query.where("e.id", ">", after);
      for (const typeKey of types) {
        query = query.where((eb) =>
          eb.exists(
            eb
              .selectFrom("components as component")
              .select("component.entity_id")
              .whereRef("component.entity_id", "=", "e.id")
              .where("component.type_key", "=", typeKey),
          ),
        );
      }
      const entities = await query.select("e.id").orderBy("e.id").limit(limit).execute();
      return c.json({ ids: entities.map(({ id }) => id) });
    })

    .get("/entities/:id", async (c) => {
      const id = uuid(c.req.param("id"));
      await requirePermission(db, id, c.get("identity").userId, "read");
      return c.json(await entityResponse(db, id));
    })

    .delete("/entities/:id", async (c) => {
      const id = uuid(c.req.param("id"));
      const { userId } = c.get("identity");
      await db.transaction().execute(async (tx) => {
        const entity = await tx
          .selectFrom("entities")
          .select("id")
          .where("id", "=", id)
          .executeTakeFirst();
        if (!entity) throw new HTTPException(404, { message: "Entity が見つかりません" });
        await requirePermission(tx, id, userId, "manage");
        const reference = await tx
          .selectFrom("components")
          .select("entity_id")
          .where("entity_id", "!=", id)
          .where(
            sql<boolean>`EXISTS (SELECT 1 FROM json_each(${sql.ref("components.value")}, '$.entities') AS ref WHERE ref.value = ${id})`,
          )
          .executeTakeFirst();
        if (reference)
          throw new HTTPException(409, { message: "他の Entity から参照されています" });
        await tx.deleteFrom("entities").where("id", "=", id).execute();
      });
      return c.body(null, 204);
    })

    .get("/component-types", async (c) => {
      const types = await db.selectFrom("component_types").selectAll().orderBy("key").execute();
      return c.json({ types: types.map(serializeType) });
    })

    .post("/component-types", componentTypeInput, async (c) => {
      const input = c.req.valid("json");
      const typeKey = key(input.key);
      const ownerApp =
        typeof input.ownerApp === "string" ? input.ownerApp : c.get("identity").appId;
      if (!ownerApp || ownerApp.length > 200) invalid("アプリ ID が不正です");
      if (!isObject(input.schema) || input.schema.type !== "object") {
        invalid("schema のルートは object 型にしてください");
      }
      schemaValidator(input.schema);
      const inserted = await db
        .insertInto("component_types")
        .values({ key: typeKey, owner_app: ownerApp, schema: JSON.stringify(input.schema) })
        .onConflict((oc) => oc.column("key").doNothing())
        .returningAll()
        .executeTakeFirst();
      if (!inserted) throw new HTTPException(409, { message: "Component 型は登録済みです" });
      return c.json(serializeType(inserted), 201);
    })

    .get("/component-types/:key", async (c) => {
      const type = await db
        .selectFrom("component_types")
        .selectAll()
        .where("key", "=", key(c.req.param("key")))
        .executeTakeFirst();
      if (!type) throw new HTTPException(404, { message: "Component 型が見つかりません" });
      return c.json(serializeType(type));
    })

    .post("/entities/:id/components", componentInput, async (c) => {
      const id = uuid(c.req.param("id"));
      const { userId } = c.get("identity");
      const input = c.req.valid("json");
      const typeKey = key(input.typeKey);
      if (!isObject(input.value)) invalid("value はオブジェクトにしてください");
      const component = await db.transaction().execute(async (tx) => {
        await lockEntity(tx, id);
        await requirePermission(tx, id, userId, "write");
        await validateValue(tx, typeKey, input.value as JsonObject);
        await lockReferences(tx, userId, input.value as JsonObject);
        return tx
          .insertInto("components")
          .values({
            entity_id: id,
            type_key: typeKey,
            value: JSON.stringify(input.value),
            revision: 1,
            updated_at: sql`CURRENT_TIMESTAMP`,
          })
          .onConflict((oc) => oc.columns(["entity_id", "type_key"]).doNothing())
          .returningAll()
          .executeTakeFirst();
      });
      if (!component) throw new HTTPException(409, { message: "Component は追加済みです" });
      return c.json(serializeComponent(component), 201);
    })

    .get("/entities/:id/components/:key", async (c) => {
      const id = uuid(c.req.param("id"));
      await requirePermission(db, id, c.get("identity").userId, "read");
      const component = await db
        .selectFrom("components")
        .selectAll()
        .where("entity_id", "=", id)
        .where("type_key", "=", key(c.req.param("key")))
        .executeTakeFirst();
      if (!component) throw new HTTPException(404, { message: "Component が見つかりません" });
      return c.json(serializeComponent(component));
    })

    .put("/entities/:id/components/:key", componentUpdate, async (c) => {
      const id = uuid(c.req.param("id"));
      const typeKey = key(c.req.param("key"));
      const { userId } = c.get("identity");
      const input = c.req.valid("json");
      if (!isObject(input.value)) invalid("value はオブジェクトにしてください");
      const expectedRevision = revision(input.revision);
      const component = await db.transaction().execute(async (tx) => {
        await lockEntity(tx, id);
        await requirePermission(tx, id, userId, "write");
        await validateValue(tx, typeKey, input.value as JsonObject);
        await lockReferences(tx, userId, input.value as JsonObject);
        return tx
          .updateTable("components")
          .set({
            value: JSON.stringify(input.value),
            revision: sql`revision + 1`,
            updated_at: sql`CURRENT_TIMESTAMP`,
          })
          .where("entity_id", "=", id)
          .where("type_key", "=", typeKey)
          .where("revision", "=", expectedRevision)
          .returningAll()
          .executeTakeFirst();
      });
      if (!component) throw new HTTPException(409, { message: "Component の版が一致しません" });
      return c.json(serializeComponent(component));
    })

    .delete("/entities/:id/components/:key", revisionQuery, async (c) => {
      const id = uuid(c.req.param("id"));
      const typeKey = key(c.req.param("key"));
      const expectedRevision = revision(c.req.query("revision"));
      const deleted = await db.transaction().execute(async (tx) => {
        await lockEntity(tx, id);
        await requirePermission(tx, id, c.get("identity").userId, "write");
        return tx
          .deleteFrom("components")
          .where("entity_id", "=", id)
          .where("type_key", "=", typeKey)
          .where("revision", "=", expectedRevision)
          .returning("type_key")
          .executeTakeFirst();
      });
      if (!deleted) throw new HTTPException(409, { message: "Component の版が一致しません" });
      return c.body(null, 204);
    })

    .get("/entities/:id/permissions", async (c) => {
      const id = uuid(c.req.param("id"));
      await requirePermission(db, id, c.get("identity").userId, "manage");
      const permissions = await db
        .selectFrom("entity_permissions")
        .select(["user_id", "permission_key"])
        .where("entity_id", "=", id)
        .orderBy("user_id")
        .orderBy("permission_key")
        .execute();
      return c.json({ permissions });
    })

    .post("/entities/:id/permissions", async (c) => {
      const id = uuid(c.req.param("id"));
      const input = await body(c.req.raw);
      const targetUserId = uuid(input.userId);
      const permissionKey = permission(input.permission);
      const { userId } = c.get("identity");
      await db.transaction().execute(async (tx) => {
        const entity = await tx
          .selectFrom("entities")
          .select("id")
          .where("id", "=", id)
          .executeTakeFirst();
        if (!entity) throw new HTTPException(404, { message: "Entity が見つかりません" });
        await requirePermission(tx, id, userId, "manage");
        await tx
          .insertInto("users")
          .values({ id: targetUserId })
          .onConflict((oc) => oc.doNothing())
          .execute();
        const keys: PermissionKey[] = permissionKey === "read" ? ["read"] : ["read", permissionKey];
        await tx
          .insertInto("entity_permissions")
          .values(
            keys.map((entry) => ({ entity_id: id, user_id: targetUserId, permission_key: entry })),
          )
          .onConflict((oc) => oc.doNothing())
          .execute();
      });
      return c.body(null, 204);
    })

    .delete("/entities/:id/permissions/:userId/:permission", async (c) => {
      const id = uuid(c.req.param("id"));
      const targetUserId = uuid(c.req.param("userId"));
      const permissionKey = permission(c.req.param("permission"));
      const { userId } = c.get("identity");
      await db.transaction().execute(async (tx) => {
        const entity = await tx
          .selectFrom("entities")
          .select("id")
          .where("id", "=", id)
          .executeTakeFirst();
        if (!entity) throw new HTTPException(404, { message: "Entity が見つかりません" });
        await requirePermission(tx, id, userId, "manage");
        if (permissionKey === "read") {
          const other = await tx
            .selectFrom("entity_permissions")
            .select("permission_key")
            .where("entity_id", "=", id)
            .where("user_id", "=", targetUserId)
            .where("permission_key", "in", ["write", "manage"])
            .executeTakeFirst();
          if (other) throw new HTTPException(409, { message: "編集・管理権限が残っています" });
        }
        if (permissionKey === "manage") {
          const managers = await tx
            .selectFrom("entity_permissions")
            .select("user_id")
            .where("entity_id", "=", id)
            .where("permission_key", "=", "manage")
            .execute();
          if (managers.length === 1 && managers[0]?.user_id === targetUserId) {
            throw new HTTPException(409, { message: "最後の管理権限は削除できません" });
          }
        }
        await tx
          .deleteFrom("entity_permissions")
          .where("entity_id", "=", id)
          .where("user_id", "=", targetUserId)
          .where("permission_key", "=", permissionKey)
          .execute();
      });
      return c.body(null, 204);
    });

  return routes;
}

export type LogosApiType = ReturnType<typeof createLogosApi>;
