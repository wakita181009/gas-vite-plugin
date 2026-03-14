import { removeExportBlocks, stripExportKeywords } from "./transforms.js";

// Match markers with or without the comment prefix (bundlers may strip comments)
const GLOBALS_MARKER_RE =
  /^\s*(?:\/\* __GAS_GLOBALS__ \*\/\s*)?globalThis\.__gas_keep__\s*=\s*\[.*?];\s*$/gm;

/**
 * Post-process a bundled code string:
 * 1. Remove tree-shake protection injections (globalThis.__gas_keep__ markers)
 * 2. Strip inline export keywords
 * 3. Remove export blocks
 * 4. Normalize trailing newline
 */
export function postProcessBundle(code: string): string {
  let result = code;

  // Remove tree-shake protection injections
  result = result.replace(GLOBALS_MARKER_RE, "");

  // Strip export keywords and blocks
  result = stripExportKeywords(result);
  result = removeExportBlocks(result);

  // Normalize trailing newline
  return `${result.trimEnd()}\n`;
}
