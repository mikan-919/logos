import { checked, logosApi } from "./api-client.ts";
import { isDisplayedTag, updateTagScores } from "./tag-model.ts";

type Entity = {
  id: string;
  createdAt: string;
  components: { type_key: string; value: any; revision: string; updated_at: string }[];
};
type Memo = { id: string; components: Entity["components"] };
type ComponentType = { key: string; schema?: { properties?: Record<string, { type: string }> } };
export type TagScore = { id: string; score: number };

export async function inferTagScores(
  title: string,
  body: string,
  tags: { id: string; name: string }[],
): Promise<Record<string, number>> {
  const scores: Record<string, number> = {};
  for (let start = 0; start < tags.length; start += 100) {
    const batch = tags.slice(start, start + 100);
    const response = await fetch("/infer-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, tags: batch }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      scores?: Record<string, number>;
      error?: string;
    };
    if (!response.ok)
      throw new Error(result.error ?? `タグの推定に失敗しました (${response.status})`);
    for (const tag of batch) {
      const score = result.scores?.[tag.id];
      if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 1)
        throw new Error("タグの推定結果が不足しているか不正です");
      scores[tag.id] = score;
    }
  }
  return scores;
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
    const savedStates: { id: string; state: "off" | "auto" | "on"; score: number }[] | undefined =
      component(entity, "tagmemo.tag-states")?.value.states;
    const savedScores: TagScore[] | undefined = component(entity, "tagmemo.tag-scores")?.value
      .scores;
    const tagScores = updateTagScores(
      savedScores ??
        savedStates?.map((tag) => ({
          id: tag.id,
          score: tag.state === "on" ? 1 : tag.state === "off" ? 0 : tag.score,
        })) ??
        legacyTagIds.map((id) => ({ id, score: 1 })),
      tags,
    );
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
      tagScores,
      inferredText: component(entity, "tagmemo.inference")?.value.text as string | undefined,
      tagLabels: tagScores
        .filter(isDisplayedTag)
        .map((tag) => ({ id: tag.id, name: tagNames.get(tag.id)! })),
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
    tagScores: TagScore[];
    components: Entity["components"];
  }[],
  sourceId: string,
  targetId: string | null,
): Promise<void> {
  const tags = (await listIds("tagmemo.tag", fetch)).filter((id) => id !== sourceId);
  for (const note of notes) {
    const source = note.tagScores.find((tag) => tag.id === sourceId);
    const target = note.tagScores.find((tag) => tag.id === targetId);
    const scores = updateTagScores(
      note.tagScores,
      tags.map((id) => ({ id })),
      targetId ? { [targetId]: Math.max(source?.score ?? 0, target?.score ?? 0) } : {},
    );
    await writeMemo(note, note.title, writeMemoBody(note.body, note.bodyHtml), scores);
  }
  await deleteMemo(sourceId);
}

export async function saveMemo(
  note: Memo | null,
  title: string,
  body: string,
  tagScores: TagScore[],
  inferredText?: string,
): Promise<string> {
  const tags = await listIds("tagmemo.tag", fetch);
  return writeMemo(
    note,
    title,
    body,
    updateTagScores(
      tagScores,
      tags.map((id) => ({ id })),
    ),
    inferredText,
  );
}

async function writeMemo(
  note: Memo | null,
  title: string,
  body: string,
  tagScores: TagScore[],
  inferredText?: string,
): Promise<string> {
  const client = logosApi();
  const name = { value: title.trim() };
  const memo = { body };
  const scores = { entities: tagScores.map((tag) => tag.id), scores: tagScores };
  const parts: [string, Record<string, unknown>][] = [
    ["logos.name", name],
    ["tagmemo.memo", memo],
    ["tagmemo.tag-scores", scores],
  ];
  if (inferredText !== undefined) parts.push(["tagmemo.inference", { text: inferredText }]);
  if (!note) return createEntity(parts);
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
  for (const typeKey of ["tagmemo.tags", "tagmemo.tag-states"]) {
    const existing = component(note, typeKey);
    if (!existing) continue;
    await checked(
      client.entities[":id"].components[":key"].$delete({
        param: { id: note.id, key: typeKey },
        query: { revision: existing.revision },
      }),
    );
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
