import { execSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { scaffold } from "../../src/core/scaffold.js";
import type { ScaffoldOptions } from "../../src/core/types.js";

vi.mock("node:child_process", () => ({
  execSync: vi.fn(() => Buffer.from("")),
}));

const mockedExecSync = vi.mocked(execSync);

function makeOptions(targetDir: string, overrides?: Partial<ScaffoldOptions>): ScaffoldOptions {
  return {
    projectName: "test-project",
    template: "basic",
    bundler: "vite",
    installDeps: false,
    clasp: false,
    packageManager: "npm",
    targetDir,
    ...overrides,
  };
}

describe("scaffold edge cases", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "gas-cli-scaffold-test-"));
    mockedExecSync.mockClear();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("throws for invalid template", async () => {
    const opts = makeOptions(join(tempDir, "bad"), {
      // biome-ignore lint/suspicious/noExplicitAny: testing invalid input
      template: "nonexistent" as any,
    });
    await expect(scaffold(opts)).rejects.toThrow("Invalid template");
  });

  it("throws for invalid bundler", async () => {
    const opts = makeOptions(join(tempDir, "bad"), {
      // biome-ignore lint/suspicious/noExplicitAny: testing invalid input
      bundler: "nonexistent" as any,
    });
    await expect(scaffold(opts)).rejects.toThrow("Invalid template");
  });

  it("runs package manager install when installDeps is true", async () => {
    const opts = makeOptions(join(tempDir, "install-test"), {
      installDeps: true,
      packageManager: "npm",
    });

    await scaffold(opts);

    expect(mockedExecSync).toHaveBeenCalledWith(
      "npm install",
      expect.objectContaining({ cwd: opts.targetDir }),
    );
  });
});
