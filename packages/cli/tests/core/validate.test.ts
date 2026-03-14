import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  isTargetDirEmpty,
  validateBundlerFlag,
  validateProjectName,
  validateTemplateFlag,
} from "../../src/core/validate.js";

describe("validateProjectName", () => {
  it("returns undefined for valid names", () => {
    expect(validateProjectName("my-app")).toBeUndefined();
    expect(validateProjectName("gas.project")).toBeUndefined();
    expect(validateProjectName("app_v2")).toBeUndefined();
    expect(validateProjectName("a123")).toBeUndefined();
  });

  it("returns error for empty string", () => {
    expect(validateProjectName("")).toBe("Project name is required");
  });

  it("returns error for names starting with uppercase", () => {
    expect(validateProjectName("MyApp")).toMatch(/Must start with a lowercase/);
  });

  it("returns error for names starting with a number", () => {
    expect(validateProjectName("1app")).toMatch(/Must start with a lowercase/);
  });

  it("returns error for names with special characters", () => {
    expect(validateProjectName("my app")).toMatch(/Must start with a lowercase/);
    expect(validateProjectName("my@app")).toMatch(/Must start with a lowercase/);
  });
});

describe("validateTemplateFlag", () => {
  it("returns the TemplateId for valid flags", () => {
    expect(validateTemplateFlag("basic")).toBe("basic");
    expect(validateTemplateFlag("webapp")).toBe("webapp");
  });

  it("returns error message for invalid flags", () => {
    const result = validateTemplateFlag("nonexistent");
    expect(result).toContain("Invalid template");
    expect(result).toContain("nonexistent");
    expect(result).toContain("basic");
    expect(result).toContain("webapp");
  });
});

describe("validateBundlerFlag", () => {
  it("returns the BundlerId for valid flags", () => {
    expect(validateBundlerFlag("vite")).toBe("vite");
    expect(validateBundlerFlag("rollup")).toBe("rollup");
    expect(validateBundlerFlag("esbuild")).toBe("esbuild");
    expect(validateBundlerFlag("webpack")).toBe("webpack");
    expect(validateBundlerFlag("bun")).toBe("bun");
  });

  it("returns error message for invalid flags", () => {
    const result = validateBundlerFlag("parcel");
    expect(result).toContain("Invalid bundler");
    expect(result).toContain("parcel");
    expect(result).toContain("vite");
  });
});

describe("isTargetDirEmpty", () => {
  const TMP_BASE = resolve(tmpdir(), ".gas-cli-validate-test");

  afterEach(() => {
    rmSync(TMP_BASE, { recursive: true, force: true });
  });

  it("returns true when directory does not exist", () => {
    expect(isTargetDirEmpty(join(TMP_BASE, "nonexistent"))).toBe(true);
  });

  it("returns true when directory is empty", () => {
    const dir = join(TMP_BASE, "empty");
    mkdirSync(dir, { recursive: true });
    expect(isTargetDirEmpty(dir)).toBe(true);
  });

  it("returns false when directory has files", () => {
    const dir = join(TMP_BASE, "nonempty");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "file.txt"), "content");
    expect(isTargetDirEmpty(dir)).toBe(false);
  });
});
