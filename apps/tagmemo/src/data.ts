import { checked, logosApi } from "./api-client.ts";

type Entity = {
  id: string;
  createdAt: string;
  components: { type_key: string; value: any; revision: string; updated_at: string }[];
};
type Memo = { id: string; components: Entity["components"] };
type ComponentType = { key: string; schema?: { properties?: Record<string, { type: string }> } };
export type TagState = { id: string; state: "off" | "auto" | "on"; score: number };

export async function inferTagScores(
  title: string,
  body: string,
  tags: { id: string; name: string }[],
): Promise<Record<string, number>> {
  const response = await fetch("/infer-tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body, tags }),
  });
  const result = (await response.json().catch(() => ({}))) as {
    scores?: Record<string, number>;
    error?: string;
  };
  if (!response.ok)
    throw new Error(result.error ?? `タグの推定に失敗しました (${response.status})`);
  return result.scores ?? {};
}

async function listIds(type: string, fetcher: typeof fetch): Promise<string[]> {
  const client = logosApi(fetcher);
  const ids = [];
  let after = "";
  while (true) {
    const page = await (
      await checked(
        client.entities.$get({
          query: {
            has: type,
            limit: "100",
            after,
          },
        }),
      )
    ).json();
    ids.push(...page.ids);
    if (page.ids.length < 100) return ids;
    after = page.ids.at(-1)!;
  }
}

function component(entity: { components: Entity["components"] }, key: string) {
  return entity.components.find((item) => item.type_key === key);
}

const richPrefix = "tagmemo:rich:";

export function readMemoBody(value: string): { text: string; html: string } {
  if (!value.startsWith(richPrefix)) return { text: value, html: "" };
  try {
    const body = JSON.parse(value.slice(richPrefix.length));
    if (typeof body.text === "string" && typeof body.html === "string") return body;
  } catch {}
  return { text: value, html: "" };
}

export function writeMemoBody(text: string, html: string): string {
  return richPrefix + JSON.stringify({ text, html });
}

export async function loadData(fetcher = fetch) {
  const client = logosApi(fetcher);
  const [memoIds, tagIds, typeResult] = await Promise.all([
    listIds("tagmemo.memo", fetcher),
    listIds("tagmemo.tag", fetcher),
    checked(client["component-types"].$get()).then((response) => response.json()),
  ]);
  const [memoEntities, tagEntities]: [Entity[], Entity[]] = await Promise.all([
    Promise.all(
      memoIds.map((id) =>
        checked(client.entities[":id"].$get({ param: { id } })).then((response) => response.json()),
      ),
    ),
    Promise.all(
      tagIds.map((id) =>
        checked(client.entities[":id"].$get({ param: { id } })).then((response) => response.json()),
      ),
    ),
  ]);
  const tags = tagEntities.map((entity) => ({
    id: entity.id,
    name: component(entity, "logos.name")?.value.value ?? "名称なし",
  }));
  const tagNames = new Map(tags.map((tag) => [tag.id, tag.name]));
  const notes = memoEntities.map((entity) => {
    const legacyTagIds: string[] = component(entity, "tagmemo.tags")?.value.entities ?? [];
    const savedStates: TagState[] | undefined = component(entity, "tagmemo.tag-states")?.value
      .states;
    const tagStates = (
      savedStates ?? legacyTagIds.map((id) => ({ id, state: "on", score: 1 }))
    ).filter((tag) => tagNames.has(tag.id));
    const tagIds = tagStates.filter((tag) => tag.state !== "off").map((tag) => tag.id);
    const body = readMemoBody(component(entity, "tagmemo.memo")?.value.body ?? "");
    return {
      id: entity.id,
      createdAt: entity.createdAt,
      updatedAt: entity.components.reduce(
        (latest, item) => (item.updated_at > latest ? item.updated_at : latest),
        entity.createdAt,
      ),
      title: component(entity, "logos.name")?.value.value ?? "無題",
      body: body.text,
      bodyHtml: body.html,
      tagIds,
      tagStates,
      tagLabels: tagIds.map((id) => ({ id, name: tagNames.get(id) ?? "不明なタグ" })),
      components: entity.components,
    };
  });
  return { notes, tags, types: typeResult.types };
}

