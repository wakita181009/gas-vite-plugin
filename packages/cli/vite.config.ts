import { cpSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import dts from "vite-plugin-dts";

function copyTemplates(): Plugin {
  return {
    name: "copy-templates",
    closeBundle() {
      cpSync("src/templates", "dist/templates", { recursive: true });
    },
  };
}

export default defineConfig({
  plugins: [dts({ rollupTypes: true, tsconfigPath: "./tsconfig.json" }), copyTemplates()],
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        "commands/create": "src/commands/create.ts",
      },
      formats: ["es"],
    },
    rolldownOptions: {
      external: ["citty", "@clack/prompts", /^node:/],
      output: {
        exports: "named",
        banner: (chunk) => {
          if (chunk.fileName === "index.js") {
            return "#!/usr/bin/env node";
          }
          return "";
        },
      },
    },
    minify: false,
  },
});
