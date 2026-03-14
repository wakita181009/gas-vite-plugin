import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createUnplugin } from "unplugin";
import { detectNamesToProtect } from "./core/globals.js";
import { copyFilesFlat, resolveIncludeFiles } from "./core/include.js";
import { postProcessBundle } from "./core/post-process.js";
import type { GasPluginOptions } from "./core/types.js";

const GLOBALS_MARKER = "/* __GAS_GLOBALS__ */";
const PLUGIN_NAME = "gas-plugin";

/**
 * Extract the first input file path from various input formats.
 */
function extractFirstInput(input: unknown): string | undefined {
  if (typeof input === "string") return input;
  if (Array.isArray(input) && input.length > 0) {
    const first = input[0];
    return typeof first === "string" ? first : first?.in;
  }
  if (input && typeof input === "object") {
    const values = Object.values(input as Record<string, string>);
    return values.length > 0 ? values[0] : undefined;
  }
  return undefined;
}

/**
 * Walk up from a file path to find the directory containing the manifest.
 * Falls back to parent of parent (assuming src/ convention).
 */
function findRootDir(filePath: string, manifestPath: string): string {
  let candidate = dirname(resolve(filePath));
  while (candidate !== dirname(candidate)) {
    if (existsSync(resolve(candidate, manifestPath))) {
      return candidate;
    }
    candidate = dirname(candidate);
  }
  // Fallback: assume input is in src/, so root is one level up
  return dirname(dirname(resolve(filePath)));
}

/**
 * Post-process generated bundle chunks in-memory.
 */
// biome-ignore lint/suspicious/noExplicitAny: Bundle types vary across Vite/Rollup versions
function processBundle(bundle: any) {
  for (const chunk of Object.values(bundle)) {
    const c = chunk as { type: string; code?: string };
    if (c.type !== "chunk" || !c.code) continue;
    c.code = postProcessBundle(c.code);
  }
}

export const unpluginFactory = (options: GasPluginOptions = {}) => {
  const {
    manifest = "src/appsscript.json",
    include = [],
    globals = [],
    autoGlobals = true,
  } = options;

  let rootDir = process.cwd();
  let outDir = "dist";

  function resolveOutDir(): string {
    return resolve(rootDir, outDir);
  }

  function copyFiles() {
    const resolvedOutDir = resolveOutDir();
    const src = resolve(rootDir, manifest);
    const dest = resolve(resolvedOutDir, "appsscript.json");

    if (existsSync(src)) {
      copyFileSync(src, dest);
    } else {
      // biome-ignore lint/suspicious/noConsole: Plugin needs to warn users about missing manifest
      console.warn(`[${PLUGIN_NAME}] manifest not found: ${manifest}. Skipping copy.`);
    }

    if (include.length > 0) {
      const files = resolveIncludeFiles(include, rootDir);
      copyFilesFlat(files, resolvedOutDir);
    }
  }

  function postProcessOutputFiles() {
    const resolvedOutDir = resolveOutDir();
    const files = readdirSync(resolvedOutDir);

    for (const file of files) {
      if (!/\.[jt]sx?$/.test(file)) continue;
      const filePath = resolve(resolvedOutDir, file);
      const content = readFileSync(filePath, "utf-8");
      const processed = postProcessBundle(content);
      if (processed !== content) {
        writeFileSync(filePath, processed, "utf-8");
      }
    }
  }

  return {
    name: PLUGIN_NAME,

    transform: {
      filter: {
        id: {
          include: [/\.[jt]sx?(\?|$)/],
          exclude: [/\0/],
        },
      },
      handler(code: string) {
        const toInject = detectNamesToProtect(code, globals, autoGlobals);
        if (toInject.length === 0) return;

        const refs = toInject.join(", ");
        return `${code}\n${GLOBALS_MARKER} globalThis.__gas_keep__ = [${refs}];\n`;
      },
    },

    // Vite-specific hooks
    vite: {
      enforce: "post" as const,
      apply: "build" as const,

      // biome-ignore lint/suspicious/noExplicitAny: Vite UserConfig shape varies across versions
      config(config: any) {
        const build = (config.build ?? {}) as Record<string, unknown>;
        const rolldownOptions = (build.rolldownOptions ?? {}) as Record<string, unknown>;
        const output = (rolldownOptions.output ?? {}) as Record<string, unknown>;

        return {
          build: {
            minify: (build.minify ?? false) as boolean,
            rolldownOptions: {
              ...rolldownOptions,
              output: {
                ...output,
                codeSplitting:
                  build.lib || Array.isArray(rolldownOptions.input) ? undefined : false,
              },
            },
          },
        };
      },

      configResolved(config: { root: string; build: { outDir: string } }) {
        rootDir = config.root;
        outDir = config.build.outDir;
      },

      generateBundle(_options: unknown, bundle: unknown) {
        processBundle(bundle);
      },

      closeBundle() {
        copyFiles();
      },
    },

    // Rollup-specific hooks
    rollup: {
      options(inputOptions: { input?: unknown }) {
        const firstInput = extractFirstInput(inputOptions.input);
        if (firstInput) {
          rootDir = findRootDir(firstInput, manifest);
        }
      },

      outputOptions(outputOptions: { dir?: string }) {
        if (outputOptions.dir) {
          outDir = resolve(outputOptions.dir);
        }
      },

      generateBundle(_options: unknown, bundle: unknown) {
        processBundle(bundle);
      },

      closeBundle() {
        copyFiles();
      },
    },

    // biome-ignore lint/suspicious/noExplicitAny: webpack Compiler type varies across versions
    webpack(compiler: any) {
      if (compiler.options?.context) {
        rootDir = compiler.options.context;
      }
      if (compiler.options?.output?.path) {
        outDir = compiler.options.output.path;
      }

      compiler.hooks.afterEmit.tapAsync(
        PLUGIN_NAME,
        (_compilation: unknown, callback: () => void) => {
          postProcessOutputFiles();
          copyFiles();
          callback();
        },
      );
    },

    // esbuild-specific hooks
    esbuild: {
      // biome-ignore lint/suspicious/noExplicitAny: esbuild PluginBuild type varies
      setup(build: any) {
        const opts = build.initialOptions;
        const firstEntry = extractFirstInput(opts.entryPoints);
        if (firstEntry) {
          rootDir = findRootDir(firstEntry, manifest);
        }
        if (opts.outdir) {
          outDir = resolve(opts.outdir);
        } else if (opts.outfile) {
          outDir = dirname(resolve(opts.outfile));
        }
      },
    },

    // writeBundle: post-process output files on disk (esbuild/Bun fallback)
    writeBundle() {
      postProcessOutputFiles();
      copyFiles();
    },
  };
};

export const unplugin = createUnplugin(unpluginFactory);

export default unplugin;
// biome-ignore lint/performance/noBarrelFile: Plugin re-exports transforms and types for consumers
export { postProcessBundle } from "./core/post-process.js";
export { removeExportBlocks, stripExportKeywords } from "./core/transforms.js";
export type { GasPluginOptions } from "./core/types.js";
