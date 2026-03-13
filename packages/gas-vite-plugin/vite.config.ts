import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es", "cjs"],
      fileName: "index",
    },
    rollupOptions: {
      external: ["vite", "node:fs", "node:path", "node:fs/promises"],
    },
    minify: false,
  },
});
