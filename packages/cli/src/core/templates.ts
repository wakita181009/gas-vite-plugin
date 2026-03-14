import cliPkg from "../../package.json" with { type: "json" };
import type { BundlerConfig, BundlerId, TemplateDefinition, TemplateId } from "./types.js";

const deps = cliPkg.devDependencies as Record<string, string>;

/** Strip semver range prefixes (^, ~, >=, etc.) to get the bare version. */
function stripRange(version: string): string {
  return version.replace(/^[^\d]*/, "");
}

/** Pick specific keys from the CLI devDependencies, replacing workspace: protocol with latest. */
function pickDeps(...keys: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of keys) {
    const ver = deps[key];
    if (ver) {
      // workspace:* → "latest" for published packages
      result[key] = ver.startsWith("workspace:") ? "latest" : ver;
    }
  }
  return result;
}

/** Bare biome version for $schema URL (e.g. "2.4.7"). */
export const BIOME_VERSION = stripRange(deps["@biomejs/biome"] ?? "2.4.7");

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "basic",
    label: "Basic Script",
    description: "Spreadsheet automation with onOpen trigger",
    sourceDir: "basic",
    oauthScopes: ["https://www.googleapis.com/auth/spreadsheets"],
    globals: ["onOpen"],
    hasHtml: false,
  },
  {
    id: "webapp",
    label: "Web App",
    description: "Web app with doGet/doPost and HTML client",
    sourceDir: "webapp",
    oauthScopes: ["https://www.googleapis.com/auth/script.external_request"],
    globals: ["doGet", "doPost"],
    hasHtml: true,
  },
  {
    id: "library",
    label: "Library",
    description: "Reusable GAS library with exported functions",
    sourceDir: "library",
    oauthScopes: [],
    globals: [],
    hasHtml: false,
  },
];

export const BUNDLERS: BundlerConfig[] = [
  {
    id: "vite",
    label: "Vite",
    configFile: "vite.config.ts",
    importPath: "@gas-plugin/unplugin/vite",
    devDependencies: pickDeps("vite", "@gas-plugin/unplugin"),
    buildCommand: "vite build",
  },
  {
    id: "rollup",
    label: "Rollup",
    configFile: "rollup.config.mjs",
    importPath: "@gas-plugin/unplugin/rollup",
    devDependencies: pickDeps("rollup", "@rollup/plugin-typescript", "@gas-plugin/unplugin"),
    buildCommand: "rollup -c",
  },
  {
    id: "esbuild",
    label: "esbuild",
    configFile: "esbuild.config.mjs",
    importPath: "@gas-plugin/unplugin/esbuild",
    devDependencies: pickDeps("esbuild", "@gas-plugin/unplugin"),
    buildCommand: "node esbuild.config.mjs",
  },
  {
    id: "webpack",
    label: "webpack",
    configFile: "webpack.config.mjs",
    importPath: "@gas-plugin/unplugin/webpack",
    devDependencies: pickDeps("webpack", "webpack-cli", "ts-loader", "@gas-plugin/unplugin"),
    buildCommand: "webpack",
  },
];

export function getTemplate(id: TemplateId): TemplateDefinition | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getBundler(id: BundlerId): BundlerConfig | undefined {
  return BUNDLERS.find((b) => b.id === id);
}
