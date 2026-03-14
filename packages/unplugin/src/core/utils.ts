import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { postProcessBundle } from "./post-process.js";

/**
 * Extract the first input file path from various input formats.
 */
export function extractFirstInput(input: unknown): string | undefined {
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
export function findRootDir(filePath: string, manifestPath: string): string {
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
export function processBundle(bundle: any) {
  for (const chunk of Object.values(bundle)) {
    const c = chunk as { type: string; code?: string };
    if (c.type !== "chunk" || !c.code) continue;
    c.code = postProcessBundle(c.code);
  }
}
