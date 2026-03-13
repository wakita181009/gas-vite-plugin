import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "vite";
import type { GasPluginOptions } from "../../src";
import gasPlugin from "../../src/index.js";

export function createTestContext(fixturesDir: string) {
  function createFixture(name: string, files: Record<string, string>): string {
    const dir = resolve(fixturesDir, name);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    mkdirSync(resolve(dir, "src"), { recursive: true });

    for (const [path, content] of Object.entries(files)) {
      const fullPath = resolve(dir, path);
      mkdirSync(resolve(fullPath, ".."), { recursive: true });
      writeFileSync(fullPath, content);
    }

    return dir;
  }

  function readOutput(fixtureDir: string, fileName = "Code.js"): string {
    return readFileSync(resolve(fixtureDir, "dist", fileName), "utf-8");
  }

  async function buildFixture(fixtureDir: string, pluginOptions: GasPluginOptions = {}) {
    await build({
      root: fixtureDir,
      logLevel: "silent",
      plugins: [gasPlugin(pluginOptions)],
      build: {
        lib: {
          entry: resolve(fixtureDir, "src/main.ts"),
          formats: ["es"],
          fileName: () => "Code.js",
        },
      },
    });
  }

  function cleanup() {
    rmSync(fixturesDir, { recursive: true, force: true });
  }

  return { createFixture, readOutput, buildFixture, cleanup };
}
