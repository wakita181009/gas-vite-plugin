import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import * as p from "@clack/prompts";
import { defineCommand } from "citty";
import { detectPackageManager } from "../core/detect.js";
import { scaffold } from "../core/scaffold.js";
import { BUNDLERS, TEMPLATES } from "../core/templates.js";
import type { BundlerId, ScaffoldOptions, TemplateId } from "../core/types.js";

function cancelAndExit(message = "Operation cancelled.", code = 1): never {
  p.cancel(message);
  process.exit(code);
}

async function resolveProjectName(name: string | undefined, useDefaults: boolean): Promise<string> {
  if (name) return name;
  if (useDefaults) return "my-gas-app";
  const result = await p.text({
    message: "Project name:",
    placeholder: "my-gas-app",
    validate: (value) => {
      if (!value) return "Project name is required";
      if (!/^[a-z][a-z0-9._-]*$/.test(value)) {
        return "Must start with a lowercase letter and contain only lowercase letters, numbers, hyphens, dots, or underscores";
      }
    },
  });
  if (p.isCancel(result)) cancelAndExit();
  return result;
}

async function resolveTemplate(
  flag: string | undefined,
  useDefaults: boolean,
): Promise<TemplateId> {
  if (flag) {
    const valid = TEMPLATES.map((t) => t.id);
    if (!valid.includes(flag as TemplateId)) {
      cancelAndExit(`Invalid template: "${flag}". Available: ${valid.join(", ")}`, 2);
    }
    return flag as TemplateId;
  }
  if (useDefaults) return "basic";
  const result = await p.select({
    message: "Select a template:",
    options: TEMPLATES.map((t) => ({
      value: t.id,
      label: t.label,
      hint: t.description,
    })),
  });
  if (p.isCancel(result)) cancelAndExit();
  return result;
}

async function resolveBundler(flag: string | undefined, useDefaults: boolean): Promise<BundlerId> {
  if (flag) {
    const valid = BUNDLERS.map((b) => b.id);
    if (!valid.includes(flag as BundlerId)) {
      cancelAndExit(`Invalid bundler: "${flag}". Available: ${valid.join(", ")}`, 2);
    }
    return flag as BundlerId;
  }
  if (useDefaults) return "vite";
  const result = await p.select({
    message: "Select a bundler:",
    options: BUNDLERS.map((b) => ({
      value: b.id,
      label: b.label,
    })),
  });
  if (p.isCancel(result)) cancelAndExit();
  return result;
}

async function resolveConfirm(
  flagValue: boolean,
  skipPrompt: boolean,
  message: string,
  initialValue: boolean,
): Promise<boolean> {
  if (skipPrompt) return flagValue;
  const result = await p.confirm({ message, initialValue });
  if (p.isCancel(result)) cancelAndExit();
  return result;
}

async function checkTargetDir(
  targetDir: string,
  projectName: string,
  force: boolean,
  useDefaults: boolean,
): Promise<void> {
  if (!existsSync(targetDir) || readdirSync(targetDir).length === 0) return;
  if (force) return;
  if (useDefaults) {
    cancelAndExit(`Target directory "${projectName}" is not empty. Use --force to overwrite.`, 3);
  }
  const overwrite = await p.confirm({
    message: `Directory "${projectName}" is not empty. Overwrite?`,
    initialValue: false,
  });
  if (p.isCancel(overwrite) || !overwrite) {
    cancelAndExit("Operation cancelled.", 3);
  }
}

export default defineCommand({
  meta: {
    name: "create",
    description: "Scaffold a new Google Apps Script project",
  },
  args: {
    name: {
      type: "positional",
      description: "Project name",
      required: false,
    },
    template: {
      type: "string",
      alias: "t",
      description: "Template: basic | webapp | library",
    },
    bundler: {
      type: "string",
      alias: "b",
      description: "Bundler: vite | rollup | esbuild | webpack",
    },
    install: {
      type: "boolean",
      description: "Install dependencies after scaffolding",
      default: true,
    },
    clasp: {
      type: "boolean",
      description: "Include clasp configuration files",
      default: false,
    },
    "script-id": {
      type: "string",
      description: "GAS Script ID for .clasp.json (requires --clasp)",
    },
    force: {
      type: "boolean",
      description: "Overwrite target directory without confirmation",
      default: false,
    },
    yes: {
      type: "boolean",
      alias: "y",
      description: "Use default values for all prompts",
      default: false,
    },
  },
  async run({ args }) {
    p.intro("Create a new GAS project");

    const useDefaults = args.yes;
    const projectName = await resolveProjectName(args.name, useDefaults);
    const templateId = await resolveTemplate(args.template, useDefaults);
    const bundlerId = await resolveBundler(args.bundler, useDefaults);
    const installDeps = await resolveConfirm(
      args.install,
      useDefaults,
      "Install dependencies?",
      true,
    );
    const clasp = await resolveConfirm(
      args.clasp,
      useDefaults || args.clasp,
      "Include clasp configuration?",
      false,
    );
    const scriptId = args["script-id"];
    const targetDir = resolve(process.cwd(), projectName);

    await checkTargetDir(targetDir, projectName, args.force, useDefaults);

    const options: ScaffoldOptions = {
      projectName,
      template: templateId,
      bundler: bundlerId,
      installDeps,
      clasp,
      scriptId,
      packageManager: detectPackageManager(),
      targetDir,
    };

    const s = p.spinner();
    s.start("Scaffolding project...");

    try {
      await scaffold(options);
      s.stop("Project scaffolded!");
    } catch (error) {
      s.stop("Scaffolding failed.");
      throw error;
    }

    const pm = options.packageManager;
    p.log.step("Next steps:");
    p.log.message(`  cd ${projectName}`);
    if (!installDeps) {
      p.log.message(`  ${pm} install`);
    }
    p.log.message(`  ${pm} run build`);
    if (clasp) {
      p.log.message(`  clasp login`);
      p.log.message(`  ${pm} run push`);
    }

    p.outro("Happy scripting!");
  },
});
