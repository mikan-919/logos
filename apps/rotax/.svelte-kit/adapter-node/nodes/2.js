import * as server from '../entries/pages/_page.server.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/+page.server.ts";
export const imports = ["_app/immutable/nodes/2.Coppqu6E.js","_app/immutable/chunks/Bl5upyaA.js","_app/immutable/chunks/Bso-JtB5.js","_app/immutable/chunks/DxBangs3.js","_app/immutable/chunks/Bf3gDfdE.js","_app/immutable/chunks/C4Wi6Iq3.js"];
export const stylesheets = ["_app/immutable/assets/2.BuFlXNsl.css"];
export const fonts = [];
