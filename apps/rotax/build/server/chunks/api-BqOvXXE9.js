import { hc } from 'hono/client';

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001";
const api = hc(SERVER_URL);

export { api as a };
//# sourceMappingURL=api-BqOvXXE9.js.map
