import { defineConfig } from "vite";

export default defineConfig({
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Access-Control-Allow-Origin": "http://localhost:5173", // Restrict to your dev server's origin
    },
  },
  build: {
    outDir: "./dist",
    rollupOptions: {
      input: "./src/index.html",
    },
  },
});
