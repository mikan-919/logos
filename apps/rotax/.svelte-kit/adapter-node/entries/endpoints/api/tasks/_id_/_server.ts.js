import { a as api } from "../../../../../chunks/api.js";
const PATCH = async ({ params, request }) => {
  const body = await request.json();
  const res = await api.api.rotax.tasks[":id"].$patch({
    param: { id: params.id },
    json: body
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
};
const DELETE = async ({ params }) => {
  const res = await api.api.rotax.tasks[":id"].$delete({
    param: { id: params.id }
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
};
export {
  DELETE,
  PATCH
};
