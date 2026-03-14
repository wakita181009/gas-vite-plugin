import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/core/render.ts",
        "src/core/templates.ts",
        "src/core/detect.ts",
        "src/core/git.ts",
        "src/core/scaffold.ts",
        "src/core/validate.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
