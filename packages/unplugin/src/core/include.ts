import { copyFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { globSync } from "tinyglobby";

/**
 * Resolve glob patterns to absolute file paths.
 * Deduplicates results when multiple patterns match the same file.
 */
export function resolveIncludeFiles(patterns: string[], rootDir: string): string[] {
  if (patterns.length === 0) return [];

  const files = globSync(patterns, {
    cwd: rootDir,
    absolute: true,
  });

  return [...new Set(files)];
}

/**
 * Copy files flat (basename only) to the output directory.
 * Warns and skips on filename collision (first match wins).
 */
export function copyFilesFlat(files: string[], outDir: string): void {
  const seen = new Map<string, string>();

  for (const file of files) {
    const name = basename(file);
    const dest = resolve(outDir, name);

    if (seen.has(name)) {
      console.warn(
        `[@gas-plugin/unplugin] filename collision: "${name}" from "${file}" skipped (already copied from "${seen.get(name)}")`,
      );
      continue;
    }

    seen.set(name, file);
    copyFileSync(file, dest);
  }
}
