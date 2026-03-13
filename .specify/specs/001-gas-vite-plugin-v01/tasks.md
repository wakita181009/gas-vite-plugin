# Tasks: gas-vite-plugin v0.1

**Input**: Design documents from `.specify/specs/001-gas-vite-plugin-v01/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md

**Tests**: Tests are REQUIRED per spec SC-006 (100% unit test coverage on transforms).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Plugin package**: `packages/gas-vite-plugin/`
- **Plugin source**: `packages/gas-vite-plugin/src/`
- **Plugin tests**: `packages/gas-vite-plugin/tests/`
- **Test app**: `apps/gas-script/`

---

## Phase 1: Setup

**Purpose**: Install test tooling and configure test infrastructure

- [x] T001 Install vitest and @vitest/coverage-v8 as devDependencies in packages/gas-vite-plugin/package.json
- [x] T002 [P] Create vitest config in packages/gas-vite-plugin/vitest.config.ts (coverage: v8, include tests/**/*)
- [x] T003 [P] Add test scripts to packages/gas-vite-plugin/package.json ("test", "test:coverage")
- [x] T004 [P] Install vite-plugin-dts as devDependency in packages/gas-vite-plugin/package.json and add to vite.config.ts

---

## Phase 2: Foundational (Refactor Plugin to v0.1 Scope)

**Purpose**: Scope down existing prototype — remove v0.2 features, extract testable transforms

**⚠️ CRITICAL**: All user story work depends on this refactor completing first

- [x] T005 Extract transform functions from packages/gas-vite-plugin/src/index.ts to packages/gas-vite-plugin/src/transforms.ts — rename `exposeExportedFunctions` → `stripExportKeywords`, `removeExports` → `removeExportBlocks`, export both as named exports
- [x] T006 Remove v0.2 code from packages/gas-vite-plugin/src/index.ts — delete `GAS_TRIGGERS` constant, `exposeGlobals` function, `globals` and `autoGlobals` from `GasPluginOptions`, remove `if (autoGlobals)` conditional — always call `stripExportKeywords` then `removeExportBlocks`
- [x] T007 Update packages/gas-vite-plugin/src/index.ts to import transforms from ./transforms.ts and simplify generateBundle to: `code = stripExportKeywords(code); code = removeExportBlocks(code);`
- [x] T008 Verify plugin builds: run `pnpm --filter gas-vite-plugin build` and confirm dist/index.js, dist/index.cjs, dist/index.d.ts are generated

**Checkpoint**: Plugin is scoped to v0.1 API (`{ manifest?: string }`) with clean separation of transform functions

---

## Phase 3: User Story 1 — Basic GAS project build (Priority: P1) 🎯 MVP

**Goal**: All `export function` declarations become top-level functions in the output with zero export keywords remaining

**Independent Test**: Build a TS file with exported functions, verify output has top-level declarations with no `export` keywords

### Tests for User Story 1

> **Write these tests FIRST, ensure they FAIL before implementation changes**

- [x] T009 [P] [US1] Unit test: stripExportKeywords in packages/gas-vite-plugin/tests/unit/transforms.test.ts — test cases: `export function` → `function`, `export async function` → `async function`, `export const` → `const`, `export let` → `let`, `export var` → `var`, no exports → unchanged, export inside string literal → unchanged
- [x] T010 [P] [US1] Unit test: removeExportBlocks in packages/gas-vite-plugin/tests/unit/transforms.test.ts — test cases: `export { foo, bar };` → removed, `export { foo };` → removed, `export { foo as bar };` → removed, `export default expr` → `expr`, multiple blocks → all removed, no blocks → unchanged
- [x] T011 [US1] Integration test: full build in packages/gas-vite-plugin/tests/integration/build.test.ts — create a temp TS project with `export function onOpen()` and `export async function doPost()`, run `vite.build()` with gasPlugin(), assert output has no `export` keywords and contains `function onOpen()` and `async function doPost()` at top level
- [x] T012 [US1] Integration test: multi-module bundle in packages/gas-vite-plugin/tests/integration/build.test.ts — create temp project with main.ts importing from utils.ts, build, assert single output file with no `import`/`export` statements

### Implementation for User Story 1

- [x] T013 [US1] Verify and fix stripExportKeywords in packages/gas-vite-plugin/src/transforms.ts to pass all unit tests (T009)
- [x] T014 [US1] Verify and fix removeExportBlocks in packages/gas-vite-plugin/src/transforms.ts to pass all unit tests (T010)
- [x] T015 [US1] Run `pnpm --filter gas-vite-plugin test` and confirm all US1 tests pass with 100% coverage on transforms.ts

**Checkpoint**: Core transform pipeline is verified — `export function` → top-level `function` works for all patterns

---

## Phase 4: User Story 2 — appsscript.json manifest handling (Priority: P1)

**Goal**: `appsscript.json` is automatically copied to dist/, customizable path, graceful warning if missing

**Independent Test**: Build with/without manifest, verify copy behavior and warning

### Tests for User Story 2

- [x] T016 [P] [US2] Integration test: default manifest copy in packages/gas-vite-plugin/tests/integration/build.test.ts — create temp project with src/appsscript.json, build, assert dist/appsscript.json exists with identical content
- [x] T017 [P] [US2] Integration test: custom manifest path in packages/gas-vite-plugin/tests/integration/build.test.ts — configure `gasPlugin({ manifest: "appsscript.json" })`, build, assert file at custom path is copied
- [x] T018 [US2] Integration test: missing manifest warning in packages/gas-vite-plugin/tests/integration/build.test.ts — build without appsscript.json, assert build succeeds (no error) and console.warn was called

### Implementation for User Story 2

- [x] T019 [US2] Verify closeBundle in packages/gas-vite-plugin/src/index.ts passes all US2 tests — fix if needed (existing implementation should be correct)

**Checkpoint**: Manifest handling is verified — copy, custom path, and graceful missing all work

---

## Phase 5: User Story 3 — Zero-config build defaults (Priority: P1)

**Goal**: Plugin auto-applies minify: false and inlineDynamicImports without user configuration

**Independent Test**: Build with gasPlugin() (no options), verify output is not minified and is a single file

### Tests for User Story 3

- [x] T020 [P] [US3] Integration test: minify disabled in packages/gas-vite-plugin/tests/integration/build.test.ts — build with gasPlugin(), assert output is not minified (contains original function names, whitespace)
- [x] T021 [P] [US3] Integration test: single file output in packages/gas-vite-plugin/tests/integration/build.test.ts — build project with dynamic import, assert only one output JS file exists
- [ ] T022 [US3] Integration test: user override — deferred (Vite config merge is verified by design per research R-003)

### Implementation for User Story 3

- [x] T023 [US3] Verify config hook in packages/gas-vite-plugin/src/index.ts passes all US3 tests — fix if needed (existing implementation should be correct)

**Checkpoint**: Build defaults are verified — no-config builds produce correct GAS-compatible output

---

## Phase 6: User Story 4 — Test app: GAS script (Priority: P1)

**Goal**: A multi-module GAS script app that validates the plugin end-to-end as both test fixture and usage example

**Independent Test**: Build the app, inspect dist/Code.js for correct output, verify dist/appsscript.json exists

### Implementation for User Story 4

- [x] T024 [P] [US4] Create apps/gas-script/package.json with dependencies: gas-vite-plugin (workspace:\*), @types/google-apps-script, vite
- [x] T025 [P] [US4] Create apps/gas-script/tsconfig.json extending root config with GAS-specific types
- [x] T026 [US4] Create apps/gas-script/vite.config.ts — import gasPlugin, configure lib entry src/main.ts, format es, fileName "Code.js"
- [x] T027 [P] [US4] Create apps/gas-script/src/utils.ts — export helper functions (formatDate, createToast) used by main
- [x] T028 [US4] Create apps/gas-script/src/main.ts — export onOpen (creates custom menu), export onEdit (logs edit), export functions for menu handlers, import from utils.ts
- [x] T029 [US4] Create apps/gas-script/src/appsscript.json with timeZone, runtimeVersion "V8", exceptionLogging "STACKDRIVER"
- [x] T030 [US4] Build apps/gas-script: run `pnpm --filter gas-script build`, verify dist/Code.js has top-level functions with no export/import, verify dist/appsscript.json exists with runtimeVersion "V8"
- [x] T031 [US4] Remove old apps/gas-test directory (replaced by apps/gas-script)

**Checkpoint**: Test app builds correctly — all functions are top-level, multi-module code is bundled, manifest is present

---

## Phase 7: User Story 5 — npm package publication (Priority: P2)

**Goal**: Plugin is publishable as dual ESM/CJS package with TypeScript type definitions

**Independent Test**: Run `pnpm pack`, inspect tarball for dist/index.js, dist/index.cjs, dist/index.d.ts

### Tests for User Story 5

- [x] T032 [US5] Verify type definitions: run `pnpm --filter gas-vite-plugin build`, confirm dist/index.d.ts exists and exports GasPluginOptions interface and gasPlugin function
- [x] T033 [US5] Verify package tarball: run `pnpm --filter gas-vite-plugin pack`, inspect tarball contains dist/index.js, dist/index.cjs, dist/index.d.ts, package.json

### Implementation for User Story 5

- [x] T034 [P] [US5] Update packages/gas-vite-plugin/package.json metadata: add author, repository, homepage, description fields for npm listing
- [x] T035 [US5] Verify package.json exports field: confirm "import", "require", and "types" conditions all resolve correctly
- [x] T036 [US5] Add README.md to packages/gas-vite-plugin/ with minimal usage instructions (install, configure, build)

**Checkpoint**: Package is ready for `npm publish` — all artifacts present, metadata complete

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, cleanup, coverage check

- [x] T037 Run full test suite with coverage: `pnpm --filter gas-vite-plugin test:coverage` — verify 100% coverage on transforms.ts
- [x] T038 Run biome check: `pnpm check` — fix any linting/formatting issues
- [x] T039 Verify quickstart.md instructions: follow the "For plugin developers" section step by step in apps/gas-script
- [x] T040 Add root-level test script to package.json: `"test": "pnpm -r test"`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001 for vitest, T004 for dts)
- **US1 (Phase 3)**: Depends on Phase 2 (transforms extracted)
- **US2 (Phase 4)**: Depends on Phase 2 (plugin refactored). Can run in parallel with US1.
- **US3 (Phase 5)**: Depends on Phase 2 (plugin refactored). Can run in parallel with US1, US2.
- **US4 (Phase 6)**: Depends on Phase 2 (plugin builds). Can start in parallel with US1-3 but build verification (T030) needs plugin working.
- **US5 (Phase 7)**: Depends on Phases 3-6 all complete (package must be verified before publish prep)
- **Polish (Phase 8)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: No story dependencies — core transforms
- **US2 (P1)**: No story dependencies — manifest copy is independent of transforms
- **US3 (P1)**: No story dependencies — config hook is independent
- **US4 (P1)**: Depends on US1+US2+US3 working (test app validates all three)
- **US5 (P2)**: Depends on US1-4 complete (publish after all functionality verified)

### Within Each User Story

- Tests MUST be written and FAIL before implementation fixes
- Integration tests depend on unit tests for the same functionality
- Story complete = all tests pass

### Parallel Opportunities

- **Phase 1**: T001 → T002, T003, T004 (all parallel after vitest installed)
- **Phase 2**: T005 → T006 → T007 → T008 (sequential — each depends on previous)
- **Phase 3**: T009 + T010 parallel, then T011 + T012 parallel, then T013 + T014 parallel
- **Phase 4**: T016 + T017 parallel, then T018, then T019
- **Phase 5**: T020 + T021 parallel, then T022, then T023
- **Phase 6**: T024 + T025 + T027 parallel, then T026 + T028 + T029, then T030, then T031

---

## Parallel Example: User Story 1

```bash
# Launch unit tests in parallel (both write to same file but different describe blocks):
Task T009: "Unit test stripExportKeywords in packages/gas-vite-plugin/tests/unit/transforms.test.ts"
Task T010: "Unit test removeExportBlocks in packages/gas-vite-plugin/tests/unit/transforms.test.ts"

