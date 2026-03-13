import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin, UserConfig } from "vite";
import { copyFilesFlat, resolveIncludeFiles } from "./include.js";
import { removeExportBlocks, stripExportKeywords } from "./transforms.js";
import type { GasPluginOptions } from "./types.js";

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function detectNamesToProtect(code: string, globals: string[], autoGlobals: boolean): string[] {
  const names = [...globals];

  if (autoGlobals) {
    const exportPattern = /^export\s+(?:async\s+)?(?:function|const|let|var|class)\s+(\w+)/gm;
    for (const match of code.matchAll(exportPattern)) {
      if (!names.includes(match[1])) {
        names.push(match[1]);
      }
    }
  }

  if (names.length === 0) return [];

  // Only protect names that are declared in this module
  return names.filter((name) => {
    const escaped = escapeRegExp(name);
    const declPattern = new RegExp(`(?:function|const|let|var|class)\\s+${escaped}\\b`);
    return declPattern.test(code);
  });
}

export default function gasPlugin(options: GasPluginOptions = {}): Plugin {
  const {
    manifest = "src/appsscript.json",
    include = [],
    globals = [],
    autoGlobals = true,
  } = options;

  const GLOBALS_MARKER = "/* __GAS_GLOBALS__ */";

  let rootDir = process.cwd();
  let outDir = "dist";

  return {
    name: "gas-vite-plugin",
    enforce: "post",
    apply: "build",

    config(config): UserConfig {
      return {
        build: {
          minify: false,
          rolldownOptions: {
            ...config.build?.rolldownOptions,
            output: {
              ...(config.build?.rolldownOptions?.output as object),
              // Prevent code splitting — GAS needs standalone files
              codeSplitting:
                config.build?.lib || Array.isArray(config.build?.rolldownOptions?.input)
                  ? undefined
                  : false,
            },
          },
        },
      };
    },

    configResolved(config) {
      rootDir = config.root;
      outDir = config.build.outDir;
    },

    transform(code, id) {
      // Skip virtual modules (rolldown runtime, etc.) and non-JS/TS files
      if (id.startsWith("\0") || !/\.[jt]sx?(\?|$)/.test(id)) return;

      const toInject = detectNamesToProtect(code, globals, autoGlobals);
      if (toInject.length === 0) return;

      // Inject side-effect references to prevent tree-shaking.
      // Uses globalThis assignment which rolldown recognizes as a side effect.
      // Cleaned up in generateBundle.
      const refs = toInject.join(", ");
      return `${code}\n${GLOBALS_MARKER} globalThis.__gas_keep__ = [${refs}];\n`;
    },

    generateBundle(_, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== "chunk") continue;

        let code = chunk.code;

        // Remove tree-shake protection injections
        code = code.replace(
          /^\s*\/\* __GAS_GLOBALS__ \*\/\s*globalThis\.__gas_keep__\s*=\s*\[.*?\];\s*$/gm,
          "",
        );

        code = stripExportKeywords(code);
        code = removeExportBlocks(code);
        chunk.code = `${code.trimEnd()}\n`;
      }
    },

    closeBundle() {
      const resolvedOutDir = resolve(rootDir, outDir);

      // Copy appsscript.json manifest
      const src = resolve(rootDir, manifest);
      const dest = resolve(resolvedOutDir, "appsscript.json");

      if (existsSync(src)) {
        copyFileSync(src, dest);
      } else {
        // biome-ignore lint/suspicious/noConsole: Vite plugin needs to warn users about missing manifest
        console.warn(`[gas-vite-plugin] manifest not found: ${manifest}. Skipping copy.`);
      }

      // Copy additional files via include patterns
      if (include.length > 0) {
        const files = resolveIncludeFiles(include, rootDir);
        copyFilesFlat(files, resolvedOutDir);
      }
    },
  };
}

export { gasPlugin };
// biome-ignore lint/performance/noBarrelFile: Plugin re-exports transforms and types for consumers
export { removeExportBlocks, stripExportKeywords } from "./transforms.js";
export type { GasPluginOptions } from "./types.js";
