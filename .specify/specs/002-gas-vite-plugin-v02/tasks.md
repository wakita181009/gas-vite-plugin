# Tasks: gas-vite-plugin v0.2 (Web App & Advanced Features)

**Input**: Design documents from `/specs/002-gas-vite-plugin-v02/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED for all user stories. Target: **100%** line coverage on `transforms.ts` and `include.ts`, **≥ 80%** overall. Each story must include unit/integration tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Plugin source**: `packages/gas-vite-plugin/src/`
- **Plugin tests**: `packages/gas-vite-plugin/tests/`
- **Test app**: `apps/gas-webapp/`

---

## Phase 1: Setup

**Purpose**: Add new dependency and prepare project structure for v0.2 features

- [x] T001 Add `tinyglobby` as production dependency in `packages/gas-vite-plugin/package.json` and run `pnpm install`
- [x] T001b Add `tinyglobby` to `rollupOptions.external` in `packages/gas-vite-plugin/vite.config.ts` to prevent bundling
- [x] T002 [P] Extend `GasPluginOptions` interface with `include`, `globals`, and `autoGlobals` fields in `packages/gas-vite-plugin/src/index.ts` per `contracts/plugin-options.ts`
- [x] T003 [P] Add `packages/gas-vite-plugin/src/include.ts` to coverage config in `packages/gas-vite-plugin/vitest.config.ts` with 100% threshold

**Checkpoint**: Dependencies installed, interface extended, coverage config ready

---

## Phase 2: US1 - Additional file copying via include option (Priority: P1) 🎯 MVP

**Goal**: Copy additional files (HTML, CSS) flat to output directory via glob patterns

**Independent Test**: Configure `include: ["src/**/*.html"]`, build, verify HTML files appear in output directory

### Tests for US1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T004 [P] [US1] Unit tests for glob resolution and flat copy in `packages/gas-vite-plugin/tests/unit/include.test.ts` — test `resolveIncludeFiles()`: single pattern, multiple patterns, no matches, files outside root ignored
- [x] T005 [P] [US1] Unit tests for flat copy edge cases in `packages/gas-vite-plugin/tests/unit/include.test.ts` — test `copyFilesFlat()`: dedup (same file matched twice), filename collision warning, subdirectory flattening
- [x] T006 [P] [US1] Integration tests in `packages/gas-vite-plugin/tests/integration/include.test.ts` — test full build: HTML copied flat, multiple patterns (HTML+CSS), default config (no include = backward compat), empty pattern match succeeds

### Implementation for US1

- [x] T007 [US1] Implement `resolveIncludeFiles(patterns, rootDir)` in `packages/gas-vite-plugin/src/include.ts` — use `tinyglobby.globSync()` with `cwd: rootDir`, return absolute paths
- [x] T008 [US1] Implement `copyFilesFlat(files, outDir, rootDir)` in `packages/gas-vite-plugin/src/include.ts` — flatten to basename, dedup check with warning on collision, copy via `fs.copyFileSync`
- [x] T009 [US1] Integrate include logic in `closeBundle` hook in `packages/gas-vite-plugin/src/index.ts` — call after manifest copy, resolve patterns relative to `config.root`, skip if `include` is empty/undefined (FR-010 backward compat)
- [x] T010 [US1] Verify all US1 unit and integration tests pass

**Checkpoint**: `include` option works. HTML/CSS files copied flat to outDir. v0.1 behavior unchanged when `include` not configured.

---

## Phase 3: US2 - Explicit globals list (Priority: P1)

**Goal**: Protect non-exported functions from tree-shaking via `globals` config option

**Independent Test**: Configure `globals: ["processData"]` where `processData` is defined but not exported, build, verify it's a top-level declaration in output

### Tests for US2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T011 [P] [US2] Integration tests in `packages/gas-vite-plugin/tests/integration/globals.test.ts` — test: non-exported function survives tree-shaking when listed in globals, function not in bundle silently ignored, already top-level function + globals = no duplicate

### Implementation for US2

- [x] T012 [US2] Add `transform` hook to plugin in `packages/gas-vite-plugin/src/index.ts` — inject globalThis.__gas_keep__ side-effect reference for each globals entry
- [x] T013 [US2] Extend `generateBundle` hook in `packages/gas-vite-plugin/src/index.ts` — strip __GAS_GLOBALS__ injection lines before export removal
- [x] T014 [US2] Verify all US2 integration tests pass

**Checkpoint**: `globals` option protects specified functions from tree-shaking. Non-exported functions survive in output.

---

## Phase 4: US4 - Export edge cases (Priority: P2)

**Goal**: Handle all export patterns that bundlers may produce: `export class`, `export default function`, `export { }`, `export { as }`, `export default expression`

**Independent Test**: Build with each export pattern, verify no `export` keywords remain and all declarations are accessible

### Tests for US4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T015 [P] [US4] Unit tests for `export class` stripping in `packages/gas-vite-plugin/tests/unit/transforms.test.ts` — add test cases: `export class MyService {}` → `class MyService {}`, `export abstract class Base {}` → `abstract class Base {}`
- [x] T016 [P] [US4] Integration tests in `packages/gas-vite-plugin/tests/integration/exports.test.ts` — test all 5 patterns via real Vite build: export default function, export { foo, bar }, export { foo as bar }, export class, export default expression

### Implementation for US4

- [x] T017 [US4] Add `export class` regex to `stripExportKeywords()` in `packages/gas-vite-plugin/src/transforms.ts` — pattern: `^export\s+(class\s)` and `^export\s+(abstract\s+class\s)`
- [x] T018 [US4] Verify all US4 unit and integration tests pass

**Checkpoint**: All 5 export patterns produce correct GAS-compatible output.

---

## Phase 5: US3 - autoGlobals toggle (Priority: P2)

**Goal**: Allow disabling automatic export-to-global tree-shake protection via `autoGlobals: false`

**Independent Test**: Set `autoGlobals: false`, export multiple functions, configure only one in `globals`, verify only that one is protected

**Dependencies**: Requires US2 (globals) to be complete

### Tests for US3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T019 [P] [US3] Integration tests in `packages/gas-vite-plugin/tests/integration/globals.test.ts` — add test cases: `autoGlobals: false` with no globals = exports still stripped but no tree-shake protection, `autoGlobals: false` with one global = only that function protected

### Implementation for US3

- [x] T020 [US3] Implement `autoGlobals` logic in `transform` hook in `packages/gas-vite-plugin/src/index.ts` — when `autoGlobals: true` (default), detect exported function/const/class names from entry code and add to globals list for typeof injection. When `false`, only use explicit `globals` list
- [x] T021 [US3] Verify all US3 integration tests pass

**Checkpoint**: `autoGlobals` toggle works. `false` = only explicit globals protected. `true` (default) = exported functions auto-protected.

---

## Phase 6: US5 - Test app: GAS web app (Priority: P1)

**Goal**: Standalone test app exercising web app pattern with `doGet`/`doPost`, HTML via `include`, and server-side functions via `globals`

**Independent Test**: Build the app, verify output contains top-level `doGet`/`doPost`/`getData`/`saveData` functions and `index.html`

**Dependencies**: Requires US1 (include) and US2 (globals) to be complete

### Tests for US5

- [x] T022 [P] [US5] Integration test in `packages/gas-vite-plugin/tests/integration/webapp.test.ts` — build `apps/gas-webapp` fixture, verify: `doGet` is top-level, HTML files present in output, server-side functions (`getData`, `saveData`) are top-level declarations

### Implementation for US5

- [x] T023 [P] [US5] Create `apps/gas-webapp/package.json` with workspace dependency on `gas-vite-plugin`
- [x] T024 [P] [US5] Create `apps/gas-webapp/vite.config.ts` with `gasPlugin({ include: ["src/**/*.html"], globals: ["getData", "saveData"] })`
- [x] T025 [P] [US5] Create `apps/gas-webapp/src/main.ts` with `doGet()`, `doPost()`, `getData()`, `saveData()` functions
- [x] T026 [P] [US5] Create `apps/gas-webapp/src/index.html` with client-side HTML using `google.script.run`
- [x] T027 [P] [US5] Create `apps/gas-webapp/src/appsscript.json` manifest with webapp config
- [x] T028 [US5] Verify US5 integration test passes and app builds correctly

**Checkpoint**: Test app builds, output structure is correct for GAS web app deployment.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Backward compatibility verification, coverage enforcement, documentation

- [x] T029 Verify backward compatibility (FR-009): run existing `packages/gas-vite-plugin/tests/integration/build.test.ts` tests pass unchanged, build `apps/gas-script` with no config changes
- [x] T030 Run full test suite and verify coverage: 100% on `transforms.ts`, 100% on `include.ts`, ≥ 80% overall
- [x] T031 Add missing tests to bring any under-covered modules above threshold
- [x] T032 [P] Update `packages/gas-vite-plugin/README.md` with `include`, `globals`, and `autoGlobals` documentation and examples
- [x] T033 [P] Update JSDoc on `GasPluginOptions` interface in `packages/gas-vite-plugin/src/types.ts`
- [x] T034 Run `pnpm check` (Biome lint + format) and fix any issues
- [x] T035 Run quickstart.md validation: verify all code examples in `specs/002-gas-vite-plugin-v02/quickstart.md` match actual API

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **US1 (Phase 2)**: Depends on Setup (T001-T003)
- **US2 (Phase 3)**: Depends on Setup (T001-T003)
- **US4 (Phase 4)**: Depends on Setup (T002 for interface, but transforms work is independent)
- **US3 (Phase 5)**: Depends on US2 (Phase 3) — globals must exist before autoGlobals toggle
- **US5 (Phase 6)**: Depends on US1 (Phase 2) + US2 (Phase 3) — needs include and globals
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (include)**: Independent after Setup — can start immediately
- **US2 (globals)**: Independent after Setup — can run in parallel with US1
- **US4 (export edge cases)**: Independent after Setup — can run in parallel with US1/US2
- **US3 (autoGlobals)**: Depends on US2 — must wait for globals implementation
- **US5 (test app)**: Depends on US1 + US2 — must wait for both include and globals

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Unit tests before integration tests (where applicable)
- Core logic before hook integration
- Story complete before moving to dependent stories

### Parallel Opportunities

- US1, US2, US4 can all start in parallel after Setup
- Within US1: T004, T005, T006 (all tests) can run in parallel
- Within US5: T023-T027 (all app files) can run in parallel
- T032, T033 (documentation) can run in parallel

---

## Parallel Example: US1 (Include)

```bash
# Launch all tests for US1 together:
Task: "Unit tests for glob resolution in tests/unit/include.test.ts"
Task: "Unit tests for flat copy edge cases in tests/unit/include.test.ts"
Task: "Integration tests in tests/integration/include.test.ts"

