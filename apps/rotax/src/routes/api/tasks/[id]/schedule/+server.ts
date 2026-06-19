import { api } from "$lib/server/api";
import type { RequestHandler } from "./$types";

export const PATCH: RequestHandler = async ({ params, request }) => {
  const body = await request.json();
  const res = await api.api.rotax.tasks[":id"].schedule.$patch({
    param: { id: params.id },
    json: body,
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: RequestHandler = async ({ params }) => {
  const res = await api.api.rotax.tasks[":id"].schedule.$delete({
    param: { id: params.id },
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};
