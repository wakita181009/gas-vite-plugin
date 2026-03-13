import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "vite";
import { describe, expect, it } from "vitest";
import gasPlugin from "../../src/index.js";

const WEBAPP_DIR = resolve(import.meta.dirname, "../../../../apps/gas-webapp");

describe("US5: GAS web app test app", () => {
  it("builds with correct output structure", async () => {
    await build({
      root: WEBAPP_DIR,
      configFile: false,
      logLevel: "silent",
      plugins: [
        gasPlugin({
          include: ["src/**/*.html"],
          globals: ["getData", "saveData"],
        }),
      ],
      build: {
        lib: {
          entry: resolve(WEBAPP_DIR, "src/main.ts"),
          formats: ["es"],
          fileName: () => "Code.js",
        },
      },
    });

    const distDir = resolve(WEBAPP_DIR, "dist");

    // Code.js exists
    expect(existsSync(resolve(distDir, "Code.js"))).toBe(true);

    // appsscript.json copied
    expect(existsSync(resolve(distDir, "appsscript.json"))).toBe(true);

    // HTML file copied flat
    expect(existsSync(resolve(distDir, "index.html"))).toBe(true);

    const output = readFileSync(resolve(distDir, "Code.js"), "utf-8");

    // doGet is a top-level function (exported)
    expect(output).toMatch(/function doGet\(/);
    expect(output).not.toMatch(/^export\s/m);

    // getData and saveData survive tree-shaking (via globals)
    expect(output).toMatch(/function getData\(/);
    expect(output).toMatch(/function saveData\(/);

    // HTML content preserved
    const html = readFileSync(resolve(distDir, "index.html"), "utf-8");
    expect(html).toContain("google.script.run");
    expect(html).toContain("getData");
  });
});
