import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { GasPluginOptions } from "../../src/core/types.js";

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

  function outputExists(fixtureDir: string, fileName: string): boolean {
    return existsSync(resolve(fixtureDir, "dist", fileName));
  }

  function cleanup() {
    rmSync(fixturesDir, { recursive: true, force: true });
  }

  return { createFixture, readOutput, outputExists, cleanup };
}

// Vite build helper
export async function buildWithVite(fixtureDir: string, pluginOptions: GasPluginOptions = {}) {
  const { build } = await import("vite");
  const gasPlugin = (await import("../../src/vite.js")).default;

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

// Rollup build helper
export async function buildWithRollup(fixtureDir: string, pluginOptions: GasPluginOptions = {}) {
  const { rollup } = await import("rollup");
  const gasPlugin = (await import("../../src/rollup.js")).default;

  const bundle = await rollup({
    input: resolve(fixtureDir, "src/main.ts"),
    plugins: [
      // Simple TS strip plugin: just strip type annotations for .ts files
      {
        name: "strip-types",
        transform(code: string, id: string) {
          if (!id.endsWith(".ts")) return null;
          // Strip type imports, interfaces, and type annotations
          let result = code;
          // Remove import type statements
          result = result.replace(/^import\s+type\s+.*?;\s*$/gm, "");
          // Remove type-only imports from mixed imports
          result = result.replace(/,\s*type\s+\w+/g, "");
          // Remove interface/type declarations
          result = result.replace(
            /^(?:export\s+)?(?:interface|type)\s+\w+.*?(?:\{[\s\S]*?\}|;)\s*$/gm,
            "",
          );
          // Remove type annotations from function params/returns
          result = result.replace(
            /:\s*(?:string|number|boolean|void|any|unknown|never|object)\b/g,
            "",
          );
          // Remove type annotations with generics
          result = result.replace(/:\s*\w+<[^>]+>/g, "");
          return result;
        },
      },
      gasPlugin(pluginOptions),
    ],
  });

  await bundle.write({
    dir: resolve(fixtureDir, "dist"),
    format: "es",
    entryFileNames: "Code.js",
  });

  await bundle.close();
}
