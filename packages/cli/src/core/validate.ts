import { existsSync, readdirSync } from "node:fs";
import { BUNDLERS, TEMPLATES } from "./templates.js";
import type { BundlerId, TemplateId } from "./types.js";

/** Validate a project name. Returns an error message string if invalid, undefined if valid. */
export function validateProjectName(value: string): string | undefined {
  if (!value) return "Project name is required";
  if (!/^[a-z][a-z0-9._-]*$/.test(value)) {
    return "Must start with a lowercase letter and contain only lowercase letters, numbers, hyphens, dots, or underscores";
  }
}

/** Validate a template flag. Returns the TemplateId if valid, or an error message string. */
export function validateTemplateFlag(flag: string): TemplateId | string {
  const valid = TEMPLATES.map((t) => t.id);
  if (valid.includes(flag as TemplateId)) return flag as TemplateId;
  return `Invalid template: "${flag}". Available: ${valid.join(", ")}`;
}

/** Validate a bundler flag. Returns the BundlerId if valid, or an error message string. */
export function validateBundlerFlag(flag: string): BundlerId | string {
  const valid = BUNDLERS.map((b) => b.id);
  if (valid.includes(flag as BundlerId)) return flag as BundlerId;
  return `Invalid bundler: "${flag}". Available: ${valid.join(", ")}`;
}

/** Check if a target directory is empty or does not exist. */
export function isTargetDirEmpty(targetDir: string): boolean {
  return !existsSync(targetDir) || readdirSync(targetDir).length === 0;
}
