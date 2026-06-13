import { a as api } from './api-BqOvXXE9.js';
import 'hono/client';

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

export { PATCH };
//# sourceMappingURL=_server.ts-CVbOyhmS.js.map
