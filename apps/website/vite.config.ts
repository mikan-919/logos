import { defineConfig } from "vite-plus";
import { irisoutHono } from "irisout/hono/vite";
import { app } from "./main.ts";
export default defineConfig({
  plugins: [irisoutHono(app)],
});
