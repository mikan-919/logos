import { defineConfig } from "vite-plus";
import { irisout } from "irisout/vite";

export default defineConfig({
  plugins: [irisout({ entry: "src/App.jsx", container: "#app" })],
  server: { proxy: { "/api": "http://127.0.0.1:3001" } },
});
