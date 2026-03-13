# Implementation Plan: gas-vite-plugin v0.1

**Branch**: `001-gas-vite-plugin-v01` | **Date**: 2026-03-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `.specify/specs/001-gas-vite-plugin-v01/spec.md`

## Summary

Build a minimal Vite plugin that transforms Vite's bundled output into GAS-compatible code by stripping ES module export syntax, copying `appsscript.json` to dist, and applying GAS-safe build defaults (no minification, no code splitting). The plugin has an existing prototype implementation (~200 LOC) that needs to be scoped down to v0.1 (remove globals/autoGlobals features), tested, validated with a real GAS script app, and prepared for npm publication.

## Technical Context

**Language/Version**: TypeScript 5.x (compiled via Vite/esbuild)
**Primary Dependencies**: vite >=5.0.0 (peer dependency only)
**Storage**: N/A (build tool — no persistent state)
**Testing**: Vitest (Vite-native test runner)
**Target Platform**: Node.js (runs at build time only)
**Project Type**: Library (Vite plugin, published to npm)
**Performance Goals**: N/A (build-time tool, single execution)
**Constraints**: Zero code injection into GAS output, Vite 5-8+ compat
**Scale/Scope**: Single plugin file ~150 LOC, 3 transform functions

## Constitution Check

*Constitution file contains only placeholders (not configured). No gates to check.*

## Project Structure

### Documentation (this feature)

```text
.specify/specs/001-gas-vite-plugin-v01/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/
  gas-vite-plugin/
    src/
      index.ts               # Plugin entry — exports gasPlugin()
      transforms.ts          # Pure transform functions (extract from index.ts)
    dist/                    # Build output (ESM + CJS + .d.ts)
    package.json
    vite.config.ts
    tsconfig.json

packages/
  gas-vite-plugin/
    tests/
      unit/
        transforms.test.ts   # Unit tests for transform functions
      integration/
        build.test.ts         # Integration test — run Vite build, verify output

apps/
  gas-script/                # Test app: GAS script (replaces gas-test)
    src/
      main.ts                # Entry: onOpen, onEdit, menu handlers
      utils.ts               # Utility module (imported by main)
      appsscript.json        # Manifest with runtimeVersion: "V8"
    dist/                    # Build output
    vite.config.ts
    package.json
    tsconfig.json
```

**Structure Decision**: Monorepo (pnpm workspace) with plugin package + test app. Transform functions are extracted to `transforms.ts` for isolated unit testing. Integration tests live in the plugin package and exercise actual Vite builds.

## Test Strategy

### Framework & Setup

- **Test runner**: Vitest (native Vite integration, same config format)
- **Location**: `packages/gas-vite-plugin/tests/`
- **Coverage target**: 100% on transform functions (SC-006)

### Test Structure

| Layer | File | What it tests | Story coverage |
|-------|------|---------------|----------------|
| Unit | `transforms.test.ts` | `stripExportKeywords()`, `removeExportBlocks()` as pure string→string functions | Story 1 (all scenarios) |
| Integration | `build.test.ts` | Full Vite build with gasPlugin(), verify output file contents and manifest copy | Story 1, 2, 3 |
| Integration | `build.test.ts` | Missing manifest warning (no error) | Story 2 (scenario 3) |
| Integration | `build.test.ts` | Multi-module bundling into single file | Story 1 (scenario 4) |
| Manual | `apps/gas-script` | `clasp push` + run in Google Sheets | Story 4 |

### Unit Test Cases (transforms.test.ts)

```
stripExportKeywords:
  - "export function foo()" → "function foo()"
  - "export async function bar()" → "async function bar()"
  - "export const x = ..." → "const x = ..."
  - "export let y = ..." → "let y = ..."
  - "export var z = ..." → "var z = ..."
  - no exports → code unchanged
  - export inside string literal → not modified
  - export inside comment → not modified

removeExportBlocks:
  - "export { foo, bar };" → removed
  - "export { foo };" → removed
  - "export { foo as bar };" → removed (Vite generates this)
  - "export default expression;" → "expression;"
  - multiple export blocks → all removed
  - no export blocks → code unchanged
```

### Integration Test Cases (build.test.ts)

```
- Build single-file project → output has no export keywords
- Build multi-module project → single output file, no imports
- Build with gasPlugin() defaults → minify is false
- Build with custom manifest path → correct file copied
- Build with missing manifest → warning logged, no error
- Output file contains top-level function declarations
```

## Implementation Approach

### What exists today

The prototype in `packages/gas-vite-plugin/src/index.ts` (197 LOC) already implements:
- Export keyword stripping (`exposeExportedFunctions`)
- Export block removal (`removeExports`)
- Explicit globals wrapper (`exposeGlobals`) — **v0.2 scope, to be removed**
- Manifest copy (`closeBundle`)
- Build defaults (`config` hook)

### Changes needed for v0.1

1. **Scope down `GasPluginOptions`**: Remove `globals` and `autoGlobals` fields. Keep only `manifest`.
2. **Extract transforms**: Move `exposeExportedFunctions` and `removeExports` to `transforms.ts` for testability. Remove `exposeGlobals` (v0.2).
3. **Rename internal functions**: `exposeExportedFunctions` → `stripExportKeywords` (more accurate for v0.1 — it strips, not exposes). `removeExports` → `removeExportBlocks`.
4. **Always strip exports**: Remove the `if (autoGlobals)` conditional — always run both transform functions.
5. **Remove `GAS_TRIGGERS` constant**: Not needed without globals feature.
6. **Add Vitest**: Install as devDependency, configure, write tests.
7. **Create `apps/gas-script`**: New test app replacing `apps/gas-test` with multi-module structure.
8. **Verify npm packaging**: Ensure `pnpm pack` produces correct tarball.

### Key Design Decisions

- **No AST parser**: Transform functions use regex on Rollup's already-structured output (line-level patterns). This is safe because `generateBundle` receives post-bundled code where exports are always at line start.
- **`enforce: "post"` + `apply: "build"`**: Plugin runs after all other transforms, only during build.
- **`config` hook for defaults**: Uses Vite's config merge (plugin config is lower priority than user config), so user overrides work naturally.
- **`closeBundle` for manifest**: Runs after all output is written, uses sync fs for simplicity.
