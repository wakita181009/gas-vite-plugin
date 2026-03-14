import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copyFilesFlat, resolveIncludeFiles } from "../../src/core/include.js";

const TMP_DIR = resolve(import.meta.dirname, "../tmp-include-unit");

beforeEach(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
  mkdirSync(TMP_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
});

function createFiles(files: Record<string, string>) {
  for (const [path, content] of Object.entries(files)) {
    const fullPath = resolve(TMP_DIR, path);
    mkdirSync(resolve(fullPath, ".."), { recursive: true });
    writeFileSync(fullPath, content);
  }
}

// --- resolveIncludeFiles ---

describe("resolveIncludeFiles", () => {
  it("resolves a single glob pattern", () => {
    createFiles({
      "src/index.html": "<html></html>",
      "src/main.ts": "export function onOpen() {}",
    });

    const result = resolveIncludeFiles(["src/**/*.html"], TMP_DIR);
    expect(result).toHaveLength(1);
    expect(basename(result[0])).toBe("index.html");
  });

  it("resolves multiple glob patterns", () => {
    createFiles({
      "src/index.html": "<html></html>",
      "src/style.css": "body {}",
    });

    const result = resolveIncludeFiles(["src/**/*.html", "src/**/*.css"], TMP_DIR);
    expect(result).toHaveLength(2);
    const names = result.map((f) => basename(f)).sort();
    expect(names).toEqual(["index.html", "style.css"]);
  });

  it("returns empty array when no files match", () => {
    createFiles({ "src/main.ts": "export function onOpen() {}" });

    const result = resolveIncludeFiles(["src/**/*.html"], TMP_DIR);
    expect(result).toEqual([]);
  });

  it("returns empty array for empty patterns", () => {
    const result = resolveIncludeFiles([], TMP_DIR);
    expect(result).toEqual([]);
  });

  it("deduplicates files matched by multiple patterns", () => {
    createFiles({ "src/index.html": "<html></html>" });

    const result = resolveIncludeFiles(["src/**/*.html", "src/index.html"], TMP_DIR);
    expect(result).toHaveLength(1);
  });
});

// --- copyFilesFlat ---

describe("copyFilesFlat", () => {
  it("copies files flat to output directory", () => {
    createFiles({ "src/views/index.html": "<html>hello</html>" });
    const outDir = resolve(TMP_DIR, "dist");
    mkdirSync(outDir, { recursive: true });

    const files = [resolve(TMP_DIR, "src/views/index.html")];
    copyFilesFlat(files, outDir);

    const copied = readFileSync(resolve(outDir, "index.html"), "utf-8");
    expect(copied).toBe("<html>hello</html>");
  });

  it("flattens subdirectory structure to basename only", () => {
    createFiles({
      "src/views/page.html": "<html>page</html>",
      "src/styles/app.css": "body {}",
    });
    const outDir = resolve(TMP_DIR, "dist");
    mkdirSync(outDir, { recursive: true });

    const files = [resolve(TMP_DIR, "src/views/page.html"), resolve(TMP_DIR, "src/styles/app.css")];
    copyFilesFlat(files, outDir);

    expect(existsSync(resolve(outDir, "page.html"))).toBe(true);
    expect(existsSync(resolve(outDir, "app.css"))).toBe(true);
    // No subdirectories created
    expect(existsSync(resolve(outDir, "views"))).toBe(false);
    expect(existsSync(resolve(outDir, "styles"))).toBe(false);
  });

  it("warns and skips on filename collision", () => {
    createFiles({
      "src/a/page.html": "<html>a</html>",
      "src/b/page.html": "<html>b</html>",
    });
    const outDir = resolve(TMP_DIR, "dist");
    mkdirSync(outDir, { recursive: true });

    const warnSpy = vi
      .spyOn(console, "warn") // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional no-op mock
      .mockImplementation(() => {});

    const files = [resolve(TMP_DIR, "src/a/page.html"), resolve(TMP_DIR, "src/b/page.html")];
    copyFilesFlat(files, outDir);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[@gas-plugin/unplugin] filename collision"),
    );

    // First match wins
    const copied = readFileSync(resolve(outDir, "page.html"), "utf-8");
    expect(copied).toBe("<html>a</html>");

    warnSpy.mockRestore();
  });

  it("handles empty file list", () => {
    const outDir = resolve(TMP_DIR, "dist");
    mkdirSync(outDir, { recursive: true });

    copyFilesFlat([], outDir);
    // No error thrown, outDir still exists
    expect(existsSync(outDir)).toBe(true);
  });
});
