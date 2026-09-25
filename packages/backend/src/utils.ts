import { Ajv2020 } from "ajv/dist/2020.js";
import { fullFormats } from "ajv-formats/dist/formats.js";
import type { Database, JsonObject, PermissionKey } from "@logos/db";
import { HTTPException } from "hono/http-exception";
import type { Kysely } from "kysely";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const keyPattern = /^[a-z][a-z0-9_.-]*$/i;
export const ajv = new Ajv2020({ allErrors: true, formats: fullFormats });

export function invalid(message: string): never {
  throw new HTTPException(400, { message });
}

export function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function uuid(value: unknown): string {
  if (typeof value !== "string" || !uuidPattern.test(value)) invalid("UUID が不正です");
  return value;
}

export function key(value: unknown): string {
  if (typeof value !== "string" || value.length > 200 || !keyPattern.test(value)) {
    invalid("Component 型のキーが不正です");
  }
  return value;
}

export async function body(request: Request): Promise<JsonObject> {
  const value: unknown = await request.json().catch(() => invalid("JSON が不正です"));
  if (!isObject(value)) invalid("JSON のオブジェクトが必要です");
  return value;
}

export function refs(value: JsonObject): string[] {
  if (!("entities" in value)) return [];
  if (!Array.isArray(value.entities) || !value.entities.every((id) => typeof id === "string")) {
    throw new HTTPException(422, { message: "entities は UUID の配列にしてください" });
  }
  const ids = value.entities.map(uuid);
  if (new Set(ids).size !== ids.length) {
    throw new HTTPException(422, { message: "entities に重複があります" });
  }
  return ids.sort();
}

export function revision(value: unknown): string {
  if (typeof value !== "string" || !/^[1-9][0-9]*$/.test(value)) {
    invalid("revision は正の整数の文字列にしてください");
  }
  return value;
}

export function permission(value: unknown): PermissionKey {
  if (value !== "read" && value !== "write" && value !== "manage") {
    invalid("権限の種類が不正です");
  }
  return value;
}

export async function hasPermission(
  db: Kysely<Database>,
  entityId: string,
  userId: string,
  permissionKey: PermissionKey,
): Promise<boolean> {
  const row = await db
    .selectFrom("entity_permissions")
    .select("entity_id")
    .where("entity_id", "=", entityId)
    .where("user_id", "=", userId)
    .where("permission_key", "=", permissionKey)
    .executeTakeFirst();
  return !!row;
}

export async function requirePermission(
  db: Kysely<Database>,
  entityId: string,
  userId: string,
  permissionKey: PermissionKey,
): Promise<void> {
  if (await hasPermission(db, entityId, userId, permissionKey)) return;
  if (permissionKey !== "read" && (await hasPermission(db, entityId, userId, "read"))) {
    throw new HTTPException(403, { message: "権限がありません" });
  }
  throw new HTTPException(404, { message: "Entity が見つかりません" });
}

export async function lockEntity(db: Kysely<Database>, id: string): Promise<void> {
  const entity = await db
    .selectFrom("entities")
    .select("id")
    .where("id", "=", id)
    .forKeyShare()
    .executeTakeFirst();
  if (!entity) throw new HTTPException(404, { message: "Entity が見つかりません" });
}

export async function validateValue(
  db: Kysely<Database>,
  typeKey: string,
  value: JsonObject,
): Promise<void> {
  const type = await db
    .selectFrom("component_types")
    .select("schema")
    .where("key", "=", typeKey)
    .executeTakeFirst();
  if (!type) throw new HTTPException(404, { message: "Component 型が見つかりません" });
  const validate = ajv.compile(type.schema);
  if (!validate(value)) {
    throw new HTTPException(422, { message: ajv.errorsText(validate.errors) });
  }
}

export async function lockReferences(
  db: Kysely<Database>,
  userId: string,
  value: JsonObject,
): Promise<void> {
  for (const targetId of refs(value)) {
    const target = await db
      .selectFrom("entities")
      .select("id")
      .where("id", "=", targetId)
      .forKeyShare()
      .executeTakeFirst();
    if (!target || !(await hasPermission(db, targetId, userId, "read"))) {
      throw new HTTPException(422, { message: "参照先の Entity を利用できません" });
    }
  }
}

export async function entityResponse(db: Kysely<Database>, id: string) {
  const entity = await db
    .selectFrom("entities")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
  if (!entity) throw new HTTPException(404, { message: "Entity が見つかりません" });
  const components = await db
    .selectFrom("components")
    .select(["type_key", "value", "revision", "updated_at"])
    .where("entity_id", "=", id)
    .orderBy("type_key")
    .execute();
  return {
    id: entity.id,
    createdAt: entity.created_at,
    components: components.map(serializeComponent),
  };
}

export function serializeComponent<T extends { revision: string }>(component: T) {
  return { ...component, revision: String(component.revision) };
}
