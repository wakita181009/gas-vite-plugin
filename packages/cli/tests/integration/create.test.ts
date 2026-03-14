import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { scaffold } from "../../src/core/scaffold.js";
import type { ScaffoldOptions } from "../../src/core/types.js";

function makeOptions(tempDir: string, overrides?: Partial<ScaffoldOptions>): ScaffoldOptions {
  return {
    projectName: "test-project",
    template: "basic",
    bundler: "vite",
    installDeps: false,
    clasp: false,
    packageManager: "npm",
    targetDir: join(tempDir, "test-project"),
    ...overrides,
  };
}

describe("scaffold - basic template + vite", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "gas-cli-test-create-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("creates project directory", async () => {
    const opts = makeOptions(tempDir);
    await scaffold(opts);
    expect(existsSync(opts.targetDir)).toBe(true);
  });

  it("generates src/index.ts", async () => {
    const opts = makeOptions(tempDir);
    await scaffold(opts);
    const content = readFileSync(join(opts.targetDir, "src/index.ts"), "utf-8");
    expect(content).toContain("test-project");
    expect(content).toContain("onOpen");
  });

  it("generates vite.config.ts with correct plugin import", async () => {
    const opts = makeOptions(tempDir);
    await scaffold(opts);
    const content = readFileSync(join(opts.targetDir, "vite.config.ts"), "utf-8");
    expect(content).toContain("@gas-plugin/unplugin/vite");
  });

  it("generates package.json with build script and deps", async () => {
    const opts = makeOptions(tempDir);
    await scaffold(opts);
    const pkg = JSON.parse(readFileSync(join(opts.targetDir, "package.json"), "utf-8"));
    expect(pkg.name).toBe("test-project");
    expect(pkg.scripts.build).toBe("vite build");
    expect(pkg.devDependencies).toHaveProperty("vite");
    expect(pkg.devDependencies).toHaveProperty("@gas-plugin/unplugin");
  });

  it("generates appsscript.json with spreadsheet scope", async () => {
    const opts = makeOptions(tempDir);
    await scaffold(opts);
    const manifest = JSON.parse(readFileSync(join(opts.targetDir, "appsscript.json"), "utf-8"));
    expect(manifest.runtimeVersion).toBe("V8");
    expect(manifest.oauthScopes).toContain("https://www.googleapis.com/auth/spreadsheets");
  });

  it("generates tsconfig.json", async () => {
    const opts = makeOptions(tempDir);
    await scaffold(opts);
    expect(existsSync(join(opts.targetDir, "tsconfig.json"))).toBe(true);
  });

  it("generates biome.json with schema version from package.json", async () => {
    const opts = makeOptions(tempDir);
    await scaffold(opts);
    const biome = JSON.parse(readFileSync(join(opts.targetDir, "biome.json"), "utf-8"));
    expect(biome.$schema).toMatch(/^https:\/\/biomejs\.dev\/schemas\/\d+\.\d+\.\d+\/schema\.json$/);
    expect(biome.formatter.indentStyle).toBe("space");
    expect(biome.linter.enabled).toBe(true);
  });

  it("generates .gitignore", async () => {
    const opts = makeOptions(tempDir);
    await scaffold(opts);
    expect(existsSync(join(opts.targetDir, ".gitignore"))).toBe(true);
  });

  it("generates README.md with project name", async () => {
    const opts = makeOptions(tempDir);
    await scaffold(opts);
    const readme = readFileSync(join(opts.targetDir, "README.md"), "utf-8");
    expect(readme).toContain("test-project");
  });
});

