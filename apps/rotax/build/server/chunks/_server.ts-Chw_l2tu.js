import { a as api } from './api-BqOvXXE9.js';
import 'hono/client';

const GET = async () => {
  const res = await api.api.rotax.tasks.$get();
  const tasks = await res.json();
  return new Response(JSON.stringify(tasks), {
    headers: { "Content-Type": "application/json" }
  });
};
const POST = async ({ request }) => {
  const body = await request.json();
  const res = await api.api.rotax.tasks.$post({ json: body });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "Content-Type": "application/json" }
  });
};

export { GET, POST };
//# sourceMappingURL=_server.ts-Chw_l2tu.js.map
