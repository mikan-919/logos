import { componentTypes } from "./component-types.ts";

export async function registerComponentTypes(fetcher: typeof fetch) {
  for (const type of componentTypes) {
    const existing = await fetcher(`/api/component-types/${type.key}`);
    if (existing.ok) continue;
    if (existing.status !== 404) throw new Error(`Component 型を確認できません: ${type.key}`);
    const created = await fetcher("/api/component-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(type),
    });
    if (created.status !== 201 && created.status !== 409) {
      throw new Error(`Component 型を登録できません: ${type.key}`);
    }
  }
}
