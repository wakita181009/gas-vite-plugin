# Implementation Plan: gas-vite-plugin v0.2

**Branch**: `002-gas-vite-plugin-v02` | **Date**: 2026-03-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-gas-vite-plugin-v02/spec.md`

## Summary

Extend gas-vite-plugin with three new options (`include`, `globals`, `autoGlobals`), improve export edge case handling, and add a web app test app. The `include` option copies additional files (HTML, CSS) flat to the output directory for GAS web apps. The `globals` option protects non-exported functions from tree-shaking via `transform` hook injection. Export transforms are extended to handle `export class` declarations.

## Technical Context

**Language/Version**: TypeScript 5.x (compiled via Vite/esbuild)
**Primary Dependencies**: vite >=5.0.0 (peer), tinyglobby (new runtime dep for `include` glob resolution)
**Storage**: N/A (filesystem only — copy files to outDir)
**Testing**: Vitest 4.x with @vitest/coverage-v8
**Test Coverage**: 100% on `transforms.ts`; 80%+ on new modules. Coverage enforced in vitest.config.ts.
**Target Platform**: Node.js 20, 22, 24 (CI matrix)
**Project Type**: Library (Vite plugin)
**Performance Goals**: N/A (build-time only, runs once per build)
**Constraints**: No AST parser (constitution), regex-based transforms only, zero runtime deps except tinyglobby
**Scale/Scope**: ~200 lines of new source code, ~300 lines of new tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Minimalism | PASS | `include` fills GAS web app gap; `globals` fills tree-shake gap. Neither duplicates Vite functionality. |
| II. V8 Runtime | PASS | No runtime changes — still targets GAS V8. |
| III. Vite-Native | PASS | Uses `transform` (new), `generateBundle` (existing), `closeBundle` (existing) hooks. All standard Vite plugin API. |
| IV. Dual Output | PASS | Plugin itself still ships ES + CJS. No change. |
| V. Test-First | PASS | Plan includes unit + integration tests for all new features. |
| VI. Biome Strict | PASS | All new code follows existing Biome rules. |
| No AST parser | PASS | `typeof <name>;` injection is string concatenation. Export transforms remain regex-based. `export class` regex added. |
| No runtime deps | **JUSTIFIED** | Adding `tinyglobby` as first runtime dependency. Justified: it's already a transitive dep of Vite, lightweight (no native modules), and required for glob pattern resolution. Node.js built-in `fs.glob()` requires Node 22+ which excludes our Node 20 support. |
| Two-file core | PASS | Core remains `index.ts` + `transforms.ts`. New `include.ts` module for file copy logic (separate concern). |
| Minimal options | PASS | Three new options justified by spec requirements. Each has a clear use case. |

### Post-Phase 1 Re-check

| Principle | Status | Notes |
|-----------|--------|-------|
| No AST parser | PASS | Confirmed: all transforms are regex. `typeof` injection/removal is string manipulation. |
| Two-file core | PASS | `include.ts` is a helper module, not core transform logic. Core remains 2 files. |
| No runtime deps | JUSTIFIED | `tinyglobby` is the only addition. No other runtime deps needed. |

## Project Structure

### Documentation (this feature)

```text
specs/002-gas-vite-plugin-v02/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── plugin-options.ts  # Public API contract
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
packages/gas-vite-plugin/
├── src/
│   ├── index.ts          # Plugin factory + Vite hooks (MODIFIED: add transform, extend generateBundle/closeBundle)
│   ├── transforms.ts     # Pure string transforms (MODIFIED: add stripExportClass)
│   └── include.ts        # NEW: glob resolution + flat file copy logic
├── tests/
│   ├── unit/
│   │   ├── transforms.test.ts   # EXTENDED: export class tests
│   │   └── include.test.ts      # NEW: glob + flat copy unit tests
│   └── integration/
│       ├── build.test.ts        # EXTENDED: backward compat assertions
│       ├── include.test.ts      # NEW: include option integration
│       ├── globals.test.ts      # NEW: globals + autoGlobals integration
│       └── exports.test.ts      # NEW: export edge cases (US4)
├── vitest.config.ts     # MODIFIED: add include.ts to coverage
├── package.json         # MODIFIED: add tinyglobby dependency
└── vite.config.ts       # UNCHANGED