# Then launch integration tests in parallel:
Task T011: "Integration test full build in packages/gas-vite-plugin/tests/integration/build.test.ts"
Task T012: "Integration test multi-module bundle in packages/gas-vite-plugin/tests/integration/build.test.ts"

# Then fix implementations in parallel:
Task T013: "Verify stripExportKeywords passes unit tests"
Task T014: "Verify removeExportBlocks passes unit tests"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install vitest, dts)
2. Complete Phase 2: Foundational (refactor plugin)
3. Complete Phase 3: User Story 1 (transforms tested)
4. **STOP and VALIDATE**: Run tests, confirm transforms work
5. This alone makes the plugin functional

### Incremental Delivery

1. Setup + Foundational → Plugin refactored and buildable
2. US1 → Core transforms verified → Functional MVP
3. US2 → Manifest copy verified → Deployable via clasp
4. US3 → Build defaults verified → Zero-config experience
5. US4 → Test app validates everything end-to-end
6. US5 → Package ready for npm publish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Existing prototype code means most "implementation" tasks are verification/fixes, not greenfield
- T009 and T010 write to the same file (transforms.test.ts) but different describe blocks — can be done in one pass
- Integration tests in build.test.ts use Vite's programmatic `vite.build()` API with temp directories
- Manual clasp push testing (Story 4 acceptance scenario 3) is not automated — done by developer
