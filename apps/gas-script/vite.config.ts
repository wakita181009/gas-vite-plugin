import gasPlugin from "gas-vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [gasPlugin()],
  build: {
    lib: {
      entry: "src/main.ts",
      formats: ["es"],
      fileName: () => "Code.js",
    },
  },
});
