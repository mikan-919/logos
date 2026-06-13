import { a as api } from './api-BqOvXXE9.js';
import 'hono/client';

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

export { DELETE, PATCH };
//# sourceMappingURL=_server.ts-C7SKw6v_.js.map
