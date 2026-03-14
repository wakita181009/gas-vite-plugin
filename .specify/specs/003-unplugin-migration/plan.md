# Implementation Plan: Universal GAS Plugin with unplugin

**Branch**: `003-unplugin-migration` | **Date**: 2026-03-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-unplugin-migration/spec.md`

## Summary

Migrate the existing `gas-vite-plugin` to use `unplugin`, creating `@gas-plugin/unplugin` — a single package with subpath exports (`/vite`, `/rollup`, `/webpack`, `/esbuild`, `/bun`) that provides GAS-compatible builds across multiple bundlers. The existing pure transform modules (transforms.ts, include.ts, globals.ts) are reused unchanged. The Vite-specific hooks are mapped to a two-tier approach: universal hooks for bundler-agnostic operations (transform, file copy) and framework-specific hooks for post-bundle processing (export stripping).

## Technical Context

**Language/Version**: TypeScript 5.x, ES2022 target, Node.js 20+
**Primary Dependencies**: `unplugin` (core), `tinyglobby` (glob resolution)
**Storage**: N/A (build plugin, no persistence)
**Testing**: Vitest — unit tests for pure modules, integration tests per bundler
**Test Coverage**: 100% on pure transform modules (transforms.ts, include.ts, globals.ts, post-process.ts). 80%+ overall.
**Target Platform**: Node.js 20+ (bundler plugin)
**Project Type**: Library (npm package with subpath exports)
**Performance Goals**: Plugin should add <500ms overhead to any bundler build
**Constraints**: Regex-only transforms (no AST parser per constitution), V8 runtime assumed
**Scale/Scope**: Single package, 5 bundler adapters, ~10 source files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Minimalism | PASS | Plugin still only bridges bundler→GAS gap. No new transforms added. |
| II. V8 Runtime | PASS | No change — output still targets V8. |
| III. Vite-Native → Multi-Bundler | AMENDMENT NEEDED | Constitution says "Vite-Native Integration". This feature explicitly extends beyond Vite. Constitution must be updated to reflect multi-bundler support via unplugin. |
| IV. Dual Output | PASS | Package ships ESM + CJS with types via subpath exports. |
| V. Test-First 100% | PASS | Pure modules keep 100% coverage. Integration tests added per bundler. |
| VI. Biome | PASS | Same Biome config applies to new package. |

**Amendment Required**: Constitution Principle III needs updating from "Vite-Native Integration" to "Multi-Bundler Integration via unplugin". This is the explicit purpose of this feature.

### Post-Phase 1 Re-check

| Principle | Status | Notes |
|-----------|--------|-------|
| III. Multi-Bundler | PASS (with amendment) | Design uses unplugin universals where possible, framework-specific hooks where needed. Consistent with minimalism. |
| Architecture Constraints | PASS | Core separation maintained. Pure functions unchanged. One new dependency (unplugin). |

## Project Structure

### Documentation (this feature)

```text
specs/003-unplugin-migration/
├── plan.md              # This file
├── research.md          # Phase 0: hook mapping, per-bundler strategies
├── data-model.md        # Phase 1: entities, module structure
├── quickstart.md        # Phase 1: dev setup guide
├── contracts/
│   └── public-api.md    # Phase 1: package exports, options interface
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── unplugin/                     # NEW: @gas-plugin/unplugin
│   ├── src/
│   │   ├── index.ts              # createUnplugin factory + universal hooks
│   │   ├── types.ts              # GasPluginOptions (ported unchanged)
│   │   ├── transforms.ts         # stripExportKeywords, removeExportBlocks (ported unchanged)
│   │   ├── include.ts            # resolveIncludeFiles, copyFilesFlat (ported unchanged)
│   │   ├── globals.ts            # detectNamesToProtect (ported unchanged)
│   │   ├── post-process.ts       # NEW: postProcessBundle (export strip + marker cleanup on string)
│   │   ├── vite.ts               # Subpath: unplugin.vite export
│   │   ├── rollup.ts             # Subpath: unplugin.rollup export
│   │   ├── webpack.ts            # Subpath: unplugin.webpack export
│   │   ├── esbuild.ts            # Subpath: unplugin.esbuild export
│   │   └── bun.ts                # Subpath: unplugin.bun export
│   ├── tests/
│   │   ├── transforms.test.ts    # Ported from gas-vite-plugin (unchanged)
│   │   ├── include.test.ts       # Ported from gas-vite-plugin (unchanged)
│   │   ├── globals.test.ts       # Ported from gas-vite-plugin (unchanged)
│   │   ├── post-process.test.ts  # NEW: unit tests
│   │   └── integration/
│   │       ├── helpers.ts        # Shared test infra (adapted from gas-vite-plugin)
│   │       ├── vite.test.ts      # Ported from gas-vite-plugin integration tests
│   │       ├── rollup.test.ts    # NEW
│   │       ├── webpack.test.ts   # NEW
│   │       ├── esbuild.test.ts   # NEW
│   │       └── bun.test.ts       # NEW
│   ├── package.json              # Subpath exports, optional peer deps
│   ├── tsconfig.json
│   ├── vitest.config.ts          # 100% coverage on pure modules
│   └── README.md
│
├── gas-vite-plugin/              # EXISTING: to be deprecated/removed
│
apps/
├── gas-script/                   # UPDATE: import from @gas-plugin/unplugin/vite
└── gas-webapp/                   # UPDATE: import from @gas-plugin/unplugin/vite
```

**Structure Decision**: New `packages/unplugin/` alongside existing `packages/gas-vite-plugin/`. Pure modules (transforms, include, globals) are copied (not symlinked) to maintain independence. After validation, `gas-vite-plugin` directory can be removed.

## Architecture: Hook Flow Per Bundler

### Universal Hooks (all bundlers)

```
transform(code, id)
  → filter: JS/TS only, exclude virtual modules
  → detectNamesToProtect(code, globals, autoGlobals)
  → inject globalThis.__gas_keep__ = [...]

