import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [dts({ rollupTypes: true })],
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        vite: "src/vite.ts",
        rollup: "src/rollup.ts",
        webpack: "src/webpack.ts",
        esbuild: "src/esbuild.ts",
        bun: "src/bun.ts",
      },
      formats: ["es", "cjs"],
    },
    rolldownOptions: {
      external: [
        "unplugin",
        "vite",
        "rollup",
        "webpack",
        "esbuild",
        "node:fs",
        "node:path",
        "node:fs/promises",
        "tinyglobby",
      ],
      output: {
        exports: "named",
      },
    },
    minify: false,
  },
});
