# Research: GAS CLI

**Feature**: 004-gas-cli | **Date**: 2026-03-14

## R1: CLI Framework — citty

**Decision**: Use `citty` ^0.2.1 from unjs ecosystem.

**Rationale**:
- TypeScript-first with deep type inference for parsed args (stronger than commander/yargs chaining APIs)
- Native subcommand support with lazy loading via dynamic imports (code-splitting for future subcommands)
- Uses `node:util.parseArgs` internally (v0.2.0+), replacing `mri`
- Auto-generated help/version, auto-aliasing between camelCase and kebab-case flags
- `enum` arg type produces TypeScript union types at compile time
- Ecosystem alignment: same unjs family as `unplugin` used in the parent project
- ~16.6M weekly npm downloads, 836+ dependents (driven by Nuxt/Nitro ecosystem)

**Alternatives considered**:
- `commander`: Most popular, but chaining API gives weaker TypeScript inference. No lazy subcommand loading.
- `yargs`: Powerful but heavier, complex API surface. Not ESM-first.
- `cac`: Lightweight but no built-in subcommand support or lazy loading.

**Gotchas**:
- Avoid positional args on commands that also have subcommands (routing conflict)
- Known issue (#133): passing args to a main command with both args and subcommands can prevent subcommand execution — use subcommand-level args instead
- Pre-1.0 library; API may evolve but is stable in practice

## R2: Interactive Prompts — @clack/prompts

**Decision**: Use `@clack/prompts` ^1.1.0.

**Rationale**:
- Industry standard adopted by `create-vite` (replaced previous prompting library, reduced bundle size)
- Rich prompt types: `text`, `select`, `multiselect`, `confirm`, `password`, `spinner`, `group`
- TypeScript-first with native types (no `@types/` needed)
- Clean UX with `intro`/`outro` session bookends and structured logging
- `group()` allows referencing earlier answers in subsequent prompts

**Alternatives considered**:
- `inquirer`: Legacy, heavier, not TypeScript-first. Being replaced industry-wide.
- `prompts` (terkelg): Simpler but less polished UX, no TypeScript types shipped.
- `enquirer`: Good UX but less adoption momentum, not used by major scaffolding tools.

**Gotchas**:
- Every prompt returns `Promise<Value | symbol>` — must use `isCancel()` guard after each call for type safety
- No built-in CI/non-interactive mode — must handle ourselves: `process.env.CI || !process.stdin.isTTY`
- Windows CI issue with non-TTY terminals (upstream #192) — test on Windows CI

## R3: `npm create @gas-plugin` Convention — Package Strategy

**Decision**: Single `@gas-plugin/cli` package only. `@gas-plugin/create` wrapper deferred.

**Rationale**:
- `npm create @scope` is hardcoded to resolve to `@scope/create` — would require a separate package
- Initial release uses `npx @gas-plugin/cli create` which is sufficient
- CLI will grow with subcommands (`init`, `deploy`, etc.) — single package is simpler to maintain
- `@gas-plugin/create` can be added later as a 5-line thin wrapper without breaking changes

**Package configuration**:
```jsonc
// @gas-plugin/cli/package.json
{
  "name": "@gas-plugin/cli",
  "bin": { "gas-plugin": "./dist/index.js" }
}
```

**Deferred**: `@gas-plugin/create` wrapper for `npm create @gas-plugin` / `pnpm create @gas-plugin` convenience — add when user demand justifies it.

## R4: Template Rendering Strategy

**Decision**: Plain file copy + `{{placeholder}}` string substitution (no template engine).

**Rationale**:
- Same approach used by `create-vite` and `giget` — proven pattern
- Templates are readable as-is (no special syntax beyond `{{var}}`)
- Zero runtime dependencies for rendering
- Sufficient for the placeholder set: `{{projectName}}`, `{{bundler}}`, `{{bundlerImport}}`, `{{pluginImport}}`, `{{oauthScopes}}`

**Implementation**:
- Walk template directory, copy files to target
- For each file, replace `{{key}}` patterns with values from a context object
- Special handling: `package.json` needs JSON-aware substitution (or pre-formatted strings)
- File/directory renaming: `_gitignore` → `.gitignore` (dotfiles can't be in npm packages)

**Alternatives considered**:
- `handlebars`/`mustache`: Overkill for simple variable substitution. Adds dependency.
- `ejs`: More powerful but templates become unreadable. Not aligned with minimalism principle.
- `liquidjs`: Too heavy for this use case.

## R5: Package Manager Detection

**Decision**: Detect from lockfile presence + `npm_config_user_agent` env var.

**Rationale**:
- `npm_config_user_agent` is set by npm/pnpm/yarn/bun when running scripts — most reliable signal
- Lockfile fallback: `package-lock.json` → npm, `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lockb` → bun
- Default to npm if neither signal is available

**Pattern** (used by `create-vite`):
```typescript
function detectPackageManager(): "npm" | "pnpm" | "yarn" | "bun" {
  const ua = process.env.npm_config_user_agent;
  if (ua?.startsWith("pnpm")) return "pnpm";
  if (ua?.startsWith("yarn")) return "yarn";
  if (ua?.startsWith("bun")) return "bun";
  return "npm";
}
```

## R6: Build Strategy for CLI Package

**Decision**: Use Vite library mode (consistent with `packages/unplugin`).

**Rationale**:
- Same build tooling as the existing `packages/unplugin` package
- Single entry point (`src/index.ts`) for the CLI binary
- Template files copied to `dist/templates/` during build (or bundled as string assets)
- ESM-only output

**Template bundling approach**:
- Include template files in `"files"` field of `package.json` as-is
- Read templates at runtime from `import.meta.url`-relative paths
- Alternative: inline templates as string constants (avoids file path resolution issues, but harder to maintain)
- **Decision**: Ship templates as files in `dist/templates/`, resolve via `import.meta.url` + `fileURLToPath`

## R7: Monorepo Integration

**Decision**: Add `packages/cli` and `packages/create` to the existing pnpm workspace.

**Rationale**:
- `pnpm-workspace.yaml` already includes `packages/*` — new packages are auto-discovered
- Share root `biome.json`, `tsconfig.json` base config
- `@gas-plugin/create` uses `workspace:*` dependency on `@gas-plugin/cli` for local development
- CI pipeline already runs tests for `packages/*` — new packages integrate automatically

**Key integration points**:
- Root `pnpm install` installs all workspace dependencies
- Root `pnpm build` should build CLI package (may need build order: unplugin → cli → create)
- Root `pnpm test` should run CLI tests
