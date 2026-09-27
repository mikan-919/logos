async function api(path, method = "GET", data, fetcher = fetch) {
  if (data !== undefined && method !== "POST" && method !== "PUT") {
    throw new Error("データを送る操作は POST または PUT にしてください");
  }
  const response =
    data === undefined
      ? await fetcher(`/api${path}`, { method })
      : await fetcher(`/api${path}`, {
          method: method === "POST" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? `要求に失敗しました (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

async function listIds(type, fetcher) {
  const ids = [];
  let after = "";
  while (true) {
    const page = await api(
      `/entities?has=${type}&limit=100${after ? `&after=${after}` : ""}`,
      "GET",
      undefined,
      fetcher,
    );
    ids.push(...page.ids);
    if (page.ids.length < 100) return ids;
    after = page.ids.at(-1);
  }
}

function component(entity, key) {
  return entity.components.find((item) => item.type_key === key);
}

const richPrefix = "tagmemo:rich:";

export function readMemoBody(value) {
  if (!value.startsWith(richPrefix)) return { text: value, html: "" };
  try {
    const body = JSON.parse(value.slice(richPrefix.length));
    if (typeof body.text === "string" && typeof body.html === "string") return body;
  } catch {}
  return { text: value, html: "" };
}

export function writeMemoBody(text, html) {
  return richPrefix + JSON.stringify({ text, html });
}

export async function loadData(fetcher = fetch) {
  const [memoIds, tagIds, typeResult] = await Promise.all([
    listIds("tagmemo.memo", fetcher),
    listIds("tagmemo.tag", fetcher),
    api("/component-types", "GET", undefined, fetcher),
  ]);
  const [memoEntities, tagEntities] = await Promise.all([
    Promise.all(memoIds.map((id) => api(`/entities/${id}`, "GET", undefined, fetcher))),
    Promise.all(tagIds.map((id) => api(`/entities/${id}`, "GET", undefined, fetcher))),
  ]);
  const tags = tagEntities.map((entity) => ({
    id: entity.id,
    name: component(entity, "logos.name")?.value.value ?? "名称なし",
  }));
  const tagNames = new Map(tags.map((tag) => [tag.id, tag.name]));
  const notes = memoEntities.map((entity) => {
    const tagIds = component(entity, "tagmemo.tags")?.value.entities ?? [];
    const body = readMemoBody(component(entity, "tagmemo.memo")?.value.body ?? "");
    return {
      id: entity.id,
      title: component(entity, "logos.name")?.value.value ?? "無題",
      body: body.text,
      bodyHtml: body.html,
      tagIds,
      tagLabels: tagIds.map((id) => ({ id, name: tagNames.get(id) ?? "不明なタグ" })),
      components: entity.components,
    };
  });
  return { notes, tags, types: typeResult.types };
}

async function createEntity(parts) {
  const entity = await api("/entities", "POST");
  try {
    for (const [typeKey, value] of parts) {
      await api(`/entities/${entity.id}/components`, "POST", { typeKey, value });
    }
    return entity.id;
  } catch (error) {
    await api(`/entities/${entity.id}`, "DELETE").catch(() => {});
    throw error;
  }
}

export async function createTag(name) {
  return createEntity([
    ["logos.name", { value: name.trim() }],
    ["tagmemo.tag", {}],
  ]);
}

export async function saveMemo(note, title, body, tagIds) {
  const name = { value: title.trim() };
  const memo = { body };
  const tags = { entities: tagIds };
  if (!note) {
    return createEntity([
      ["logos.name", name],
      ["tagmemo.memo", memo],
      ["tagmemo.tags", tags],
    ]);
  }
  /** @type {[string, Record<string, unknown>][]} */
  const parts = [
    ["logos.name", name],
    ["tagmemo.memo", memo],
    ["tagmemo.tags", tags],
  ];
  for (const [typeKey, value] of parts) {
    const existing = component(note, typeKey);
    if (existing) {
      await api(`/entities/${note.id}/components/${typeKey}`, "PUT", {
        value,
        revision: existing.revision,
      });
    } else {
      await api(`/entities/${note.id}/components`, "POST", { typeKey, value });
    }
  }
  return note.id;
}

export async function deleteMemo(id) {
  await api(`/entities/${id}`, "DELETE");
}

export function editableExtras(note, types) {
  if (!note) return [];
  return note.components.flatMap((item) => {
    if (item.type_key === "logos.name" || item.type_key.startsWith("tagmemo.")) return [];
    const schema = types.find((type) => type.key === item.type_key)?.schema;
    const fields = Object.entries(schema?.properties ?? {}).map(([name, field]) => ({
      name,
      type: field.type,
    }));
    if (
      !fields.length ||
      fields.some((field) => !["string", "number", "integer", "boolean"].includes(field.type))
    )
      return [];
    return [{ ...item, fields }];
  });
}

export async function updateExtra(noteId, extra, value) {
  await api(`/entities/${noteId}/components/${extra.type_key}`, "PUT", {
    revision: extra.revision,
    value,
  });
}
