import { defineConfig } from "vite-plus";
import tagmemo from "./apps/tagmemo/vite.config.ts";

export default defineConfig({
  ...tagmemo,
  plugins: process.env.VITEST ? [] : tagmemo.plugins,
  root: process.env.VITEST ? undefined : "apps/tagmemo",
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
