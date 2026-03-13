import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
//#region src/index.ts
var GAS_TRIGGERS = [
	"onOpen",
	"onEdit",
	"onInstall",
	"onSelectionChange",
	"onFormSubmit",
	"doGet",
	"doPost"
];
function gasPlugin(options = {}) {
	const { manifest = "src/appsscript.json", globals = [], autoGlobals = true } = options;
	let rootDir = process.cwd();
	return {
		name: "gas-vite-plugin",
		enforce: "post",
		apply: "build",
		config(config) {
			return { build: {
				minify: false,
				rollupOptions: {
					...config.build?.rollupOptions,
					output: {
						...config.build?.rollupOptions?.output,
						inlineDynamicImports: !config.build?.lib && !Array.isArray(config.build?.rollupOptions?.input)
					}
				}
			} };
		},
		configResolved(config) {
			rootDir = config.root;
		},
		generateBundle(_, bundle) {
			for (const chunk of Object.values(bundle)) {
				if (chunk.type !== "chunk") continue;
				let code = chunk.code;
				if (autoGlobals) code = exposeExportedFunctions(code);
				code = removeExports(code);
				if (globals.length > 0) code = exposeGlobals(code, globals);
				chunk.code = code.trimEnd() + "\n";
			}
		},
		closeBundle() {
			const src = resolve(rootDir, manifest);
			const dest = resolve(rootDir, "dist", "appsscript.json");
			if (existsSync(src)) copyFileSync(src, dest);
			else console.warn(`[gas-vite-plugin] manifest not found: ${manifest}. Skipping copy.`);
		}
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
function exposeExportedFunctions(code) {
	const exportedNames = /* @__PURE__ */ new Set();
	const exportBlockRe = /^export\s*\{([^}]+)\}\s*;?\s*$/gm;
	let match;
	while ((match = exportBlockRe.exec(code)) !== null) for (const name of match[1].split(",")) {
		const trimmed = name.trim().split(/\s+as\s+/)[0].trim();
		if (trimmed) exportedNames.add(trimmed);
	}
	const inlineExportFnRe = /^export\s+(function\s+\w+)/gm;
	while ((match = inlineExportFnRe.exec(code)) !== null);
	code = code.replace(/^export\s+(function\s)/gm, "$1");
	code = code.replace(/^export\s+(const\s)/gm, "$1");
	code = code.replace(/^export\s+(let\s)/gm, "$1");
	code = code.replace(/^export\s+(var\s)/gm, "$1");
	code = code.replace(/^export\s+(class\s)/gm, "$1");
	code = code.replace(/^export\s+(async\s+function\s)/gm, "$1");
	return code;
}
/**
* Remove remaining export statements:
* - `export { ... };`
* - `export default ...;`
*/
function removeExports(code) {
	code = code.replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, "");
	code = code.replace(/^export\s+default\s+/gm, "");
	return code;
}
/**
* For explicitly listed globals, ensure they exist as top-level
* function declarations that GAS can call.
*/
function exposeGlobals(code, globals) {
	const allGlobals = [...new Set([...GAS_TRIGGERS, ...globals])];
	const lines = [];
	for (const name of allGlobals) {
		if (new RegExp(`^(?:function|const|let|var|async\\s+function)\\s+${name}\\b`, "m").test(code)) continue;
		if (!new RegExp(`\\b${name}\\b`).test(code)) continue;
		lines.push(`function ${name}(...args) { return ${name}(...args); }`);
	}
	if (lines.length > 0) code = code + "\n" + lines.join("\n") + "\n";
	return code;
}
//#endregion
export { gasPlugin as default, gasPlugin };
