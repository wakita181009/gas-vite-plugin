import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import type { PluginBuild } from "esbuild";
import type { UnpluginOptions } from "unplugin";
import { afterEach, describe, expect, it, vi } from "vitest";
import { unpluginFactory } from "../src";

const TMP_BASE = resolve(tmpdir(), ".gas-plugin-index-test");

type ViteConfig = { config: (config: Record<string, unknown>) => unknown };
type RollupHooks = {
  options: (opts: Record<string, unknown>) => void;
  outputOptions: (opts: Record<string, unknown>) => void;
  closeBundle: () => void;
};

function createTmpDir(name: string): string {
  const dir = resolve(TMP_BASE, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  return dir;
}

function setupFixture(
  name: string,
  opts: { manifest?: boolean; outDir?: boolean; outFiles?: Record<string, string> } = {},
) {
  const dir = createTmpDir(name);
  mkdirSync(resolve(dir, "src"), { recursive: true });
  writeFileSync(resolve(dir, "src/main.ts"), "export function onOpen() {}");

  if (opts.manifest !== false) {
    writeFileSync(resolve(dir, "appsscript.json"), '{ "timeZone": "Asia/Tokyo" }');
  }

  const outDir = resolve(dir, "dist");
  if (opts.outDir) {
    mkdirSync(outDir, { recursive: true });
  }

  if (opts.outFiles) {
    if (!opts.outDir) mkdirSync(outDir, { recursive: true });
    for (const [file, content] of Object.entries(opts.outFiles)) {
      writeFileSync(resolve(outDir, file), content);
    }
  }

  return { dir, outDir };
}

function callEsbuildSetup(plugin: UnpluginOptions, opts: Record<string, unknown>) {
  const setup = (plugin.esbuild as { setup: (b: PluginBuild) => void }).setup;
  setup({ initialOptions: opts } as unknown as PluginBuild);
}

function callWebpack(plugin: UnpluginOptions, compiler: Record<string, unknown>) {
  (plugin.webpack as (compiler: unknown) => void)(compiler);
}

function callWriteBundle(plugin: UnpluginOptions) {
  (plugin as { writeBundle: () => void }).writeBundle();
}

afterEach(() => {
  rmSync(TMP_BASE, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("unpluginFactory", () => {
  describe("webpack hook", () => {
    it("registers afterEmit hook and processes output on callback", () => {
      const { dir, outDir } = setupFixture("webpack-basic", {
        outDir: true,
        outFiles: {
          "Code.js":
            "export function onOpen() {}\n/* __GAS_GLOBALS__ */ globalThis.__gas_keep__ = [onOpen];\n",
        },
      });

      const plugin = unpluginFactory();

      let capturedCb: ((compilation: unknown, callback: () => void) => void) | undefined;
      const mockCompiler = {
        options: {
          context: dir,
          output: { path: outDir },
        },
        hooks: {
          afterEmit: {
            tapAsync: vi.fn(
              (_name: string, cb: (compilation: unknown, callback: () => void) => void) => {
                capturedCb = cb;
              },
            ),
          },
        },
      };

      callWebpack(plugin, mockCompiler);
      expect(mockCompiler.hooks.afterEmit.tapAsync).toHaveBeenCalledWith(
        "@gas-plugin/unplugin",
        expect.any(Function),
      );

      // Invoke the afterEmit callback
      const done = vi.fn();
      capturedCb?.(null, done);

      expect(done).toHaveBeenCalled();
      expect(existsSync(resolve(outDir, "appsscript.json"))).toBe(true);

      // Post-processing should strip globals marker and export keyword
      const output = readFileSync(resolve(outDir, "Code.js"), "utf-8");
      expect(output).not.toContain("__GAS_GLOBALS__");
      expect(output).not.toContain("__gas_keep__");
    });

    it("handles missing context and output.path gracefully", () => {
      const plugin = unpluginFactory();

      const mockCompiler = {
        options: {
          context: undefined,
          output: { path: undefined },
        },
        hooks: {
          afterEmit: { tapAsync: vi.fn() },
        },
      };

      // Should not throw
      callWebpack(plugin, mockCompiler);
      expect(mockCompiler.hooks.afterEmit.tapAsync).toHaveBeenCalled();
    });
  });

  describe("writeBundle (esbuild/Bun fallback)", () => {
    it("warns for unmatched globals", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { dir, outDir } = setupFixture("warn-globals", { outDir: true });

      const plugin = unpluginFactory({ globals: ["nonExistent"] });

      callEsbuildSetup(plugin, {
        entryPoints: [resolve(dir, "src/main.ts")],
        outdir: outDir,
      });

      callWriteBundle(plugin);

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("nonExistent"));
    });

    it("warns when manifest is not found", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { dir, outDir } = setupFixture("no-manifest", { manifest: false, outDir: true });

      const plugin = unpluginFactory({ manifest: "missing.json" });

      callEsbuildSetup(plugin, {
        entryPoints: [resolve(dir, "src/main.ts")],
        outdir: outDir,
      });

      callWriteBundle(plugin);

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("manifest not found"));
    });

    it("creates output directory if it does not exist for manifest copy", () => {
      const { dir } = setupFixture("mkdir-out");
      // Use a nested outDir that doesn't exist yet
      const outDir = resolve(dir, "build/output");

      const plugin = unpluginFactory();

      // Use rollup hook (which calls copyFiles in closeBundle, not postProcessOutputFiles)
      const rollupHooks = plugin.rollup as unknown as RollupHooks;
      rollupHooks.options({ input: resolve(dir, "src/main.ts") });
      rollupHooks.outputOptions({ dir: outDir });

      expect(existsSync(outDir)).toBe(false);

      // closeBundle calls copyFiles which creates the directory
      rollupHooks.closeBundle();

      expect(existsSync(outDir)).toBe(true);
      expect(existsSync(resolve(outDir, "appsscript.json"))).toBe(true);
    });

    it("skips non-JS files during post-processing", () => {
      const { dir, outDir } = setupFixture("non-js", {
        outFiles: {
          "data.json": '{"key": "value"}',
          "Code.js": "function onOpen() {}",
        },
      });

      const plugin = unpluginFactory();

      callEsbuildSetup(plugin, {
        entryPoints: [resolve(dir, "src/main.ts")],
        outdir: outDir,
      });

      callWriteBundle(plugin);

      expect(readFileSync(resolve(outDir, "data.json"), "utf-8")).toBe('{"key": "value"}');
    });

    it("is skipped when handledByFramework is true", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

      const plugin = unpluginFactory({ globals: ["test"] });

      // webpack sets handledByFramework = true
      callWebpack(plugin, {
        options: { context: undefined, output: { path: undefined } },
        hooks: { afterEmit: { tapAsync: vi.fn() } },
      });

      callWriteBundle(plugin);

      // Should NOT warn since writeBundle is a no-op
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe("esbuild outfile support", () => {
    it("resolves outDir from outfile path", () => {
      const { dir, outDir } = setupFixture("esbuild-outfile", { outDir: true });

      const plugin = unpluginFactory();

      callEsbuildSetup(plugin, {
        entryPoints: [resolve(dir, "src/main.ts")],
        outfile: resolve(dir, "dist/bundle.js"),
      });

      callWriteBundle(plugin);

      expect(existsSync(outDir)).toBe(true);
      expect(existsSync(resolve(outDir, "appsscript.json"))).toBe(true);
    });
  });

  describe("vite config", () => {
    it("returns Vite 8 config with rolldownOptions", () => {
      const plugin = unpluginFactory();

      const viteConfig = (plugin.vite as unknown as ViteConfig).config;
      const result = viteConfig({});

      // With Vite 8 installed, should return rolldownOptions-based config
      expect(result).toHaveProperty("build");
      const build = (result as { build: Record<string, unknown> }).build;
      expect(build.minify).toBe(false);
      expect(build).toHaveProperty("rolldownOptions");
    });

    it("handles build config with existing rolldownOptions and lib", () => {
      const plugin = unpluginFactory();
      const viteConfig = (plugin.vite as unknown as ViteConfig).config;
      const result = viteConfig({
        build: {
          lib: { entry: "src/main.ts" },
          rolldownOptions: {
            input: ["src/main.ts"],
            output: { format: "es" },
          },
        },
      });

      const build = (result as { build: Record<string, unknown> }).build;
      // When lib or array input is set, codeSplitting should be undefined (not false)
      const rolldownOutput = (build.rolldownOptions as Record<string, unknown>).output as Record<
        string,
        unknown
      >;
      expect(rolldownOutput.codeSplitting).toBeUndefined();
    });
  });

  describe("transform", () => {
    it("tracks matched explicit globals across modules", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { dir, outDir } = setupFixture("matched-globals", { outDir: true });

      const plugin = unpluginFactory({ globals: ["getData", "missing"] });

      // Simulate transform calls
      const handler = (plugin.transform as { handler: (code: string) => string | undefined })
        .handler;
      handler("function getData() { return 1; }");

      callEsbuildSetup(plugin, {
        entryPoints: [resolve(dir, "src/main.ts")],
        outdir: outDir,
      });

      callWriteBundle(plugin);

      // "getData" was matched, so no warn for it. "missing" was never matched.
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("missing"));
    });
  });
});
