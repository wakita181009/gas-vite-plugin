import { describe, expect, it } from "vitest";
import { postProcessBundle } from "../../src/core/post-process.js";

describe("postProcessBundle", () => {
  it("removes globals marker injections", () => {
    const input = `function foo() {}
/* __GAS_GLOBALS__ */ globalThis.__gas_keep__ = [foo];
`;
    const result = postProcessBundle(input);
    expect(result).not.toContain("__GAS_GLOBALS__");
    expect(result).not.toContain("__gas_keep__");
    expect(result).toContain("function foo() {}");
  });

  it("removes multiple globals marker injections", () => {
    const input = `function foo() {}
/* __GAS_GLOBALS__ */ globalThis.__gas_keep__ = [foo];
function bar() {}
/* __GAS_GLOBALS__ */ globalThis.__gas_keep__ = [bar];
`;
    const result = postProcessBundle(input);
    expect(result).not.toContain("__GAS_GLOBALS__");
    expect(result).toContain("function foo() {}");
    expect(result).toContain("function bar() {}");
  });

  it("strips export keywords from declarations", () => {
    const input = `export function foo() {}
export const bar = 1;
export class Baz {}
`;
    const result = postProcessBundle(input);
    expect(result).toContain("function foo() {}");
    expect(result).toContain("const bar = 1;");
    expect(result).toContain("class Baz {}");
    expect(result).not.toMatch(/^export\s/m);
  });

  it("removes export blocks", () => {
    const input = `function foo() {}
const bar = 1;
export { foo, bar };
`;
    const result = postProcessBundle(input);
    expect(result).not.toContain("export {");
    expect(result).toContain("function foo() {}");
    expect(result).toContain("const bar = 1;");
  });

  it("handles combined markers, exports, and blocks", () => {
    const input = `export function onOpen() {}
export function getData() {}
/* __GAS_GLOBALS__ */ globalThis.__gas_keep__ = [onOpen, getData];
export { onOpen, getData };
`;
    const result = postProcessBundle(input);
    expect(result).not.toContain("export");
    expect(result).not.toContain("__GAS_GLOBALS__");
    expect(result).toContain("function onOpen() {}");
    expect(result).toContain("function getData() {}");
  });

  it("returns code with single trailing newline", () => {
    const input = "function foo() {}\n\n\n";
    const result = postProcessBundle(input);
    expect(result).toBe("function foo() {}\n");
  });

  it("handles empty input", () => {
    const result = postProcessBundle("");
    expect(result).toBe("\n");
  });

  it("passes through code with no exports or markers", () => {
    const input = `function foo() {
  return 1;
}
`;
    const result = postProcessBundle(input);
    expect(result).toBe("function foo() {\n  return 1;\n}\n");
  });

  it("handles indented markers", () => {
    const input = `function foo() {}
  /* __GAS_GLOBALS__ */ globalThis.__gas_keep__ = [foo];
`;
    const result = postProcessBundle(input);
    expect(result).not.toContain("__GAS_GLOBALS__");
    expect(result).toContain("function foo() {}");
  });

  it("removes markers without comment prefix (bundler strips comments)", () => {
    const input = `function foo() {}
globalThis.__gas_keep__ = [foo];
`;
    const result = postProcessBundle(input);
    expect(result).not.toContain("__gas_keep__");
    expect(result).toContain("function foo() {}");
  });

  it("handles markers with multiple names", () => {
    const input = `function a() {}
function b() {}
function c() {}
/* __GAS_GLOBALS__ */ globalThis.__gas_keep__ = [a, b, c];
`;
    const result = postProcessBundle(input);
    expect(result).not.toContain("__gas_keep__");
    expect(result).toContain("function a() {}");
    expect(result).toContain("function b() {}");
    expect(result).toContain("function c() {}");
  });
});