# Then implement sequentially:
Task: "Implement resolveIncludeFiles() in src/include.ts"
Task: "Implement copyFilesFlat() in src/include.ts"
Task: "Integrate in closeBundle hook in src/index.ts"
```

## Parallel Example: US5 (Test App)

```bash
# Launch all app files in parallel:
Task: "Create apps/gas-webapp/package.json"
Task: "Create apps/gas-webapp/vite.config.ts"
Task: "Create apps/gas-webapp/src/main.ts"
Task: "Create apps/gas-webapp/src/index.html"
Task: "Create apps/gas-webapp/src/appsscript.json"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1: Setup
2. Complete Phase 2: US1 (include) — enables web app file copying
3. Complete Phase 3: US2 (globals) — enables tree-shake protection
4. **STOP and VALIDATE**: Both features work independently
5. This covers the two most critical P1 features

### Incremental Delivery

1. Setup → Foundation ready
2. US1 (include) → Web app HTML copying works → Testable
3. US2 (globals) → Tree-shake protection works → Testable
4. US4 (export edge cases) → All export patterns handled → Testable
5. US3 (autoGlobals) → Fine-grained control → Testable
6. US5 (test app) → Full web app validation → Demo-ready
7. Polish → Documentation, coverage, backward compat verified

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Coverage gate**: Implementation is not complete until transforms.ts = 100%, include.ts = 100%, overall ≥ 80%
