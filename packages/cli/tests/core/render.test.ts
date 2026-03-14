import { describe, expect, it } from "vitest";
import { renderTemplate } from "../../src/core/render.js";
import type { RenderContext } from "../../src/core/types.js";

const baseContext: RenderContext = {
  projectName: "my-app",
  bundlerConfigFile: "vite.config.ts",
  bundlerImport: "@gas-plugin/unplugin/vite",
  buildCommand: "vite build",
  oauthScopes: '["https://www.googleapis.com/auth/spreadsheets"]',
  globals: '["onOpen"]',
  year: "2026",
};

describe("renderTemplate", () => {
  it("replaces single placeholder", () => {
    expect(renderTemplate("Hello {{projectName}}!", baseContext)).toBe("Hello my-app!");
  });

  it("replaces multiple placeholders", () => {
    const result = renderTemplate("{{projectName}} uses {{buildCommand}}", baseContext);
    expect(result).toBe("my-app uses vite build");
  });

  it("replaces same placeholder multiple times", () => {
    const result = renderTemplate("{{projectName}} and {{projectName}}", baseContext);
    expect(result).toBe("my-app and my-app");
  });

  it("leaves unknown placeholders as-is", () => {
    expect(renderTemplate("{{unknown}} stays", baseContext)).toBe("{{unknown}} stays");
  });

  it("handles empty content", () => {
    expect(renderTemplate("", baseContext)).toBe("");
  });

  it("handles content without placeholders", () => {
    expect(renderTemplate("no placeholders here", baseContext)).toBe("no placeholders here");
  });

  it("handles special characters in values", () => {
    const ctx: RenderContext = {
      ...baseContext,
      projectName: "my-app<>&\"'",
    };
    expect(renderTemplate("{{projectName}}", ctx)).toBe("my-app<>&\"'");
  });

  it("handles JSON values in placeholders", () => {
    const result = renderTemplate("scopes: {{oauthScopes}}", baseContext);
    expect(result).toBe('scopes: ["https://www.googleapis.com/auth/spreadsheets"]');
  });

  it("removes entire line when lone placeholder resolves to empty string", () => {
    const ctx: RenderContext = { ...baseContext, optionalLine: "" };
    const input = "before\n{{optionalLine}}\nafter";
    expect(renderTemplate(input, ctx)).toBe("before\nafter");
  });

  it("removes indented line when lone placeholder resolves to empty string", () => {
    const ctx: RenderContext = { ...baseContext, optionalLine: "" };
    const input = "before\n    {{optionalLine}}\nafter";
    expect(renderTemplate(input, ctx)).toBe("before\nafter");
  });

  it("keeps line when lone placeholder resolves to non-empty string", () => {
    const ctx: RenderContext = { ...baseContext, optionalLine: "    value: true," };
    const input = "before\n{{optionalLine}}\nafter";
    expect(renderTemplate(input, ctx)).toBe("before\n    value: true,\nafter");
  });

  it("removes multiple consecutive empty placeholder lines", () => {
    const ctx: RenderContext = { ...baseContext, a: "", b: "", c: "    keep: true," };
    const input = "start\n{{a}}\n{{b}}\n{{c}}\nend";
    expect(renderTemplate(input, ctx)).toBe("start\n    keep: true,\nend");
  });
});
