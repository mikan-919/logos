import { defineConfig } from "vite-plus";
import { cloudflare } from "@cloudflare/vite-plugin";
import { irisout } from "irisout/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [
    irisout({ entry: "src/App.jsx", container: "#app" }),
    ...(!process.env.VITEST
      ? [cloudflare({ configPath: fileURLToPath(new URL("./wrangler.jsonc", import.meta.url)) })]
      : []),
  ],
});
