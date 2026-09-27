import { defineConfig } from "vite-plus";
import logos from "./apps/logos/vite.config.ts";

export default defineConfig({
  ...logos,
  plugins: process.env.VITEST ? [] : logos.plugins,
  root: process.env.VITEST ? undefined : "apps",
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  run: {
    cache: true,
  },
});
