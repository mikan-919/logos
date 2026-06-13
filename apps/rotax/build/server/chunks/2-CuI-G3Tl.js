import { a as api } from './api-BqOvXXE9.js';
import 'hono/client';

const load = async () => {
  const res = await api.api.rotax.tasks.$get();
  const tasks = await res.json();
  return { tasks };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 2;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-BvE0EEDa.js')).default;
const server_id = "src/routes/+page.server.ts";
const imports = ["_app/immutable/nodes/2.Coppqu6E.js","_app/immutable/chunks/Bl5upyaA.js","_app/immutable/chunks/Bso-JtB5.js","_app/immutable/chunks/DxBangs3.js","_app/immutable/chunks/Bf3gDfdE.js","_app/immutable/chunks/C4Wi6Iq3.js"];
const stylesheets = ["_app/immutable/assets/2.BuFlXNsl.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=2-CuI-G3Tl.js.map