writeBundle()
  → copy appsscript.json to outDir
  → resolveIncludeFiles(include, rootDir)
  → copyFilesFlat(files, outDir)
```

### Post-Bundle Export Stripping (per-bundler)

```
Vite/Rollup: generateBundle(_, bundle)
  → for each chunk: postProcessBundle(chunk.code)
  → stripExportKeywords + removeExportBlocks + marker cleanup

webpack: webpack(compiler) → compilation.processAssets
  → for each asset: postProcessBundle(source.toString())

esbuild/Bun: writeBundle()
  → read output JS files from outDir
  → postProcessBundle(content)
  → write back
```

### Root/OutDir Resolution (per-bundler)

```
Vite:    configResolved(config) → config.root, config.build.outDir
Rollup:  outputOptions(options) → options.dir
webpack: compiler.options.context, compiler.options.output.path
esbuild: build.initialOptions.outdir
Bun:     build.config.outdir
```

## Test Strategy

### Unit Tests (100% coverage required)

| Module | Test File | What's Tested |
|--------|-----------|---------------|
| transforms.ts | transforms.test.ts | stripExportKeywords, removeExportBlocks — all edge cases (ported unchanged) |
| include.ts | include.test.ts | resolveIncludeFiles, copyFilesFlat — glob resolution, flat copy, duplicates (ported unchanged) |
| globals.ts | globals.test.ts | detectNamesToProtect — explicit globals, autoGlobals, escaping (ported unchanged) |
| post-process.ts | post-process.test.ts | postProcessBundle — combined export strip + marker cleanup on raw strings |

### Integration Tests (per bundler)

| Bundler | Test File | Scenarios |
|---------|-----------|-----------|
| Vite | vite.test.ts | All existing tests ported: basic build, exports, globals, include, webapp |
| Rollup | rollup.test.ts | Basic build, export stripping, globals protection, include copy, manifest |
| webpack | webpack.test.ts | Basic build, export stripping, globals protection, manifest |
| esbuild | esbuild.test.ts | Basic build, export stripping, manifest copy |
| Bun | bun.test.ts | Basic build, export stripping, manifest copy, graceful degradation |

### Coverage Requirements

```
Pure modules (transforms, include, globals, post-process): 100%
Overall package: 80%+
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Constitution Principle III amendment | Feature explicitly extends beyond Vite to multiple bundlers | Single-bundler plugin limits adoption and contradicts feature goal |
| Per-bundler post-process strategy | Different bundlers expose different post-bundle APIs | Unified disk-based approach rejected as less efficient for Vite/Rollup |
