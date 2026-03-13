import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestContext } from "./helpers.js";

const FIXTURES_DIR = resolve(import.meta.dirname, "../fixtures-globals");
const { createFixture, readOutput, buildFixture, cleanup } = createTestContext(FIXTURES_DIR);

beforeEach(cleanup);
afterEach(cleanup);

// --- US2: globals option ---

describe("US2: globals option", () => {
  it("non-exported function survives tree-shaking when listed in globals", async () => {
    const dir = createFixture("globals-survive", {
      "src/main.ts": [
        "export function onOpen() {",
        '  SpreadsheetApp.getUi().createMenu("Tools").addItem("Run", "processData").addToUi();',
        "}",
        "",
        "function processData() {",
        '  Logger.log("processing");',
        "}",
      ].join("\n"),
    });

    await buildFixture(dir, { globals: ["processData"] });
    const output = readOutput(dir);

    expect(output).toMatch(/function processData\(/);
    expect(output).toMatch(/function onOpen\(/);
    expect(output).not.toMatch(/^export\s/m);
  });

  it("silently ignores function names not found in bundle", async () => {
    const dir = createFixture("globals-missing", {
      "src/main.ts": "export function onOpen() { return 1; }",
    });

    // Should not throw
    await buildFixture(dir, { globals: ["nonExistentFunction"] });
    const output = readOutput(dir);

    expect(output).toMatch(/function onOpen\(/);
    expect(output).not.toMatch(/nonExistentFunction/);
  });

  it("no duplicate when function is both exported and listed in globals", async () => {
    const dir = createFixture("globals-dedup", {
      "src/main.ts": [
        "export function onOpen() { return 1; }",
        "export function processData() { return 2; }",
      ].join("\n"),
    });

    await buildFixture(dir, { globals: ["processData"] });
    const output = readOutput(dir);

    // processData should appear exactly once as a function declaration
    const matches = output.match(/function processData\(/g);
    expect(matches).toHaveLength(1);
  });
});

// --- US3: autoGlobals toggle (tests added in Phase 5) ---

describe("US3: autoGlobals toggle", () => {
  it("autoGlobals: false — exports still stripped but no tree-shake protection", async () => {
    const dir = createFixture("auto-off-no-globals", {
      "src/main.ts": [
        "export function onOpen() { return 1; }",
        "",
        "function helperNotExported() { return 2; }",
      ].join("\n"),
    });

    await buildFixture(dir, { autoGlobals: false });
    const output = readOutput(dir);

    // Export keywords removed
    expect(output).not.toMatch(/^export\s/m);
    expect(output).toMatch(/function onOpen\(/);
    // Non-exported function may be tree-shaken (not protected)
    // We can't guarantee it's removed (depends on bundler) but it shouldn't have typeof injection
    expect(output).not.toMatch(/typeof\s+helperNotExported/);
  });

  it("autoGlobals: false with explicit globals — only listed function protected", async () => {
    const dir = createFixture("auto-off-with-globals", {
      "src/main.ts": [
        "export function onOpen() { return 1; }",
        "",
        "function protectedHelper() { return 2; }",
        "",
        "function unprotectedHelper() { return 3; }",
      ].join("\n"),
    });

    await buildFixture(dir, { autoGlobals: false, globals: ["protectedHelper"] });
    const output = readOutput(dir);

    expect(output).not.toMatch(/^export\s/m);
    expect(output).toMatch(/function onOpen\(/);
    expect(output).toMatch(/function protectedHelper\(/);
    // unprotectedHelper may be tree-shaken
  });
});
