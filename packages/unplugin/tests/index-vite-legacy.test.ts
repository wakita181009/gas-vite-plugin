import { describe, expect, it, vi } from "vitest";

// Mock node:module to control detectViteMajor behavior
vi.mock("node:module", () => ({
  createRequire: vi.fn(),
}));

import { createRequire } from "node:module";
import { unpluginFactory } from "../src";

const mockedCreateRequire = vi.mocked(createRequire);

type ViteConfig = { config: (config: Record<string, unknown>) => unknown };

function getViteConfig() {
  const plugin = unpluginFactory();
  return (plugin.vite as unknown as ViteConfig).config;
}

describe("Vite legacy config (Vite < 8)", () => {
  it("returns rollupOptions-based config for Vite 5", () => {
    mockedCreateRequire.mockReturnValue(
      vi.fn().mockReturnValue({ version: "5.4.0" }) as unknown as NodeRequire,
    );

    const config = getViteConfig();
    const result = config({});
    const build = (result as { build: Record<string, unknown> }).build;

    expect(build.minify).toBe(false);
    expect(build).toHaveProperty("rollupOptions");
    expect(build).not.toHaveProperty("rolldownOptions");
  });

  it("sets inlineDynamicImports when no lib and no array input", () => {
    mockedCreateRequire.mockReturnValue(
      vi.fn().mockReturnValue({ version: "6.0.0" }) as unknown as NodeRequire,
    );

    const config = getViteConfig();
    const result = config({ build: {} });
    const build = (result as { build: Record<string, unknown> }).build;
    const rollupOutput = (build.rollupOptions as Record<string, unknown>).output as Record<
      string,
      unknown
    >;

    expect(rollupOutput.inlineDynamicImports).toBe(true);
  });

  it("does not set inlineDynamicImports when lib is set", () => {
    mockedCreateRequire.mockReturnValue(
      vi.fn().mockReturnValue({ version: "5.4.0" }) as unknown as NodeRequire,
    );

    const config = getViteConfig();
    const result = config({
      build: {
        lib: { entry: "src/main.ts" },
        rollupOptions: { output: { format: "es" } },
      },
    });
    const build = (result as { build: Record<string, unknown> }).build;
    const rollupOutput = (build.rollupOptions as Record<string, unknown>).output as Record<
      string,
      unknown
    >;

    expect(rollupOutput.inlineDynamicImports).toBeUndefined();
  });

  it("does not set inlineDynamicImports when input is an array", () => {
    mockedCreateRequire.mockReturnValue(
      vi.fn().mockReturnValue({ version: "5.4.0" }) as unknown as NodeRequire,
    );

    const config = getViteConfig();
    const result = config({
      build: {
        rollupOptions: { input: ["src/a.ts", "src/b.ts"] },
      },
    });
    const build = (result as { build: Record<string, unknown> }).build;
    const rollupOutput = (build.rollupOptions as Record<string, unknown>).output as Record<
      string,
      unknown
    >;

    expect(rollupOutput.inlineDynamicImports).toBeUndefined();
  });

  it("falls back to version detection by rolldownOptions when require fails", () => {
    mockedCreateRequire.mockReturnValue(
      vi.fn().mockImplementation(() => {
        throw new Error("Cannot find module");
      }) as unknown as NodeRequire,
    );

    const config = getViteConfig();

    // No rolldownOptions → fallback returns 5 → legacy config path
    const result = config({ build: {} });
    const build = (result as { build: Record<string, unknown> }).build;
    expect(build).toHaveProperty("rollupOptions");
    expect(build).not.toHaveProperty("rolldownOptions");
  });

  it("falls back to Vite 8 when require fails and rolldownOptions exists", () => {
    mockedCreateRequire.mockReturnValue(
      vi.fn().mockImplementation(() => {
        throw new Error("Cannot find module");
      }) as unknown as NodeRequire,
    );

    const config = getViteConfig();

    // rolldownOptions present → fallback returns 8 → Vite 8 config path
    const result = config({ build: { rolldownOptions: {} } });
    const build = (result as { build: Record<string, unknown> }).build;
    expect(build).toHaveProperty("rolldownOptions");
  });
});
