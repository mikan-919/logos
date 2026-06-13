import { a as api } from "../../../../../../chunks/api.js";
const PATCH = async ({ params, request }) => {
  const body = await request.json();
  const res = await api.api.rotax.tasks[":id"].status.$patch({
    param: { id: params.id },
    json: body
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
};
export {
  PATCH
};
