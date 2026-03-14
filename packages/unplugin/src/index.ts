import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { PluginBuild as EsbuildPluginBuild } from "esbuild";
import { createUnplugin, type UnpluginOptions } from "unplugin";
import type { UserConfig as ViteUserConfig } from "vite";
import { detectNamesToProtect } from "./core/globals.js";
import { copyFilesFlat, resolveIncludeFiles } from "./core/include.js";
import { postProcessBundle } from "./core/post-process.js";
import { removeExportBlocks, stripExportKeywords } from "./core/transforms.js";
import type { GasPluginOptions, WebpackCompiler } from "./core/types.js";
import { extractFirstInput, findRootDir, processBundle } from "./core/utils.js";

export type { GasPluginOptions };
export { postProcessBundle, removeExportBlocks, stripExportKeywords };

const GLOBALS_MARKER = "/* __GAS_GLOBALS__ */";
const PLUGIN_NAME = "@gas-plugin/unplugin";

export const unpluginFactory = (options: GasPluginOptions = {}): UnpluginOptions => {
  const {
    manifest = "src/appsscript.json",
    include = [],
    globals = [],
    autoGlobals = true,
  } = options;

  let rootDir = process.cwd();
  let outDir = "dist";
  // Vite/Rollup/webpack handle post-processing and file copy in their own hooks.
  // writeBundle is a universal fallback for esbuild/Bun only.
  let handledByFramework = false;
  const matchedGlobals = new Set<string>();

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
      console.warn(`[${PLUGIN_NAME}] manifest not found: ${manifest}. Skipping copy.`);
    }

    if (include.length > 0) {
      const files = resolveIncludeFiles(include, rootDir);
      copyFilesFlat(files, resolvedOutDir);
    }
  }

  function warnUnmatchedGlobals() {
    for (const name of globals) {
      if (!matchedGlobals.has(name)) {
        console.warn(`[${PLUGIN_NAME}] globals: "${name}" was not found in any source module`);
      }
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

        // Track which explicit globals were matched across all modules
        for (const name of toInject) {
          if (globals.includes(name)) matchedGlobals.add(name);
        }

        if (toInject.length === 0) return;

        const refs = toInject.join(", ");
        return `${code}\n${GLOBALS_MARKER} globalThis.__gas_keep__ = [${refs}];\n`;
      },
    },

    // Vite-specific hooks
    vite: {
      enforce: "post" as const,
      apply: "build" as const,

      config(config: ViteUserConfig) {
        handledByFramework = true;
        // biome-ignore lint/suspicious/noExplicitAny: Support both Vite 5-7 (rollupOptions) and Vite 8+ (rolldownOptions)
        const build = (config.build ?? {}) as any;

        // Vite 8+ (Rolldown-based)
        const rolldownOptions = build.rolldownOptions ?? {};
        const rolldownOutput = rolldownOptions.output ?? {};
        const skipSplitRolldown = !(build.lib || Array.isArray(rolldownOptions.input));

        // Vite 5/6/7 (Rollup-based)
        const rollupOptions = build.rollupOptions ?? {};
        const rollupOutput = rollupOptions.output ?? {};
        const skipSplitRollup = !(build.lib || Array.isArray(rollupOptions.input));

        return {
          build: {
            minify: build.minify ?? false,
            // Vite 8+: codeSplitting controls chunk splitting
            rolldownOptions: {
              ...rolldownOptions,
              output: {
                ...rolldownOutput,
                codeSplitting: skipSplitRolldown ? false : undefined,
              },
            },
            // Vite 5/6/7: inlineDynamicImports prevents chunk splitting
            rollupOptions: {
              ...rollupOptions,
              output: {
                ...rollupOutput,
                ...(skipSplitRollup ? { inlineDynamicImports: true } : {}),
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
        warnUnmatchedGlobals();
        copyFiles();
      },
    },

    // Rollup-specific hooks
    rollup: {
      options(inputOptions: { input?: unknown }) {
        handledByFramework = true;
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
        warnUnmatchedGlobals();
        copyFiles();
      },
    },

    webpack(compiler: WebpackCompiler) {
      handledByFramework = true;
      if (compiler.options.context) {
        rootDir = compiler.options.context;
      }
      if (compiler.options.output.path) {
        outDir = compiler.options.output.path;
      }

      compiler.hooks.afterEmit.tapAsync(
        PLUGIN_NAME,
        (_compilation: unknown, callback: () => void) => {
          warnUnmatchedGlobals();
          postProcessOutputFiles();
          copyFiles();
          callback();
        },
      );
    },

    // esbuild-specific hooks
    esbuild: {
      setup(build: EsbuildPluginBuild) {
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

    // writeBundle: universal fallback for esbuild/Bun (skipped when framework handles it)
    writeBundle() {
      if (handledByFramework) return;
      warnUnmatchedGlobals();
      postProcessOutputFiles();
      copyFiles();
    },
  };
};

export const unplugin = createUnplugin(unpluginFactory);

export default unplugin;
