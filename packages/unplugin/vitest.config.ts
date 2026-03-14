import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/index.ts",
        "src/core/transforms.ts",
        "src/core/include.ts",
        "src/core/globals.ts",
        "src/core/post-process.ts",
        "src/core/utils.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
