import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin, UserConfig } from "vite";
import { removeExportBlocks, stripExportKeywords } from "./transforms.js";

export interface GasPluginOptions {
  /**
   * Path to appsscript.json manifest file.
   * @default "src/appsscript.json"
   */
  manifest?: string;
}

export default function gasPlugin(options: GasPluginOptions = {}): Plugin {
  const { manifest = "src/appsscript.json" } = options;

  let rootDir = process.cwd();

  return {
    name: "gas-vite-plugin",
    enforce: "post",
    apply: "build",

    config(config): UserConfig {
      return {
        build: {
          minify: false,
          rollupOptions: {
            ...config.build?.rollupOptions,
            output: {
              ...(config.build?.rollupOptions?.output as object),
              // Prevent code splitting — GAS needs standalone files
              codeSplitting:
                config.build?.lib || Array.isArray(config.build?.rollupOptions?.input)
                  ? undefined
                  : false,
            },
          },
        },
      };
    },

    configResolved(config) {
      rootDir = config.root;
    },

    generateBundle(_, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== "chunk") continue;

        let code = chunk.code;
        code = stripExportKeywords(code);
        code = removeExportBlocks(code);
        chunk.code = `${code.trimEnd()}\n`;
      }
    },

    closeBundle() {
      const src = resolve(rootDir, manifest);
      const dest = resolve(rootDir, "dist", "appsscript.json");

      if (existsSync(src)) {
        copyFileSync(src, dest);
      } else {
        // biome-ignore lint/suspicious/noConsole: Vite plugin needs to warn users about missing manifest
        console.warn(`[gas-vite-plugin] manifest not found: ${manifest}. Skipping copy.`);
      }
    },
  };
}

export { gasPlugin };
// biome-ignore lint/performance/noBarrelFile: Plugin re-exports transforms for advanced consumers
export { removeExportBlocks, stripExportKeywords } from "./transforms.js";
