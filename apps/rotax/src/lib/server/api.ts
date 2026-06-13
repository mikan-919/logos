import { hc } from "hono/client";
import type { AppType } from "@logos/server/src/index";

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001";

export const api = hc<AppType>(SERVER_URL);
