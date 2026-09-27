import type { Database, JsonObject } from "@logos/db";
import type { Kysely } from "kysely";

interface Component {
  type_key: string;
  value: JsonObject;
  revision: string;
  updated_at: string;
}

export interface InitialData {
  user: { id: string };
  notes: {
    id: string;
    title: string;
    body: string;
    tagIds: string[];
    tagLabels: { id: string; name: string }[];
    components: Component[];
  }[];
  tags: { id: string; name: string }[];
  types: { key: string; owner_app: string; schema: JsonObject }[];
}

function component(components: Component[], key: string) {
  return components.find((item) => item.type_key === key);
}

export async function loadInitialData(db: Kysely<Database>, userId: string): Promise<InitialData> {
  const [entities, typeRows] = await Promise.all([
    db
      .selectFrom("entities as e")
      .innerJoin("entity_permissions as p", "p.entity_id", "e.id")
      .select("e.id")
      .where("p.user_id", "=", userId)
      .where("p.permission_key", "=", "read")
      .orderBy("e.id")
      .execute(),
    db.selectFrom("component_types").selectAll().orderBy("key").execute(),
  ]);
  const ids = entities.map((entity) => entity.id);
  const rows = ids.length
    ? await db.selectFrom("components").selectAll().where("entity_id", "in", ids).execute()
    : [];
  const grouped = new Map<string, Component[]>();
  for (const row of rows) {
    const components = grouped.get(row.entity_id) ?? [];
    components.push({
      type_key: row.type_key,
      value: JSON.parse(row.value) as JsonObject,
      revision: String(row.revision),
      updated_at: row.updated_at,
    });
    grouped.set(row.entity_id, components);
  }
  const tags = ids.flatMap((id) => {
    const components = grouped.get(id) ?? [];
    if (!component(components, "tagmemo.tag")) return [];
    const value = component(components, "logos.name")?.value.value;
    return [{ id, name: typeof value === "string" ? value : "名称なし" }];
  });
  const tagNames = new Map(tags.map((tag) => [tag.id, tag.name]));
  const notes = ids.flatMap((id) => {
    const components = grouped.get(id) ?? [];
    const memo = component(components, "tagmemo.memo");
    if (!memo) return [];
    const name = component(components, "logos.name")?.value.value;
    const body = memo.value.body;
    const references = component(components, "tagmemo.tags")?.value.entities;
    const tagIds = Array.isArray(references)
      ? references.filter((value): value is string => typeof value === "string")
      : [];
    return [
      {
        id,
        title: typeof name === "string" ? name : "無題",
        body: typeof body === "string" ? body : "",
        tagIds,
        tagLabels: tagIds.map((tagId) => ({
          id: tagId,
          name: tagNames.get(tagId) ?? "不明なタグ",
        })),
        components,
      },
    ];
  });
  const types = typeRows.map((type) => ({
    key: type.key,
    owner_app: type.owner_app,
    schema: JSON.parse(type.schema) as JsonObject,
  }));
  return { user: { id: userId }, notes, tags, types };
}
