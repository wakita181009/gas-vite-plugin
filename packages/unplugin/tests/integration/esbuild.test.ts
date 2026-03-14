import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createTestContext } from "./helpers.js";

const FIXTURES_DIR = resolve(import.meta.dirname, ".fixtures-esbuild");
const { createFixture, readOutput, outputExists, cleanup } = createTestContext(FIXTURES_DIR);

afterEach(() => cleanup());

async function buildWithEsbuild(fixtureDir: string, pluginOptions: Record<string, unknown> = {}) {
  const esbuild = await import("esbuild");
  const gasPlugin = (await import("../../src/esbuild.js")).default;

  await esbuild.build({
    entryPoints: [resolve(fixtureDir, "src/main.ts")],
    bundle: true,
    outdir: resolve(fixtureDir, "dist"),
    entryNames: "Code",
    format: "esm",
    plugins: [gasPlugin(pluginOptions)],
    logLevel: "silent",
  });
}

describe("esbuild integration", () => {
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

    await buildWithEsbuild(dir);
    const output = readOutput(dir);

    expect(output).not.toMatch(/^export\s/m);
    expect(output).toContain("onOpen");
    expect(output).toContain("sayHello");
  });

  it("copies appsscript.json manifest to output", async () => {
    const dir = createFixture("manifest", {
      "src/main.ts": `export function onOpen() {}`,
      "src/appsscript.json": '{ "timeZone": "Asia/Tokyo", "runtimeVersion": "V8" }',
    });

    await buildWithEsbuild(dir);
    expect(outputExists(dir, "appsscript.json")).toBe(true);
  });

  it("removes globals markers from output", async () => {
    const dir = createFixture("globals", {
      "src/main.ts": `
export function getData() {
  return [1, 2, 3];
}
`,
      "src/appsscript.json": '{ "timeZone": "Asia/Tokyo", "runtimeVersion": "V8" }',
    });

    await buildWithEsbuild(dir, { globals: ["getData"] });
    const output = readOutput(dir);

    expect(output).not.toContain("__gas_keep__");
    expect(output).not.toContain("__GAS_GLOBALS__");
  });
});
