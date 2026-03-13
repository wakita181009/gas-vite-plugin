import { describe, expect, it } from "vitest";
import { removeExportBlocks, stripExportKeywords } from "../../src/transforms.js";

describe("stripExportKeywords", () => {
  it("strips export from function declarations", () => {
    const input = "export function onOpen() {\n  console.log('hello');\n}";
    const result = stripExportKeywords(input);
    expect(result).toBe("function onOpen() {\n  console.log('hello');\n}");
  });

  it("strips export from async function declarations", () => {
    const input = "export async function doPost(e) {\n  return e;\n}";
    const result = stripExportKeywords(input);
    expect(result).toBe("async function doPost(e) {\n  return e;\n}");
  });

  it("strips export from const declarations", () => {
    const input = "export const processData = () => { return 1; };";
    const result = stripExportKeywords(input);
    expect(result).toBe("const processData = () => { return 1; };");
  });

  it("strips export from let declarations", () => {
    const input = "export let counter = 0;";
    const result = stripExportKeywords(input);
    expect(result).toBe("let counter = 0;");
  });

  it("strips export from var declarations", () => {
    const input = "export var legacy = true;";
    const result = stripExportKeywords(input);
    expect(result).toBe("var legacy = true;");
  });

  it("handles multiple export declarations", () => {
    const input = [
      "export function foo() {}",
      "export const bar = 1;",
      "export async function baz() {}",
    ].join("\n");
    const result = stripExportKeywords(input);
    expect(result).toBe(
      ["function foo() {}", "const bar = 1;", "async function baz() {}"].join("\n"),
    );
  });

  it("returns code unchanged when no exports exist", () => {
    const input = "function foo() {}\nconst bar = 1;";
    const result = stripExportKeywords(input);
    expect(result).toBe(input);
  });

  it("does not modify export inside a string literal", () => {
    const input = 'const msg = "export function fake() {}";';
    const result = stripExportKeywords(input);
    expect(result).toBe(input);
  });

  it("does not modify export inside a comment", () => {
    const input = "// export function commented() {}";
    const result = stripExportKeywords(input);
    expect(result).toBe(input);
  });

  it("only strips export at the start of a line", () => {
    const input = "  export function indented() {}";
    const result = stripExportKeywords(input);
    // indented export is NOT stripped (only line-start exports)
    expect(result).toBe(input);
  });
});

describe("removeExportBlocks", () => {
  it("removes single named export block", () => {
    const input = "function foo() {}\nexport { foo };";
    const result = removeExportBlocks(input);
    expect(result).toBe("function foo() {}\n");
  });

  it("removes multi-name export block", () => {
    const input = "function foo() {}\nfunction bar() {}\nexport { foo, bar };";
    const result = removeExportBlocks(input);
    expect(result).toBe("function foo() {}\nfunction bar() {}\n");
  });

  it("removes renamed export block", () => {
    const input = "function foo() {}\nexport { foo as bar };";
    const result = removeExportBlocks(input);
    expect(result).toBe("function foo() {}\n");
  });

  it("removes export default prefix", () => {
    const input = "export default function handler() {}";
    const result = removeExportBlocks(input);
    expect(result).toBe("function handler() {}");
  });

  it("removes export default from expression", () => {
    const input = "export default 42;";
    const result = removeExportBlocks(input);
    expect(result).toBe("42;");
  });

  it("removes multiple export blocks", () => {
    const input = [
      "function foo() {}",
      "function bar() {}",
      "export { foo };",
      "export { bar };",
    ].join("\n");
    const result = removeExportBlocks(input);
    expect(result.trim()).toBe("function foo() {}\nfunction bar() {}");
  });

  it("returns code unchanged when no export blocks exist", () => {
    const input = "function foo() {}\nconst bar = 1;";
    const result = removeExportBlocks(input);
    expect(result).toBe(input);
  });

  it("removes export block without semicolon", () => {
    const input = "function foo() {}\nexport { foo }";
    const result = removeExportBlocks(input);
    expect(result).toBe("function foo() {}\n");
  });
});
