import { describe, expect, it } from "vitest";

describe("subpath exports", () => {
  it("exports a vite plugin factory from /vite", async () => {
    const mod = await import("../src/vite.js");
    expect(typeof mod.default).toBe("function");
  });

  it("exports a rollup plugin factory from /rollup", async () => {
    const mod = await import("../src/rollup.js");
    expect(typeof mod.default).toBe("function");
  });

  it("exports a webpack plugin factory from /webpack", async () => {
    const mod = await import("../src/webpack.js");
    expect(typeof mod.default).toBe("function");
  });

  it("exports an esbuild plugin factory from /esbuild", async () => {
    const mod = await import("../src/esbuild.js");
    expect(typeof mod.default).toBe("function");
  });

  it("exports a bun plugin factory from /bun", async () => {
    const mod = await import("../src/bun.js");
    expect(typeof mod.default).toBe("function");
  });

  it("exports unplugin factory and types from root", async () => {
    const mod = await import("../src/index.js");
    expect(typeof mod.unpluginFactory).toBe("function");
    expect(typeof mod.unplugin).toBe("object");
    expect(typeof mod.postProcessBundle).toBe("function");
    expect(typeof mod.stripExportKeywords).toBe("function");
    expect(typeof mod.removeExportBlocks).toBe("function");
  });
});
