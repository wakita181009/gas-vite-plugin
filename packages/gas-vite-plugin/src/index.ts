import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin, UserConfig } from "vite";

export interface GasPluginOptions {
  /**
   * Path to appsscript.json manifest file.
   * @default "src/appsscript.json"
   */
  manifest?: string;

  /**
   * Function names to expose as top-level globals.
   * GAS requires top-level function declarations for triggers,
   * `google.script.run`, and custom menu handlers.
   *
   * Built-in GAS triggers (onOpen, onEdit, doGet, doPost, etc.)
   * are always included automatically.
   *
   * @example ["myMenuHandler", "processForm"]
   */
  globals?: string[];

  /**
   * Auto-detect exported functions and expose them as globals.
   * When enabled, all `export function` declarations become top-level globals.
   * @default true
   */
  autoGlobals?: boolean;
}

const GAS_TRIGGERS = [
  "onOpen",
  "onEdit",
  "onInstall",
  "onSelectionChange",
  "onFormSubmit",
  "doGet",
  "doPost",
] as const;

export default function gasPlugin(options: GasPluginOptions = {}): Plugin {
  const { manifest = "src/appsscript.json", globals = [], autoGlobals = true } = options;

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
              inlineDynamicImports: !(
                config.build?.lib || Array.isArray(config.build?.rollupOptions?.input)
              ),
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

        if (autoGlobals) {
          code = exposeExportedFunctions(code);
        }

        // Remove all export statements
        code = removeExports(code);

        // Expose explicitly listed globals
        if (globals.length > 0) {
          code = exposeGlobals(code, globals);
        }

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

/**
 * Find `export function name(...)` and add a top-level declaration
 * that makes it callable from GAS.
 *
 * Vite's library mode compiles:
 *   export function foo() { ... }
 * into:
 *   function foo() { ... }
 *   export { foo };
 *
 * We keep the function definition and just remove the `export { ... }`.
 * Since the function is already at the top level, GAS can see it.
 *
 * For cases where Vite wraps code differently, we also detect:
 *   const foo = function() { ... };
 *   const foo = (...) => { ... };
 * and hoist them if they were exported.
 */
function exposeExportedFunctions(code: string): string {
  let result = code;

  // Strip `export` keyword from inline declarations
  result = result.replace(/^export\s+(function\s)/gm, "$1");
  result = result.replace(/^export\s+(const\s)/gm, "$1");
  result = result.replace(/^export\s+(let\s)/gm, "$1");
  result = result.replace(/^export\s+(var\s)/gm, "$1");
  result = result.replace(/^export\s+(class\s)/gm, "$1");
  result = result.replace(/^export\s+(async\s+function\s)/gm, "$1");

  return result;
}

/**
 * Remove remaining export statements:
 * - `export { ... };`
 * - `export default ...;`
 */
function removeExports(code: string): string {
  let result = code;

  // Remove `export { ... };`
  result = result.replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, "");

  // Remove `export default expression;`
  result = result.replace(/^export\s+default\s+/gm, "");

  return result;
}

/**
 * For explicitly listed globals, ensure they exist as top-level
 * function declarations that GAS can call.
 */
function exposeGlobals(code: string, globals: string[]): string {
  const allGlobals = [...new Set([...GAS_TRIGGERS, ...globals])];
  const lines: string[] = [];

  for (const name of allGlobals) {
    // Check if a top-level function/const/var/let declaration exists
    const declPattern = new RegExp(
      `^(?:function|const|let|var|async\\s+function)\\s+${name}\\b`,
      "m",
    );
    if (declPattern.test(code)) {
      // Already declared at top level — GAS can see it
      continue;
    }

    // Check if it exists as a property or nested reference
    const refPattern = new RegExp(`\\b${name}\\b`);
    if (!refPattern.test(code)) {
      // Not referenced at all — skip
      continue;
    }

    // Add a top-level function wrapper
    lines.push(`function ${name}(...args) { return ${name}(...args); }`);
  }

  if (lines.length > 0) {
    return `${code}\n${lines.join("\n")}\n`;
  }

  return code;
}

export { gasPlugin };
