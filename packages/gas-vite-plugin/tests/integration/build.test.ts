import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestContext } from "./helpers.js";

const FIXTURES_DIR = resolve(import.meta.dirname, "../fixtures");
const { createFixture, readOutput, buildFixture, cleanup } = createTestContext(FIXTURES_DIR);

beforeEach(cleanup);
afterEach(cleanup);

// --- US1: Basic GAS project build ---

describe("US1: Basic GAS project build", () => {
  it("removes export keywords from function declarations", async () => {
    const dir = createFixture("basic", {
      "src/main.ts": [
        "export function onOpen() { return 1; }",
        "export async function doPost(e: any) { return e; }",
        "export const processData = () => 42;",
      ].join("\n"),
    });

    await buildFixture(dir);
    const output = readOutput(dir);

    expect(output).not.toMatch(/^export\s/m);
    expect(output).toMatch(/^function onOpen\(\)/m);
    expect(output).toMatch(/^async function doPost\(/m);
    // esbuild may compile `export const` to `var` — check it's present without export
    expect(output).toMatch(/processData/);
  });

  it("bundles multi-module project into a single file", async () => {
    const dir = createFixture("multi-module", {
      "src/main.ts": [
        'import { greet } from "./utils";',
        "export function onOpen() { greet(); }",
      ].join("\n"),
      "src/utils.ts": 'export function greet() { return "hello"; }',
    });

    await buildFixture(dir);
    const output = readOutput(dir);

    expect(output).not.toMatch(/^import\s/m);
    expect(output).not.toMatch(/^export\s/m);
    expect(output).toMatch(/function onOpen\(/);
    expect(output).toMatch(/function greet\(/);
  });
});

// --- US2: appsscript.json manifest handling ---

describe("US2: appsscript.json manifest handling", () => {
  it("copies appsscript.json from default location to dist", async () => {
    const manifest = JSON.stringify({ timeZone: "Asia/Tokyo", runtimeVersion: "V8" });
    const dir = createFixture("manifest-default", {
      "src/main.ts": "export function onOpen() {}",
      "src/appsscript.json": manifest,
    });

    await buildFixture(dir);

    const copied = readFileSync(resolve(dir, "dist/appsscript.json"), "utf-8");
    expect(copied).toBe(manifest);
  });

  it("copies appsscript.json from custom path", async () => {
    const manifest = JSON.stringify({ timeZone: "UTC", runtimeVersion: "V8" });
    const dir = createFixture("manifest-custom", {
      "src/main.ts": "export function onOpen() {}",
      "appsscript.json": manifest,
    });

    await buildFixture(dir, { manifest: "appsscript.json" });

    const copied = readFileSync(resolve(dir, "dist/appsscript.json"), "utf-8");
    expect(copied).toBe(manifest);
  });

  it("warns but does not fail when manifest is missing", async () => {
    const dir = createFixture("manifest-missing", {
      "src/main.ts": "export function onOpen() {}",
    });

    const warnSpy = vi
      .spyOn(console, "warn") // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional no-op mock
      .mockImplementation(() => {});

    await buildFixture(dir);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[gas-vite-plugin] manifest not found"),
    );
    expect(existsSync(resolve(dir, "dist/appsscript.json"))).toBe(false);

    warnSpy.mockRestore();
  });
});

// --- US3: Zero-config build defaults ---

describe("US3: Zero-config build defaults", () => {
  it("output is not minified by default", async () => {
    const dir = createFixture("defaults-no-minify", {
      "src/main.ts":
        "export function onOpen() {\n  const greeting = 'hello';\n  return greeting;\n}",
    });

    await buildFixture(dir);
    const output = readOutput(dir);

    // Not minified: contains newlines and readable structure
    expect(output).toContain("\n");
    expect(output).toMatch(/function onOpen\(/);
    // esbuild may inline constants, so check structure not var names
    expect(output).not.toMatch(/^function \w+\(\)\{/m); // no brace-on-same-line minification
  });

  it("produces a single output file (no code splitting)", async () => {
    const dir = createFixture("defaults-single-file", {
      "src/main.ts": [
        'import { helper } from "./utils";',
        "export function onOpen() { helper(); }",
      ].join("\n"),
      "src/utils.ts": "export function helper() { return 1; }",
    });

    await buildFixture(dir);

    const distFiles = readFileSync(resolve(dir, "dist/Code.js"), "utf-8");
    expect(distFiles).toBeTruthy();
    // Should contain both functions in one file
    expect(distFiles).toMatch(/function onOpen/);
    expect(distFiles).toMatch(/function helper/);
  });
});
