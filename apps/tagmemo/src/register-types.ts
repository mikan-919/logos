import { componentTypes } from "./component-types.ts";
import { logosApi } from "./api-client.ts";

export async function registerComponentTypes(fetcher: typeof fetch) {
  const client = logosApi(fetcher);
  for (const type of componentTypes) {
    const existing = await client["component-types"][":key"].$get({ param: { key: type.key } });
    if (existing.ok) continue;
    if (existing.status !== 404) throw new Error(`Component 型を確認できません: ${type.key}`);
    const created = await client["component-types"].$post({ json: type });
    if (created.status !== 201 && created.status !== 409) {
      throw new Error(`Component 型を登録できません: ${type.key}`);
    }
  }
}
