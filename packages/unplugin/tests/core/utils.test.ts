import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { extractFirstInput, findRootDir, processBundle } from "../../src/core/utils.js";

describe("extractFirstInput", () => {
  it("returns the string when input is a string", () => {
    expect(extractFirstInput("src/main.ts")).toBe("src/main.ts");
  });

  it("returns the first element when input is a string array", () => {
    expect(extractFirstInput(["src/a.ts", "src/b.ts"])).toBe("src/a.ts");
  });

  it("returns .in property when input is an object array", () => {
    expect(extractFirstInput([{ in: "src/entry.ts" }])).toBe("src/entry.ts");
  });

  it("returns the first value when input is a record", () => {
    expect(extractFirstInput({ main: "src/main.ts", utils: "src/utils.ts" })).toBe("src/main.ts");
  });

  it("returns undefined for an empty array", () => {
    expect(extractFirstInput([])).toBeUndefined();
  });

  it("returns undefined for an empty object", () => {
    expect(extractFirstInput({})).toBeUndefined();
  });

  it("returns undefined for null", () => {
    expect(extractFirstInput(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(extractFirstInput(undefined)).toBeUndefined();
  });

  it("returns undefined for a number", () => {
    expect(extractFirstInput(42)).toBeUndefined();
  });
});

describe("findRootDir", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(tmpdir(), `utils-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("finds directory containing the manifest", () => {
    // Create: tempDir/appsscript.json and tempDir/src/main.ts
    writeFileSync(join(tempDir, "appsscript.json"), "{}");
    const srcDir = join(tempDir, "src");
    mkdirSync(srcDir, { recursive: true });
    const filePath = join(srcDir, "main.ts");
    writeFileSync(filePath, "");

    const result = findRootDir(filePath, "appsscript.json");
    expect(result).toBe(tempDir);
  });

  it("finds manifest in ancestor directory", () => {
    // Create: tempDir/appsscript.json and tempDir/src/deep/main.ts
    writeFileSync(join(tempDir, "appsscript.json"), "{}");
    const deepDir = join(tempDir, "src", "deep");
    mkdirSync(deepDir, { recursive: true });
    const filePath = join(deepDir, "main.ts");
    writeFileSync(filePath, "");

    const result = findRootDir(filePath, "appsscript.json");
    expect(result).toBe(tempDir);
  });

  it("falls back to parent of parent when manifest is not found", () => {
    // No manifest anywhere — should return dirname(dirname(filePath))
    const srcDir = join(tempDir, "src");
    mkdirSync(srcDir, { recursive: true });
    const filePath = join(srcDir, "main.ts");
    writeFileSync(filePath, "");

    const result = findRootDir(filePath, "nonexistent-manifest.json");
    expect(result).toBe(tempDir);
  });
});

describe("processBundle", () => {
  it("post-processes chunk code", () => {
    const bundle = {
      "main.js": {
        type: "chunk",
        code: "export function hello() {}\nexport { hello };\n",
      },
    };

    processBundle(bundle);

    expect(bundle["main.js"].code).toBe("function hello() {}\n");
  });

  it("skips non-chunk entries", () => {
    const bundle = {
      "style.css": {
        type: "asset",
        source: "body { color: red; }",
      },
    };

    processBundle(bundle);

    // Asset should remain unchanged
    expect((bundle["style.css"] as { source: string }).source).toBe("body { color: red; }");
  });

  it("skips chunks without code", () => {
    const bundle = {
      "empty.js": {
        type: "chunk",
      },
    };

    // Should not throw
    processBundle(bundle);
    expect(bundle["empty.js"]).toEqual({ type: "chunk" });
  });

  it("processes multiple chunks", () => {
    const bundle = {
      "a.js": {
        type: "chunk",
        code: "export function a() {}\n",
      },
      "b.js": {
        type: "chunk",
        code: "export const b = 1;\n",
      },
    };

    processBundle(bundle);

    expect(bundle["a.js"].code).toBe("function a() {}\n");
    expect(bundle["b.js"].code).toBe("const b = 1;\n");
  });
});
