import type { LogosApiType } from "@logos/backend";
import { hc } from "hono/client";

export function logosApi(fetcher: typeof fetch = fetch) {
  return hc<LogosApiType>("/api", { fetch: fetcher });
}

export async function checked<R extends Response>(request: Promise<R>): Promise<R> {
  const response = await request;
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? `要求に失敗しました (${response.status})`);
  }
  return response;
}
