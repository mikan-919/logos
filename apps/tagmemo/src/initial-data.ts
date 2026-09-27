import { loadData } from "./data.js";

export interface InitialData {
  user: { id: string };
  notes: {
    id: string;
    title: string;
    body: string;
    tagIds: string[];
    tagLabels: { id: string; name: string }[];
    components: unknown[];
  }[];
  tags: { id: string; name: string }[];
  types: unknown[];
}

export async function loadInitialData(
  fetcher: typeof fetch,
  user: { id: string },
): Promise<InitialData> {
  const data = await loadData(fetcher);
  return { user, ...data };
}