describe("scaffold - webapp template", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "gas-cli-test-webapp-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("generates doGet/doPost in src/index.ts", async () => {
    const opts = makeOptions(tempDir, { template: "webapp" });
    await scaffold(opts);
    const content = readFileSync(join(opts.targetDir, "src/index.ts"), "utf-8");
    expect(content).toContain("doGet");
    expect(content).toContain("doPost");
  });

  it("generates client.html", async () => {
    const opts = makeOptions(tempDir, { template: "webapp" });
    await scaffold(opts);
    expect(existsSync(join(opts.targetDir, "src/client.html"))).toBe(true);
  });

  it("includes HTML in bundler config", async () => {
    const opts = makeOptions(tempDir, { template: "webapp" });
    await scaffold(opts);
    const config = readFileSync(join(opts.targetDir, "vite.config.ts"), "utf-8");
    expect(config).toContain("include");
    expect(config).toContain("*.html");
  });

  it("has globals for doGet/doPost in bundler config", async () => {
    const opts = makeOptions(tempDir, { template: "webapp" });
    await scaffold(opts);
    const config = readFileSync(join(opts.targetDir, "vite.config.ts"), "utf-8");
    expect(config).toContain("doGet");
    expect(config).toContain("doPost");
  });

  it("has external_request scope in appsscript.json", async () => {
    const opts = makeOptions(tempDir, { template: "webapp" });
    await scaffold(opts);
    const manifest = JSON.parse(readFileSync(join(opts.targetDir, "appsscript.json"), "utf-8"));
    expect(manifest.oauthScopes).toContain(
      "https://www.googleapis.com/auth/script.external_request",
    );
    expect(manifest.webapp).toBeDefined();
  });
});

describe("scaffold - library template", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "gas-cli-test-library-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("generates exported functions in src/index.ts", async () => {
    const opts = makeOptions(tempDir, { template: "library" });
    await scaffold(opts);
    const content = readFileSync(join(opts.targetDir, "src/index.ts"), "utf-8");
    expect(content).toContain("function");
  });

  it("generates src/types.ts", async () => {
    const opts = makeOptions(tempDir, { template: "library" });
    await scaffold(opts);
    expect(existsSync(join(opts.targetDir, "src/types.ts"))).toBe(true);
  });

  it("has no scopes in appsscript.json", async () => {
    const opts = makeOptions(tempDir, { template: "library" });
    await scaffold(opts);
    const manifest = JSON.parse(readFileSync(join(opts.targetDir, "appsscript.json"), "utf-8"));
    expect(manifest.oauthScopes).toBeUndefined();
  });

  it("has no globals in bundler config", async () => {
    const opts = makeOptions(tempDir, { template: "library" });
    await scaffold(opts);
    const config = readFileSync(join(opts.targetDir, "vite.config.ts"), "utf-8");
    expect(config).not.toContain("globals:");
  });

  it("generates clean bundler config with no empty lines in plugin options", async () => {
    const opts = makeOptions(tempDir, { template: "library" });
    await scaffold(opts);
    const config = readFileSync(join(opts.targetDir, "vite.config.ts"), "utf-8");
    // No empty lines between gasPlugin({ and })
    expect(config).not.toMatch(/gasPlugin\(\{\n\s*\n/);
  });
});

describe("scaffold - clasp integration", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "gas-cli-test-clasp-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("generates .clasp.json when clasp enabled", async () => {
    const opts = makeOptions(tempDir, { clasp: true });
    await scaffold(opts);
    const clasp = JSON.parse(readFileSync(join(opts.targetDir, ".clasp.json"), "utf-8"));
    expect(clasp.rootDir).toBe("dist");
    expect(clasp.scriptId).toBe("<your-script-id>");
  });

  it("uses provided script ID", async () => {
    const opts = makeOptions(tempDir, { clasp: true, scriptId: "ABC123" });
    await scaffold(opts);
    const clasp = JSON.parse(readFileSync(join(opts.targetDir, ".clasp.json"), "utf-8"));
    expect(clasp.scriptId).toBe("ABC123");
  });

  it("generates .claspignore", async () => {
    const opts = makeOptions(tempDir, { clasp: true });
    await scaffold(opts);
    const content = readFileSync(join(opts.targetDir, ".claspignore"), "utf-8");
    expect(content).toContain("node_modules");
    expect(content).toContain("*.ts");
  });

  it("adds deploy scripts to package.json", async () => {
    const opts = makeOptions(tempDir, { clasp: true });
    await scaffold(opts);
    const pkg = JSON.parse(readFileSync(join(opts.targetDir, "package.json"), "utf-8"));
    expect(pkg.scripts.push).toContain("clasp push");
    expect(pkg.scripts.deploy).toContain("clasp deploy");
  });

  it("does not generate clasp files when disabled", async () => {
    const opts = makeOptions(tempDir, { clasp: false });
    await scaffold(opts);
    expect(existsSync(join(opts.targetDir, ".clasp.json"))).toBe(false);
    expect(existsSync(join(opts.targetDir, ".claspignore"))).toBe(false);
  });
});
