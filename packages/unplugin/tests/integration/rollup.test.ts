import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildWithRollup, createTestContext } from "./helpers.js";

const FIXTURES_DIR = resolve(import.meta.dirname, ".fixtures-rollup");
const { createFixture, readOutput, outputExists, cleanup } = createTestContext(FIXTURES_DIR);

afterEach(() => cleanup());

describe("Rollup integration", () => {
  it("builds a basic GAS project and strips exports", async () => {
    const dir = createFixture("basic", {
      "src/main.ts": `
export function onOpen() {
  console.log("open");
}

export function sayHello() {
  return "hello";
}
`,
      "src/appsscript.json": '{ "timeZone": "Asia/Tokyo", "runtimeVersion": "V8" }',
    });

    await buildWithRollup(dir);
    const output = readOutput(dir);

    // No export keywords
    expect(output).not.toMatch(/^export\s/m);
    expect(output).toContain("function onOpen()");
    expect(output).toContain("function sayHello()");
  });

  it("copies appsscript.json manifest to output", async () => {
    const dir = createFixture("manifest", {
      "src/main.ts": `export function onOpen() {}`,
      "src/appsscript.json": '{ "timeZone": "Asia/Tokyo", "runtimeVersion": "V8" }',
    });

    await buildWithRollup(dir);
    expect(outputExists(dir, "appsscript.json")).toBe(true);
  });

  it("protects globals from tree-shaking", async () => {
    const dir = createFixture("globals", {
      "src/main.ts": `
function getData() {
  return [1, 2, 3];
}

function saveData(data) {
  console.log(data);
}
`,
      "src/appsscript.json": '{ "timeZone": "Asia/Tokyo", "runtimeVersion": "V8" }',
    });

    await buildWithRollup(dir, { globals: ["getData", "saveData"] });
    const output = readOutput(dir);

    expect(output).toContain("function getData()");
    expect(output).toContain("function saveData(");
    // Markers should be cleaned up
    expect(output).not.toContain("__GAS_GLOBALS__");
    expect(output).not.toContain("__gas_keep__");
  });

  it("copies include files to output", async () => {
    const dir = createFixture("include", {
      "src/main.ts": `export function doGet() { return "ok"; }`,
      "src/appsscript.json": '{ "timeZone": "Asia/Tokyo", "runtimeVersion": "V8" }',
      "src/index.html": "<html><body>Hello</body></html>",
    });

    await buildWithRollup(dir, { include: ["src/**/*.html"] });
    expect(outputExists(dir, "index.html")).toBe(true);
  });

  it("autoGlobals protects exported functions", async () => {
    const dir = createFixture("auto-globals", {
      "src/main.ts": `
export function onOpen() {
  console.log("open");
}

export function onEdit() {
  console.log("edit");
}
`,
      "src/appsscript.json": '{ "timeZone": "Asia/Tokyo", "runtimeVersion": "V8" }',
    });

    await buildWithRollup(dir, { autoGlobals: true });
    const output = readOutput(dir);

    expect(output).toContain("function onOpen()");
    expect(output).toContain("function onEdit()");
    expect(output).not.toContain("__gas_keep__");
  });
});
