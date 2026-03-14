import { describe, expect, it } from "vitest";
import {
  BIOME_VERSION,
  BUNDLERS,
  getBundler,
  getTemplate,
  pickDeps,
  TEMPLATES,
} from "../../src/core/templates.js";

describe("TEMPLATES registry", () => {
  it("has 2 templates", () => {
    expect(TEMPLATES).toHaveLength(2);
  });

  it("all templates have required fields", () => {
    for (const t of TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.label).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.sourceDir).toBeTruthy();
      expect(Array.isArray(t.oauthScopes)).toBe(true);
      expect(Array.isArray(t.globals)).toBe(true);
      expect(typeof t.hasHtml).toBe("boolean");
    }
  });

  it("basic template has spreadsheet scope", () => {
    const basic = getTemplate("basic");
    expect(basic?.oauthScopes).toContain("https://www.googleapis.com/auth/spreadsheets");
    expect(basic?.globals).toContain("onOpen");
    expect(basic?.hasHtml).toBe(false);
  });

  it("webapp template has HTML and doGet/doPost globals", () => {
    const webapp = getTemplate("webapp");
    expect(webapp?.hasHtml).toBe(true);
    expect(webapp?.globals).toContain("doGet");
    expect(webapp?.globals).toContain("doPost");
  });
});

describe("getTemplate", () => {
  it("returns correct template by id", () => {
    expect(getTemplate("basic")?.id).toBe("basic");
    expect(getTemplate("webapp")?.id).toBe("webapp");
  });

  it("returns undefined for invalid id", () => {
    // biome-ignore lint/suspicious/noExplicitAny: testing invalid input
    expect(getTemplate("invalid" as any)).toBeUndefined();
  });
});

describe("BIOME_VERSION", () => {
  it("is a valid semver string", () => {
    expect(BIOME_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("BUNDLERS registry", () => {
  it("has 5 bundlers", () => {
    expect(BUNDLERS).toHaveLength(5);
  });

  it("all bundlers have required fields", () => {
    for (const b of BUNDLERS) {
      expect(b.id).toBeTruthy();
      expect(b.label).toBeTruthy();
      expect(b.configFile).toBeTruthy();
      expect(b.importPath).toMatch(/^@gas-plugin\/unplugin\//);
      expect(b.buildCommand).toBeTruthy();
      expect(typeof b.devDependencies).toBe("object");
    }
  });
});

describe("pickDeps", () => {
  it("picks existing dependencies from package.json", () => {
    const result = pickDeps("vite");
    expect(result).toHaveProperty("vite");
    expect(result.vite).toMatch(/^\^?\d/);
  });

  it("skips non-existent dependency keys", () => {
    const result = pickDeps("nonExistentPackage");
    expect(result).toEqual({});
  });

  it("replaces workspace: protocol with latest", () => {
    const result = pickDeps("@gas-plugin/unplugin");
    expect(result["@gas-plugin/unplugin"]).toBe("latest");
  });
});

describe("getBundler", () => {
  it("returns correct bundler by id", () => {
    expect(getBundler("vite")?.configFile).toBe("vite.config.ts");
    expect(getBundler("rollup")?.configFile).toBe("rollup.config.mjs");
    expect(getBundler("esbuild")?.configFile).toBe("esbuild.config.mjs");
    expect(getBundler("webpack")?.configFile).toBe("webpack.config.mjs");
    expect(getBundler("bun")?.configFile).toBe("bun.build.ts");
  });

  it("returns undefined for invalid id", () => {
    // biome-ignore lint/suspicious/noExplicitAny: testing invalid input
    expect(getBundler("invalid" as any)).toBeUndefined();
  });
});
