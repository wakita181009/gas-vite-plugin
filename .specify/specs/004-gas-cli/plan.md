# Implementation Plan: GAS CLI - Extensible CLI Tool

**Branch**: `004-gas-cli` | **Date**: 2026-03-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-gas-cli/spec.md`

## Summary

Build `@gas-plugin/cli`, an extensible CLI tool for scaffolding Google Apps Script projects. The initial release focuses on a `create` subcommand that generates fully configured, buildable GAS projects with template selection (basic script, web app, library), bundler selection (Vite, Rollup, esbuild, webpack), and optional clasp integration. Built with `citty` (unjs) for subcommand routing and `@clack/prompts` for interactive prompts, published as a new package in the existing pnpm monorepo.

The `npm create @gas-plugin` shorthand (`@gas-plugin/create` wrapper) is deferred — can be added later as a thin wrapper without breaking changes. Initial release uses `npx @gas-plugin/cli create` only.

## Technical Context

**Language/Version**: TypeScript 5.x, ES2022 target, Node.js 20+
**Primary Dependencies**: `citty` ^0.2.1 (CLI framework, subcommand routing), `@clack/prompts` ^1.1.0 (interactive prompts)
**Storage**: N/A (file-system only — template copy + string substitution)
**Testing**: Vitest (consistent with `packages/unplugin`), unit + integration tests
**Test Coverage**: Minimum 80% line coverage required. Use Vitest's `c8`/`v8` coverage provider with threshold enforcement in CI.
**Target Platform**: Node.js 20+ (Linux, macOS, Windows)
**Project Type**: CLI tool (published npm package)
**Performance Goals**: Scaffolding completes in <5 seconds on a cold run (no network for templates)
**Constraints**: Templates bundled locally (no network required for scaffolding), offline-capable
**Scale/Scope**: 3 template types × 4 bundlers = 12 combinations; extensible subcommand architecture

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Minimalism | **PASS** | CLI is a new package, not modifying the unplugin core. Scaffolding is a distinct concern. |
| II. V8 Runtime Assumed | **PASS** | Generated templates target V8 runtime. The CLI itself runs on Node.js. |
| III. Universal Bundler Support | **PASS** | Templates generate configs for all supported bundlers (Vite, Rollup, esbuild, webpack). |
| IV. ESM Output | **PASS** | CLI package ships as ESM only, consistent with unplugin package. |
| V. Test-First with Coverage | **PASS** | Plan includes unit tests for pure functions (template rendering, arg parsing) and integration tests for end-to-end create command. 80%+ overall coverage target. |
| VI. Strict Code Quality via Biome | **PASS** | Inherits root `biome.json` configuration. No exceptions needed. |
| Two runtime deps limit | **JUSTIFIED** | CLI package introduces `citty` + `@clack/prompts` as its own dependencies. These are CLI-specific concerns, separate from the unplugin package's dependency budget. |
| No AST parsing | **PASS** | Templates use plain string substitution (`{{placeholder}}`), no AST. |

**Gate result: PASS** — No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/004-gas-cli/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── cli-interface.md # CLI public interface contract
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/
  cli/                              # @gas-plugin/cli (published to npm)
    src/
      index.ts                      # Main CLI entry, subcommand router
      commands/
        create.ts                   # `create` subcommand definition
      core/
        scaffold.ts                 # Orchestrates scaffolding pipeline
        templates.ts                # Template registry + file copy logic
        render.ts                   # String substitution engine ({{var}} → value)
        detect.ts                   # Package manager detection
        git.ts                      # Git init + .gitignore generation
        types.ts                    # Shared type definitions
      templates/
        basic/                      # Basic script template files
        webapp/                     # Web app template files
        library/                    # Library template files
        shared/                     # Shared files across templates (tsconfig, biome, etc.)
    tests/
      core/
        render.test.ts              # Unit: string substitution
        templates.test.ts           # Unit: template registry + resolution
        detect.test.ts              # Unit: package manager detection
        scaffold.test.ts            # Unit: scaffolding pipeline (mocked fs)
        git.test.ts                 # Unit: git init logic
      integration/
        create.test.ts              # Integration: end-to-end create in temp dirs
        bundlers.test.ts            # Integration: each bundler config generates correctly
        non-interactive.test.ts     # Integration: flag-based non-interactive mode
    package.json
    tsconfig.json
    vite.config.ts                  # Build config (Vite library mode)

```

**Structure Decision**: Single `packages/cli` package with extensible subcommand architecture. `@gas-plugin/create` wrapper for `npm create @gas-plugin` is deferred — can be added later as a 5-line thin wrapper without breaking changes.

## Test Strategy

### Framework & Configuration
- **Test runner**: Vitest (consistent with `packages/unplugin`)
- **Coverage**: `v8` provider, thresholds: `{ lines: 80, functions: 80, branches: 80, statements: 80 }`

### Test Structure

| Layer | Scope | Examples |
|-------|-------|---------|
| **Unit** (`tests/core/`) | Pure functions in isolation | `render.test.ts`: placeholder substitution, edge cases (missing vars, nested). `detect.test.ts`: lockfile → PM mapping. `templates.test.ts`: registry lookup, file listing. |
| **Integration** (`tests/integration/`) | End-to-end create command | `create.test.ts`: run create in temp dir, verify file structure. `bundlers.test.ts`: each bundler generates correct config. `non-interactive.test.ts`: all flags, no prompts. |
| **Build verification** (CI) | Generated projects build | Representative combos (basic+vite, webapp+rollup, library+esbuild) `npm install && npm run build` in CI. |

### Coverage by User Story

| User Story | Test Coverage |
|------------|--------------|
| US1: Create from template | Integration: create in temp dir, verify structure, build succeeds |
| US2: Choose bundler | Integration: each bundler option produces correct config file + dependency |
| US3: Choose template | Unit: template registry returns correct files per type. Integration: each template scaffolds correctly |
| US4: Non-interactive | Integration: all flags bypass prompts, output matches interactive |
| US5: clasp integration | Unit: clasp file generation. Integration: opt-in/opt-out verification |

## Complexity Tracking

> No constitution violations requiring justification.
