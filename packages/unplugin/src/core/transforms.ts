/**
 * Strip `export` keyword from inline declarations.
 *
 * Handles patterns like:
 *   export function foo() { ... }
 *   export async function bar() { ... }
 *   export const x = ...
 *   export let y = ...
 *   export var z = ...
 *   export class Foo { ... }
 *   export abstract class Bar { ... }
 *
 * These become bare top-level declarations that GAS can call.
 */
export function stripExportKeywords(code: string): string {
  let result = code;

  result = result.replace(/^export\s+(function\s)/gm, "$1");
  result = result.replace(/^export\s+(async\s+function\s)/gm, "$1");
  result = result.replace(/^export\s+(const\s)/gm, "$1");
  result = result.replace(/^export\s+(let\s)/gm, "$1");
  result = result.replace(/^export\s+(var\s)/gm, "$1");
  result = result.replace(/^export\s+(class\s)/gm, "$1");
  result = result.replace(/^export\s+(abstract\s+class\s)/gm, "$1");

  return result;
}

/**
 * Remove remaining export blocks from bundled output:
 *   - `export { foo, bar };`
 *   - `export default expression;`
 *
 * Vite library mode typically generates `export { ... }` blocks
 * at the end of the output after all declarations.
 */
export function removeExportBlocks(code: string): string {
  let result = code;
  const defaultExportBinding = "__gas_default__";

  // Remove `export { ... };`
  result = result.replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, "");

  // Preserve named declarations as top-level function/class declarations.
  result = result.replace(
    /^export\s+default\s+((?:async\s+)?function(?:\s*\*)?\s+[A-Za-z_$][\w$]*)/gm,
    "$1",
  );
  result = result.replace(/^export\s+default\s+(class\s+[A-Za-z_$][\w$]*)/gm, "$1");

  // Convert remaining default exports into a valid assignment.
  result = result.replace(/^export\s+default\s+/gm, `const ${defaultExportBinding} = `);

  return result;
}