async function createEntity(parts: [string, Record<string, unknown>][]): Promise<string> {
  const client = logosApi();
  const entity = await (await checked(client.entities.$post())).json();
  try {
    for (const [typeKey, value] of parts) {
      await checked(
        client.entities[":id"].components.$post({
          param: { id: entity.id },
          json: { typeKey, value },
        }),
      );
    }
    return entity.id;
  } catch (error) {
    await checked(client.entities[":id"].$delete({ param: { id: entity.id } })).catch(() => {});
    throw error;
  }
}

export async function createTag(name: string): Promise<string> {
  return createEntity([
    ["logos.name", { value: name.trim() }],
    ["tagmemo.tag", {}],
  ]);
}

export async function renameTag(tagId: string, name: string): Promise<void> {
  const client = logosApi();
  const entity: Entity = await (
    await checked(client.entities[":id"].$get({ param: { id: tagId } }))
  ).json();
  const existing = component(entity, "logos.name");
  if (!existing) throw new Error("タグ名が見つかりません");
  await checked(
    client.entities[":id"].components[":key"].$put({
      param: { id: tagId, key: "logos.name" },
      json: { value: { value: name.trim() }, revision: existing.revision },
    }),
  );
}

export async function mergeOrDeleteTag(
  notes: {
    id: string;
    title: string;
    body: string;
    bodyHtml: string;
    tagStates: TagState[];
    components: Entity["components"];
  }[],
  sourceId: string,
  targetId: string | null,
): Promise<void> {
  for (const note of notes) {
    const source = note.tagStates.find((tag) => tag.id === sourceId);
    if (!source) continue;
    const states = note.tagStates.filter((tag) => tag.id !== sourceId).map((tag) => ({ ...tag }));
    if (targetId) {
      const target = states.find((tag) => tag.id === targetId);
      if (!target) states.push({ ...source, id: targetId });
      else if (source.state === "on" && target.state !== "on") {
        target.state = "on";
        target.score = 1;
      }
    }
    const ids = states.filter((tag) => tag.state !== "off").map((tag) => tag.id);
    await saveMemo(note, note.title, writeMemoBody(note.body, note.bodyHtml), ids, states);
  }
  await deleteMemo(sourceId);
}

export async function saveMemo(
  note: Memo | null,
  title: string,
  body: string,
  tagIds: string[],
  tagStates: TagState[] = tagIds.map((id) => ({ id, state: "on", score: 1 })),
): Promise<string> {
  const client = logosApi();
  const name = { value: title.trim() };
  const memo = { body };
  const tags = { entities: tagIds };
  const states = { entities: tagStates.map((tag) => tag.id), states: tagStates };
  if (!note) {
    return createEntity([
      ["logos.name", name],
      ["tagmemo.memo", memo],
      ["tagmemo.tags", tags],
      ["tagmemo.tag-states", states],
    ]);
  }
  const parts: [string, Record<string, unknown>][] = [
    ["logos.name", name],
    ["tagmemo.memo", memo],
    ["tagmemo.tags", tags],
    ["tagmemo.tag-states", states],
  ];
  for (const [typeKey, value] of parts) {
    const existing = component(note, typeKey);
    if (existing) {
      await checked(
        client.entities[":id"].components[":key"].$put({
          param: { id: note.id, key: typeKey },
          json: { value, revision: existing.revision },
        }),
      );
    } else {
      await checked(
        client.entities[":id"].components.$post({
          param: { id: note.id },
          json: { typeKey, value },
        }),
      );
    }
  }
  return note.id;
}

export async function deleteMemo(id: string): Promise<void> {
  await checked(logosApi().entities[":id"].$delete({ param: { id } }));
}

export function editableExtras(note: Memo | null, types: ComponentType[]) {
  if (!note) return [];
  return note.components.flatMap((item) => {
    if (item.type_key === "logos.name" || item.type_key.startsWith("tagmemo.")) return [];
    const schema = types.find((type) => type.key === item.type_key)?.schema;
    const fields = Object.entries(schema?.properties ?? {}).map(([name, field]) => ({
      name,
      type: (field as { type: string }).type,
    }));
    if (
      !fields.length ||
      fields.some((field) => !["string", "number", "integer", "boolean"].includes(field.type))
    )
      return [];
    return [{ ...item, fields }];
  });
}

export async function updateExtra(
  noteId: string,
  extra: Entity["components"][number],
  value: Record<string, unknown>,
): Promise<void> {
  await checked(
    logosApi().entities[":id"].components[":key"].$put({
      param: { id: noteId, key: extra.type_key },
      json: { revision: extra.revision, value },
    }),
  );
}
