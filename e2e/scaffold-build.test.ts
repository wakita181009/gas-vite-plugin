import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { scaffold } from "../packages/cli/src/core/scaffold.js";
import type { ScaffoldOptions } from "../packages/cli/src/core/types.js";

const UNPLUGIN_DIR = resolve(import.meta.dirname, "../packages/unplugin");

function makeOptions(tempDir: string, overrides?: Partial<ScaffoldOptions>): ScaffoldOptions {
  return {
    projectName: "e2e-test-project",
    template: "basic",
    bundler: "vite",
    installDeps: false,
    clasp: false,
    packageManager: "pnpm",
    targetDir: join(tempDir, "e2e-test-project"),
    ...overrides,
  };
}

/** Patch @gas-plugin/unplugin to use the local workspace build instead of npm registry. */
function linkLocalUnplugin(targetDir: string): void {
  const pkgPath = join(targetDir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  pkg.devDependencies["@gas-plugin/unplugin"] = `link:${UNPLUGIN_DIR}`;
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf-8");
}

/** Read the first .js file from dist/ directory. */
function readDistJs(targetDir: string): string {
  const distDir = join(targetDir, "dist");
  const jsFiles = readdirSync(distDir).filter((f) => f.endsWith(".js"));
  if (jsFiles.length === 0) throw new Error(`No .js files in ${distDir}`);
  return readFileSync(join(distDir, jsFiles[0]), "utf-8");
}

function installAndBuild(targetDir: string): void {
  execSync("pnpm install --no-frozen-lockfile", { cwd: targetDir, stdio: "pipe" });
  execSync("pnpm run build", { cwd: targetDir, stdio: "pipe" });
}

describe("E2E: scaffold → install → build", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "gas-e2e-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("basic + vite: produces valid GAS output", async () => {
    const opts = makeOptions(tempDir);
    await scaffold(opts);
    linkLocalUnplugin(opts.targetDir);
    installAndBuild(opts.targetDir);

    // Output JS exists with exports stripped and GAS function preserved
    const output = readDistJs(opts.targetDir);
    expect(output).not.toMatch(/^export\s/m);
    expect(output).toContain("onOpen");

    // appsscript.json copied to dist
    expect(existsSync(join(opts.targetDir, "dist", "appsscript.json"))).toBe(true);
    const manifest = JSON.parse(
      readFileSync(join(opts.targetDir, "dist", "appsscript.json"), "utf-8"),
    );
    expect(manifest.runtimeVersion).toBe("V8");
  });

  it("webapp + rollup: builds with HTML include and globals", async () => {
    const opts = makeOptions(tempDir, {
      projectName: "e2e-webapp",
      template: "webapp",
      bundler: "rollup",
      targetDir: join(tempDir, "e2e-webapp"),
    });
    await scaffold(opts);
    linkLocalUnplugin(opts.targetDir);
    installAndBuild(opts.targetDir);

    // Output JS with GAS functions, exports stripped
    const output = readDistJs(opts.targetDir);
    expect(output).not.toMatch(/^export\s/m);
    expect(output).toContain("doGet");
    expect(output).toContain("doPost");

    // HTML file copied to dist
    expect(existsSync(join(opts.targetDir, "dist", "client.html"))).toBe(true);

    // appsscript.json with webapp config
    const manifest = JSON.parse(
      readFileSync(join(opts.targetDir, "dist", "appsscript.json"), "utf-8"),
    );
    expect(manifest.webapp).toBeDefined();
  });
});