apps/gas-webapp/          # NEW: test app (US5)
├── src/
│   ├── main.ts          # doGet, doPost, getData, saveData
│   ├── index.html       # Client-side HTML
│   └── appsscript.json  # Manifest
├── vite.config.ts       # Uses include + globals options
└── package.json         # workspace:* dep on gas-vite-plugin
```

**Structure Decision**: Extends existing monorepo layout. New `include.ts` module added to `src/` for separation of concerns (glob + copy logic). Test app `apps/gas-webapp` follows same pattern as existing `apps/gas-script`.

## Implementation Phases

### Phase A: Export edge cases (US4) — transforms.ts extension

**Scope**: FR-004 through FR-008

**Changes**:
1. Add `export class` stripping to `stripExportKeywords()` in `transforms.ts`
2. Verify existing patterns handle all US4 scenarios (most already work in v0.1)

**Tests**:
- Unit: Add `export class` test cases to `transforms.test.ts`
- Integration: New `exports.test.ts` with fixture for each pattern

### Phase B: `include` option (US1) — new module + closeBundle extension

**Scope**: FR-001, FR-010

**Changes**:
1. Create `src/include.ts`: `resolveIncludeFiles(patterns, rootDir)` and `copyFilesFlat(files, outDir)`
2. Add `tinyglobby` as production dependency
3. Extend `GasPluginOptions` interface with `include` field
4. Call include logic in `closeBundle` after manifest copy
5. Handle edge cases: dedup, collision warning, files outside root

**Tests**:
- Unit: `include.test.ts` — glob resolution, flat copy, dedup, collision
- Integration: `include.test.ts` — full build with HTML files

### Phase C: `globals` + `autoGlobals` (US2, US3) — transform hook + generateBundle extension

**Scope**: FR-002, FR-003

**Changes**:
1. Add `transform` hook to plugin: inject `typeof <name>;` for each globals entry
2. Extend `generateBundle` to strip `typeof <name>;` injections before export removal
3. Implement `autoGlobals` logic: when `true`, detect exported function names and add to globals list
4. Extend `GasPluginOptions` with `globals` and `autoGlobals` fields

**Tests**:
- Integration: `globals.test.ts` — non-exported function survives, missing function ignored, dedup, autoGlobals toggle

### Phase D: Test app (US5) — apps/gas-webapp

**Scope**: SC-004

**Changes**:
1. Create `apps/gas-webapp/` with doGet/doPost + HTML + server functions
2. Vite config uses `include` and `globals` options
3. Verify build output structure

**Tests**:
- Integration: Build verification in `apps/gas-webapp` test or as part of `include.test.ts`

### Phase E: Backward compatibility verification (FR-009)

**Scope**: SC-005

**Changes**: None — verification only.

**Tests**:
- Extend `build.test.ts` with explicit v0.1-style config assertions
- Verify `apps/gas-script` still builds correctly with no config changes

## Test Strategy

### Framework & Structure

- **Framework**: Vitest 4.x
- **Coverage**: @vitest/coverage-v8
- **Thresholds**: 100% on `transforms.ts`, 100% on `include.ts` (new)

### Test Matrix

| User Story | Unit Tests | Integration Tests | Coverage Target |
|------------|-----------|-------------------|-----------------|
| US1 (include) | `include.test.ts`: glob resolve, flat copy, dedup, collision | `include.test.ts`: full build with HTML/CSS | 100% on `include.ts` |
| US2 (globals) | — (logic lives in plugin hooks) | `globals.test.ts`: non-export survives, missing ignored, dedup | Via integration |
| US3 (autoGlobals) | — (toggle logic in hooks) | `globals.test.ts`: autoGlobals on/off scenarios | Via integration |
| US4 (export edge cases) | `transforms.test.ts`: export class | `exports.test.ts`: all 5 patterns via real build | 100% on transforms |
| US5 (test app) | — | Build verification for apps/gas-webapp | N/A |
| Backward compat | — | `build.test.ts`: existing tests pass + new assertions | Existing coverage |

### Fixture Strategy

- Each integration test creates temporary fixture directories via `createFixture()`
- Fixtures cleaned up in `afterEach`
- No shared mutable state between tests

## Complexity Tracking

| Change | Justification |
|--------|--------------|
| New runtime dep (tinyglobby) | Required for glob patterns. Already transitive dep. Node built-in `fs.glob()` needs Node 22+. |
| New file `include.ts` | Separation of concerns — glob/copy logic is distinct from transform logic. Keeps two-file core intact. |
| New `transform` hook | Required for tree-shake protection. Minimal injection (`typeof`), cleaned up in `generateBundle`. |
