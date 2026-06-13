import { api } from "$lib/server/api";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const res = await api.api.rotax.tasks.$get();
  const tasks = await res.json();
  return { tasks };
};
