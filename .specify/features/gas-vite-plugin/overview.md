# gas-vite-plugin — Overview

## Purpose and Scope

A Vite plugin that transforms standard TypeScript/JavaScript modules into Google Apps Script (GAS)-compatible output. GAS does not support ES module syntax, so this plugin removes all `export`/`import` statements from bundled output, copies the `appsscript.json` manifest and additional files, protects designated functions from tree-shaking, and applies GAS-friendly build defaults (no minification, no code splitting).

Scope boundary: this plugin only handles post-bundle transformations, tree-shake protection, file copying, and build configuration. It does not perform TypeScript compilation (Vite's job), arrow function conversion (V8 handles modern JS), or `console.log` → `Logger.log` rewriting.

## Business Invariants

1. **Zero `export`/`import` in output**: Every chunk produced by the build must have all `export` keywords stripped and all `export { ... }` blocks removed. GAS cannot parse ES module syntax.
2. **Single output file**: GAS script projects require all code in flat files at the project root. Code splitting must be disabled by default.
3. **No minification by default**: GAS output must be human-readable for debugging in the Apps Script editor.
4. **Manifest must be copied**: `appsscript.json` must appear in the output directory for `clasp push` to succeed.
5. **No runtime footprint**: The plugin injects zero code into the user's GAS output. Tree-shake protection markers (`__GAS_GLOBALS__`) are injected during `transform` and removed in `generateBundle` — they never appear in final output.
6. **Post-processing only**: The plugin runs after all other plugins (`enforce: "post"`) and only during build (`apply: "build"`).
7. **Flat file output**: All files copied via `include` are flattened to basename only, since GAS projects require a flat file structure (`HtmlService.createHtmlOutputFromFile()` looks by name only).
8. **Backward compatibility**: All v0.1 projects work without configuration changes. New options (`include`, `globals`, `autoGlobals`) have safe defaults.

## Value Objects and Validation

- **`GasPluginOptions`** (defined in `src/types.ts`):
  - `manifest?: string` — path to `appsscript.json`, defaults to `"src/appsscript.json"`.
  - `include?: string[]` — glob patterns for additional files to copy flat to output, defaults to `[]`.
  - `globals?: string[]` — function names to protect from tree-shaking, defaults to `[]`.
  - `autoGlobals?: boolean` — auto-detect exported functions for tree-shake protection, defaults to `true`.
- Manifest path is resolved relative to the Vite root directory.
- Include patterns are resolved relative to the Vite root directory via `tinyglobby`.
- If manifest file does not exist, a warning is emitted (build does not fail).
- Filename collisions during include copy trigger a warning; first match wins.

## Persistence Touchpoints

| Location | Role |
|----------|------|
| `dist/Code.js` | Bundled GAS output (transforms applied) |
| `dist/appsscript.json` | Copied manifest for `clasp push` |
| `dist/*.html`, `dist/*.css`, etc. | Additional files copied via `include` |
| `src/appsscript.json` | Default manifest source location |

## Code Entry Points

| File | Role |
|------|------|
| `packages/gas-vite-plugin/src/index.ts` | Plugin factory function, Vite hooks (`config`, `configResolved`, `transform`, `generateBundle`, `closeBundle`), `detectNamesToProtect()` helper |
| `packages/gas-vite-plugin/src/transforms.ts` | Pure transform functions (`stripExportKeywords`, `removeExportBlocks`) |
| `packages/gas-vite-plugin/src/include.ts` | File resolution and copying (`resolveIncludeFiles`, `copyFilesFlat`) |
| `packages/gas-vite-plugin/src/types.ts` | `GasPluginOptions` interface definition |

## Related Use Cases

| Use Case | Doc Path |
|----------|----------|
| Export Stripping | `.specify/features/gas-vite-plugin/export-stripping.md` |
| Manifest Copy | `.specify/features/gas-vite-plugin/manifest-copy.md` |
| Build Defaults | `.specify/features/gas-vite-plugin/build-defaults.md` |
| Include Copy | `.specify/features/gas-vite-plugin/include-copy.md` |
| Globals Protection | `.specify/features/gas-vite-plugin/globals-protection.md` |

## Related Tests

| Test | Path |
|------|------|
| Unit: stripExportKeywords, removeExportBlocks | `packages/gas-vite-plugin/tests/transforms.test.ts` |
| Unit: resolveIncludeFiles, copyFilesFlat | `packages/gas-vite-plugin/tests/include.test.ts` |
| Integration: US1 basic build | `packages/gas-vite-plugin/tests/integration/build.test.ts` (US1 describe) |
| Integration: US2 manifest handling | `packages/gas-vite-plugin/tests/integration/build.test.ts` (US2 describe) |
| Integration: US3 build defaults | `packages/gas-vite-plugin/tests/integration/build.test.ts` (US3 describe) |
| Integration: US4 export edge cases | `packages/gas-vite-plugin/tests/integration/exports.test.ts` |
| Integration: US2 globals option | `packages/gas-vite-plugin/tests/integration/globals.test.ts` (US2 describe) |
| Integration: US3 autoGlobals toggle | `packages/gas-vite-plugin/tests/integration/globals.test.ts` (US3 describe) |
| Integration: US1 include option | `packages/gas-vite-plugin/tests/integration/include.test.ts` |
| Integration: US5 GAS web app | `packages/gas-vite-plugin/tests/integration/webapp.test.ts` |

## Change Impact

- Changing `transforms.ts` affects all output processing — rerun unit and integration tests.
- Changing `include.ts` affects file copying behavior — rerun include unit and integration tests.
- Changing `types.ts` (`GasPluginOptions`) is a breaking change for consumers.
- Changing Vite hook order (`enforce`, `apply`) can break the processing pipeline.
- Changing tree-shake protection logic (`detectNamesToProtect`, `GLOBALS_MARKER`) affects which functions survive in output.
- Vite major version upgrades may change `generateBundle` / `closeBundle` / `transform` APIs — test against `apps/gas-webapp`.
