import { defineConfig } from "vite-plus";
import { irisout } from "irisout/vite";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const caFile = process.env.SSL_CERT_FILE || "/etc/ssl/certs/ca-certificates.crt";
if (!process.env.NODE_EXTRA_CA_CERTS && existsSync(caFile)) {
  process.env.NODE_EXTRA_CA_CERTS = caFile;
}
const cloudflare = process.env.VITEST
  ? undefined
  : (await import("@cloudflare/vite-plugin")).cloudflare;

export default defineConfig({
  server: { strictPort: true },
  plugins: [
    irisout({ entry: "tagmemo/src/App.tsx", container: "#app" }),
    ...(cloudflare
      ? [
          cloudflare({
            configPath: fileURLToPath(new URL("./wrangler.jsonc", import.meta.url)),
            auxiliaryWorkers: [
              { configPath: fileURLToPath(new URL("../logos/wrangler.jsonc", import.meta.url)) },
            ],
          }),
        ]
      : []),
  ],
  build: {
    rollupOptions: {
      input: fileURLToPath(new URL("./index.html", import.meta.url)),
    },
  },
});
