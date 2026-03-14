# Tasks: Universal GAS Plugin with unplugin

**Input**: Design documents from `/specs/003-unplugin-migration/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED for all user stories. Target: **100% on pure modules, ≥ 80% overall**. Each story must include unit/integration tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the `packages/unplugin/` package structure and configure build tooling

- [x] T001 Create `packages/unplugin/` directory structure with `src/`, `tests/`, `tests/integration/` per plan.md
- [x] T002 Create `packages/unplugin/package.json` with name `@gas-plugin/unplugin`, version `0.0.5`, subpath exports for `.`, `./vite`, `./rollup`, `./webpack`, `./esbuild`, `./bun`, optional peer dependencies per `contracts/public-api.md`
- [x] T003 [P] Create `packages/unplugin/tsconfig.json` (ES2022 target, bundler resolution, strict mode, matching root tsconfig conventions)
- [x] T004 [P] Create `packages/unplugin/vitest.config.ts` with 100% coverage thresholds on `transforms.ts`, `include.ts`, `globals.ts`, `post-process.ts`
- [x] T005 Add `unplugin` dependency to `packages/unplugin/package.json` and run `pnpm install`
- [x] T006 Configure build tooling (Vite library mode or tsdown) for multiple entry points (`index`, `vite`, `rollup`, `webpack`, `esbuild`, `bun`) in `packages/unplugin/vite.config.ts` (or `tsdown.config.ts`)
- [x] T007 Update `pnpm-workspace.yaml` to include `packages/unplugin` if not already covered by `packages/*` glob
- [x] T008 Update root `package.json` scripts to include the new package in `build` and `test` commands

---

## Phase 2: Foundational (Core Module Port + Universal Plugin Factory)

**Purpose**: Port pure modules from `gas-vite-plugin` and create the `createUnplugin` factory. MUST complete before any bundler-specific story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T009 [P] Copy `packages/gas-vite-plugin/src/types.ts` → `packages/unplugin/src/types.ts` (unchanged)
- [x] T010 [P] Copy `packages/gas-vite-plugin/src/transforms.ts` → `packages/unplugin/src/transforms.ts` (unchanged)
- [x] T011 [P] Copy `packages/gas-vite-plugin/src/include.ts` → `packages/unplugin/src/include.ts` (unchanged)
- [x] T012 [P] Copy `packages/gas-vite-plugin/src/globals.ts` → `packages/unplugin/src/globals.ts` (unchanged)
- [x] T013 [P] Copy `packages/gas-vite-plugin/tests/transforms.test.ts` → `packages/unplugin/tests/transforms.test.ts` (unchanged)
- [x] T014 [P] Copy `packages/gas-vite-plugin/tests/include.test.ts` → `packages/unplugin/tests/include.test.ts` (unchanged)
- [x] T015 [P] Copy `packages/gas-vite-plugin/tests/globals.test.ts` → `packages/unplugin/tests/globals.test.ts` (unchanged)
- [x] T016 Create `packages/unplugin/src/post-process.ts` — extract `postProcessBundle(code: string): string` that applies `stripExportKeywords`, `removeExportBlocks`, globals marker cleanup (`__GAS_GLOBALS__` removal), and trailing newline normalization on a raw code string
- [x] T017 Create `packages/unplugin/tests/post-process.test.ts` — unit tests for `postProcessBundle`: export stripping + marker cleanup combined, empty input, no-op input, multiple markers, 100% coverage
- [x] T018 Run ported unit tests: `pnpm --filter @gas-plugin/unplugin vitest run` — verify all pass and 100% coverage on pure modules
- [x] T019 Create `packages/unplugin/src/index.ts` — `createUnplugin` factory with:
  - Universal `transform` hook with `filter` API (JS/TS only, exclude virtual modules) — injects `globalThis.__gas_keep__` via `detectNamesToProtect`
  - Universal `writeBundle` hook — copies `appsscript.json` and `include` files using `resolveIncludeFiles`/`copyFilesFlat` (rootDir/outDir from closure)
  - `meta.framework` detection for framework-specific behavior
  - Accept `GasPluginOptions` as factory parameter

**Checkpoint**: Core modules ported, unit tests pass at 100% coverage, `createUnplugin` factory compiles

---

## Phase 3: User Story 1 — Use GAS Plugin with Rollup (Priority: P1) 🎯 MVP

**Goal**: Rollup users can build GAS-compatible bundles with export stripping, manifest copy, and globals protection

**Independent Test**: Create a Rollup fixture project, build with the plugin, verify output has no exports, manifest present, globals protected

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T020 [P] [US1] Create Rollup integration test helpers in `packages/unplugin/tests/integration/helpers.ts` — adapt from `gas-vite-plugin/tests/integration/helpers.ts` to support multiple bundlers (Rollup build function using `rollup` + `@rollup/plugin-typescript`)
- [x] T021 [P] [US1] Create `packages/unplugin/tests/integration/rollup.test.ts` — tests for: basic build (no exports in output), manifest copy, globals protection, include file copy, autoGlobals

### Implementation for User Story 1

- [x] T022 [US1] Create `packages/unplugin/src/rollup.ts` — subpath export that exposes `unplugin.rollup` as default export
- [x] T023 [US1] Add Rollup-specific hooks to `createUnplugin` in `packages/unplugin/src/index.ts`: `rollup: { generateBundle() }` for post-bundle export stripping via `postProcessBundle`, `rollup: { outputOptions() }` for outDir resolution
- [x] T024 [US1] Add `rollup` and `@rollup/plugin-typescript` as devDependencies in `packages/unplugin/package.json` for testing
- [x] T025 [US1] Run Rollup integration tests and verify all pass

**Checkpoint**: Rollup builds produce GAS-compatible output. MVP complete.

---

## Phase 4: User Story 2 — Seamless Vite Migration (Priority: P1)

**Goal**: Existing `gas-vite-plugin` users switch to `@gas-plugin/unplugin/vite` with identical output

**Independent Test**: Run all existing `gas-vite-plugin` integration tests against the new Vite subpath export

### Tests for User Story 2

- [x] T026 [P] [US2] Port `packages/gas-vite-plugin/tests/integration/build.test.ts` → `packages/unplugin/tests/integration/vite.test.ts` — adapt imports to use `@gas-plugin/unplugin/vite`
- [x] T027 [P] [US2] Port remaining Vite integration tests (exports.test.ts, globals.test.ts, include.test.ts, webapp.test.ts) into `packages/unplugin/tests/integration/vite.test.ts` or separate files

### Implementation for User Story 2

- [x] T028 [US2] Create `packages/unplugin/src/vite.ts` — subpath export that exposes `unplugin.vite` as default export
- [x] T029 [US2] Add Vite-specific hooks to `createUnplugin` in `packages/unplugin/src/index.ts`: `vite: { config() }` for minify/codeSplitting defaults, `vite: { configResolved() }` for root/outDir capture, `vite: { generateBundle() }` for export stripping via `postProcessBundle`, `enforce: "post"`, `apply: "build"`
- [x] T030 [US2] Update `apps/gas-script/vite.config.ts` — change import from `gas-vite-plugin` to `@gas-plugin/unplugin/vite`
- [x] T031 [US2] Update `apps/gas-webapp/vite.config.ts` — change import from `gas-vite-plugin` to `@gas-plugin/unplugin/vite`
- [x] T032 [US2] Run all Vite integration tests and verify identical output to `gas-vite-plugin`

**Checkpoint**: All existing Vite tests pass. Migration path validated.

---

## Phase 5: User Story 3 — Use GAS Plugin with webpack (Priority: P2)

**Goal**: webpack 5 users can build GAS-compatible bundles

**Independent Test**: Create a webpack fixture project, build, verify no exports, manifest present, globals protected

### Tests for User Story 3

- [x] T033 [P] [US3] Create `packages/unplugin/tests/integration/webpack.test.ts` — tests for: basic build, export stripping, globals protection, manifest copy

### Implementation for User Story 3

- [x] T034 [US3] Create `packages/unplugin/src/webpack.ts` — subpath export that exposes `unplugin.webpack` as default export
- [x] T035 [US3] Add webpack-specific hooks to `createUnplugin` in `packages/unplugin/src/index.ts`: `webpack(compiler)` for root/outDir from `compiler.options`, `compilation.processAssets` tap for post-bundle export stripping via `postProcessBundle`
- [x] T036 [US3] Add `webpack` and `ts-loader` (or equivalent) as devDependencies for testing
- [x] T037 [US3] Run webpack integration tests and verify all pass

**Checkpoint**: webpack builds produce GAS-compatible output.

---

## Phase 6: User Story 4 — Use GAS Plugin with esbuild (Priority: P2)

**Goal**: esbuild users can build GAS-compatible bundles

**Independent Test**: Create an esbuild fixture, build, verify no exports, manifest present

### Tests for User Story 4

- [x] T038 [P] [US4] Create `packages/unplugin/tests/integration/esbuild.test.ts` — tests for: basic build, export stripping, manifest copy

### Implementation for User Story 4

- [x] T039 [US4] Create `packages/unplugin/src/esbuild.ts` — subpath export that exposes `unplugin.esbuild` as default export
- [x] T040 [US4] Add esbuild-specific post-process in `writeBundle` hook: read output JS files from outDir, apply `postProcessBundle`, write back (esbuild has no post-bundle in-memory hook)
- [x] T041 [US4] Add `esbuild` as devDependency for testing
- [x] T042 [US4] Run esbuild integration tests and verify all pass

**Checkpoint**: esbuild builds produce GAS-compatible output.

---

## Phase 7: User Story 5 — Use GAS Plugin with Bun (Priority: P2)

**Goal**: Bun bundler users can build GAS-compatible bundles, with graceful degradation for limited hooks

**Independent Test**: Create a Bun build script fixture, build, verify no exports, manifest present

### Tests for User Story 5

- [x] T043 [P] [US5] Create `packages/unplugin/tests/integration/bun.test.ts` — tests for: basic build, export stripping, manifest copy, graceful hook degradation

### Implementation for User Story 5

- [x] T044 [US5] Create `packages/unplugin/src/bun.ts` — subpath export that exposes `unplugin.bun` as default export
- [x] T045 [US5] Handle Bun's limited lifecycle hooks (no `buildEnd`/`writeBundle`): use post-build file operations as fallback for manifest copy and include files
- [x] T046 [US5] Run Bun integration tests and verify all pass

**Checkpoint**: Bun builds produce GAS-compatible output with graceful degradation.

---

## Phase 8: User Story 7 — Single Package with Subpath Exports (Priority: P3)

**Goal**: All subpath exports resolve correctly, package.json exports field is valid, each returns proper plugin instance

**Independent Test**: Import from each subpath, verify module resolution and plugin instance type

### Tests for User Story 7

- [x] T047 [P] [US7] Create `packages/unplugin/tests/exports.test.ts` — test that each subpath (`/vite`, `/rollup`, `/webpack`, `/esbuild`, `/bun`) resolves and returns a function that produces a valid plugin object

### Implementation for User Story 7

- [x] T048 [US7] Verify `packages/unplugin/package.json` exports field matches `contracts/public-api.md` spec — all subpaths have `import`, `require`, and `types` conditions
- [x] T049 [US7] Build the package and verify all dist outputs exist: `dist/index.{js,cjs,d.ts}`, `dist/vite.{js,cjs,d.ts}`, `dist/rollup.{js,cjs,d.ts}`, `dist/webpack.{js,cjs,d.ts}`, `dist/esbuild.{js,cjs,d.ts}`, `dist/bun.{js,cjs,d.ts}`
- [x] T050 [US7] Run export resolution tests and verify all pass

**Checkpoint**: All subpath exports work. Package is ready for publish.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation, constitution update

- [x] T051 Run full test suite across all bundlers: `pnpm --filter @gas-plugin/unplugin test` — verify 100% coverage on pure modules, ≥80% overall
- [x] T052 Add missing tests to bring any under-covered modules above thresholds
- [x] T053 [P] Update constitution.md: amend Principle III from "Vite-Native Integration" to "Multi-Bundler Integration via unplugin", update architecture constraints to reflect new package structure
- [x] T054 [P] Create `packages/unplugin/README.md` — installation, usage per bundler (import examples from `contracts/public-api.md`), options reference, migration guide from `gas-vite-plugin`
- [x] T055 [P] Update root `README.md` to reference `@gas-plugin/unplugin` instead of `gas-vite-plugin`
- [x] T056 Verify `apps/gas-script` and `apps/gas-webapp` build correctly with `@gas-plugin/unplugin/vite`
- [x] T057 Run `pnpm -w run check` (Biome lint + format) on entire monorepo and fix any issues

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–8)**: All depend on Foundational phase completion
  - US1 (Rollup) and US2 (Vite) can proceed in parallel
  - US3 (webpack), US4 (esbuild), US5 (Bun) can proceed in parallel after Foundational
  - US7 (Subpath Exports) can proceed after at least one bundler adapter is implemented
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Rollup, P1)**: Can start after Foundational — no other story dependency
- **US2 (Vite, P1)**: Can start after Foundational — no other story dependency
- **US3 (webpack, P2)**: Can start after Foundational — no other story dependency
- **US4 (esbuild, P2)**: Can start after Foundational — no other story dependency
- **US5 (Bun, P2)**: Can start after Foundational — no other story dependency
- **US7 (Subpath Exports, P3)**: Needs at least T022, T028, T034, T039, T044 complete (all adapter files created)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Adapter file (subpath export) before framework-specific hooks
- Run tests to verify after implementation

### Parallel Opportunities

- T003/T004 (tsconfig/vitest) run in parallel
- T009–T015 (all pure module copies) run in parallel
- T020/T021 (Rollup test setup) run in parallel with T026/T027 (Vite test port)
- US1 and US2 can be developed in parallel (different bundler adapters)
- US3, US4, US5 can all be developed in parallel

---

## Parallel Example: User Stories 1 & 2

```bash
# After Foundational phase completes, launch both P1 stories in parallel:

# Developer A: US1 (Rollup)
Task: "Create Rollup integration tests in packages/unplugin/tests/integration/rollup.test.ts"
Task: "Create packages/unplugin/src/rollup.ts subpath export"
Task: "Add Rollup hooks to createUnplugin factory"

# Developer B: US2 (Vite)
Task: "Port Vite integration tests to packages/unplugin/tests/integration/vite.test.ts"
Task: "Create packages/unplugin/src/vite.ts subpath export"
Task: "Add Vite hooks to createUnplugin factory"
```

---

## Implementation Strategy

### MVP First (US1: Rollup Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (port pure modules + createUnplugin factory)
3. Complete Phase 3: User Story 1 (Rollup adapter)
4. **STOP and VALIDATE**: Build a real GAS project with Rollup
5. Ship `@gas-plugin/unplugin@0.0.5-beta.1` if ready

### Incremental Delivery

1. Setup + Foundational → Core ready
2. Add US1 (Rollup) + US2 (Vite) → Test independently → v0.0.5-beta
3. Add US3 (webpack) + US4 (esbuild) + US5 (Bun) → Test independently → v0.0.5-rc
4. Add US7 (Subpath Exports validation) + Polish → v0.0.5 release
5. Unpublish `gas-vite-plugin` from npm

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- User Story 6 (Deno) is NOT tasked — covered by esbuild compatibility per spec
- Pure modules (transforms, include, globals) are copied, not symlinked, to maintain package independence
- The `gas-vite-plugin` package is NOT removed from the monorepo yet — only unpublished from npm after validation
- **Coverage gate**: 100% on pure modules, 80%+ overall. Polish phase must verify.
