import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestContext } from "./helpers.js";

const FIXTURES_DIR = resolve(import.meta.dirname, "../fixtures-exports");
const { createFixture, readOutput, buildFixture, cleanup } = createTestContext(FIXTURES_DIR);

beforeEach(cleanup);
afterEach(cleanup);

describe("US4: Export edge cases", () => {
  it("handles export default function", async () => {
    const dir = createFixture("export-default-fn", {
      "src/main.ts": "export default function handler() { return 1; }",
    });

    await buildFixture(dir);
    const output = readOutput(dir);

    expect(output).not.toMatch(/^export\s/m);
    expect(output).toMatch(/function handler\(/);
  });

  it("handles export { foo, bar } aggregation", async () => {
    const dir = createFixture("export-aggregation", {
      "src/main.ts": [
        "function foo() { return 1; }",
        "function bar() { return 2; }",
        "export { foo, bar };",
      ].join("\n"),
    });

    await buildFixture(dir);
    const output = readOutput(dir);

    expect(output).not.toMatch(/^export\s/m);
    expect(output).toMatch(/function foo\(/);
    expect(output).toMatch(/function bar\(/);
  });

  it("handles export { foo as bar } renamed export", async () => {
    const dir = createFixture("export-renamed", {
      "src/main.ts": [
        "function myFunction() { return 1; }",
        "export { myFunction as handler };",
      ].join("\n"),
    });

    await buildFixture(dir);
    const output = readOutput(dir);

    expect(output).not.toMatch(/^export\s/m);
    expect(output).toMatch(/function myFunction\(|function handler\(/);
  });

  it("handles export class", async () => {
    const dir = createFixture("export-class", {
      "src/main.ts": [
        "export class MyService {",
        "  run() { return 1; }",
        "}",
        "export function useService() { return new MyService().run(); }",
      ].join("\n"),
    });

    await buildFixture(dir);
    const output = readOutput(dir);

    expect(output).not.toMatch(/^export\s/m);
    // rolldown may compile `export class X` to `var X = class { ... }`
    expect(output).toMatch(/class\s*\{|class MyService/);
    expect(output).toMatch(/function useService\(/);
  });

  it("handles export default expression", async () => {
    const dir = createFixture("export-default-expr", {
      "src/main.ts": [
        "const config = { timeZone: 'Asia/Tokyo' };",
        "export default config;",
        "export function getConfig() { return config; }",
      ].join("\n"),
    });

    await buildFixture(dir);
    const output = readOutput(dir);

    expect(output).not.toMatch(/^export\s+default\s/m);
    expect(output).not.toMatch(/^export\s*\{/m);
  });
});
