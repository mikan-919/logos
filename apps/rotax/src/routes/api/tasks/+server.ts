import { api } from "$lib/server/api";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  const res = await api.api.rotax.tasks.$get();
  const tasks = await res.json();
  return new Response(JSON.stringify(tasks), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const res = await api.api.rotax.tasks.$post({ json: body });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
};
