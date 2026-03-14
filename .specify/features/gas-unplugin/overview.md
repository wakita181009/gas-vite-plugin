# @gas-plugin/unplugin — Overview

## Purpose and Scope

A universal bundler plugin (via unplugin v3) that transforms standard TypeScript/JavaScript modules into Google Apps Script (GAS)-compatible output. Supports Vite 5–8+, Rollup 4+, webpack 5+, esbuild 0.17+, and Bun. Distributed as a single package `@gas-plugin/unplugin` with subpath exports per bundler.

The plugin removes all `export`/`import` statements from bundled output, copies the `appsscript.json` manifest and additional files, protects designated functions from tree-shaking, and applies GAS-friendly build defaults. It supersedes `gas-vite-plugin` with identical behavior for Vite users and extends to all major bundlers.

Scope boundary: post-bundle transformations, tree-shake protection, file copying, and build configuration only. Does not perform TypeScript compilation, arrow function conversion, or `console.log` rewriting.

## Business Invariants

1. **Zero `export`/`import` in output**: Every chunk must have all `export` keywords stripped and all `export { ... }` blocks removed. GAS cannot parse ES module syntax.
2. **Single output file**: GAS script projects require all code in flat files at the project root. Code splitting is disabled by default.
3. **No minification by default**: GAS output must be human-readable for debugging in the Apps Script editor.
4. **Manifest must be copied**: `appsscript.json` must appear in the output directory for `clasp push` to succeed.
5. **No runtime footprint**: Tree-shake protection markers (`__GAS_GLOBALS__`) are injected during `transform` and removed during post-processing — they never appear in final output.
6. **Flat file output**: All files copied via `include` are flattened to basename only (GAS requires flat structure for `HtmlService.createHtmlOutputFromFile()`).
7. **Bundler-agnostic core**: Core transforms (`stripExportKeywords`, `removeExportBlocks`, `postProcessBundle`) are pure functions shared across all bundlers.
8. **Framework-specific hooks**: Each bundler has dedicated hooks for root/outDir detection, bundle post-processing, and file copy. A `handledByFramework` guard prevents double processing.
9. **Unmatched globals warning**: Explicitly specified `globals` names not found in any source module emit a warning at build completion.

## Value Objects and Validation

- **`GasPluginOptions`** (defined in `src/core/types.ts`):
  - `manifest?: string` — path to `appsscript.json`, defaults to `"src/appsscript.json"`.
  - `include?: string[]` — glob patterns for additional files to copy flat to output, defaults to `[]`.
  - `globals?: string[]` — function names to protect from tree-shaking, defaults to `[]`.
  - `autoGlobals?: boolean` — auto-detect exported functions for tree-shake protection, defaults to `true`.
- Manifest path is resolved relative to the detected root directory.
- Include patterns are resolved relative to the root directory via `tinyglobby`.
- If manifest file does not exist, a warning is emitted (build does not fail).
- Filename collisions during include copy trigger a warning; first match wins.

## Lifecycle / State Machine

```
Plugin Init
  └─► transform (per module)
        ├─ detect globals → inject __gas_keep__ marker
        └─ track matchedGlobals
  └─► [Framework-specific hooks]
        ├─ Vite: config → configResolved → generateBundle → closeBundle
        ├─ Rollup: options → outputOptions → generateBundle → closeBundle
        ├─ webpack: compiler.hooks.afterEmit
        └─ esbuild/Bun: setup → writeBundle (fallback)
  └─► Finalization (per framework path)
        ├─ warnUnmatchedGlobals()
        ├─ postProcessBundle() — strip markers, strip exports
        └─ copyFiles() — manifest + include files
```

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
| `packages/unplugin/src/index.ts` | Plugin factory (`unpluginFactory`), all framework hooks, re-exports |
| `packages/unplugin/src/core/transforms.ts` | Pure transforms (`stripExportKeywords`, `removeExportBlocks`) |
| `packages/unplugin/src/core/include.ts` | File resolution and copying (`resolveIncludeFiles`, `copyFilesFlat`) |
| `packages/unplugin/src/core/globals.ts` | Globals detection (`detectNamesToProtect`) |
| `packages/unplugin/src/core/post-process.ts` | Bundle post-processing (`postProcessBundle`) |
| `packages/unplugin/src/core/utils.ts` | Utilities (`extractFirstInput`, `findRootDir`, `processBundle`) |
| `packages/unplugin/src/core/types.ts` | `GasPluginOptions`, `WebpackCompiler` interfaces |
| `packages/unplugin/src/vite.ts` | Vite adapter entry (`unplugin.vite`) |
| `packages/unplugin/src/rollup.ts` | Rollup adapter entry (`unplugin.rollup`) |
| `packages/unplugin/src/webpack.ts` | webpack adapter entry (`unplugin.webpack`) |
| `packages/unplugin/src/esbuild.ts` | esbuild adapter entry (`unplugin.esbuild`) |
| `packages/unplugin/src/bun.ts` | Bun adapter entry (`unplugin.bun`) |

## Related Use Cases

| Use Case | Doc Path |
|----------|----------|
| Export Stripping | `.specify/features/gas-unplugin/export-stripping.md` |
| Manifest Copy | `.specify/features/gas-unplugin/manifest-copy.md` |
| Build Defaults | `.specify/features/gas-unplugin/build-defaults.md` |
| Include Copy | `.specify/features/gas-unplugin/include-copy.md` |
| Globals Protection | `.specify/features/gas-unplugin/globals-protection.md` |
| Multi-Bundler Dispatch | `.specify/features/gas-unplugin/multi-bundler-dispatch.md` |

## Related Tests

| Test | Path |
|------|------|
| Unit: stripExportKeywords, removeExportBlocks | `packages/unplugin/tests/core/transforms.test.ts` |
| Unit: resolveIncludeFiles, copyFilesFlat | `packages/unplugin/tests/core/include.test.ts` |
| Unit: detectNamesToProtect | `packages/unplugin/tests/core/globals.test.ts` |
| Unit: postProcessBundle | `packages/unplugin/tests/core/post-process.test.ts` |
| Unit: extractFirstInput, findRootDir, processBundle | `packages/unplugin/tests/core/utils.test.ts` |
| Integration: Vite builds | `packages/unplugin/tests/integration/vite.test.ts` |
| Integration: Rollup builds | `packages/unplugin/tests/integration/rollup.test.ts` |
| Integration: esbuild builds | `packages/unplugin/tests/integration/esbuild.test.ts` |
| Subpath exports verification | `packages/unplugin/tests/exports.test.ts` |

## Change Impact

- Changing `core/transforms.ts` affects all bundler output — rerun all unit and integration tests.
- Changing `core/include.ts` affects file copying behavior across all bundlers.
- Changing `core/types.ts` (`GasPluginOptions`) is a breaking change for all consumers.
- Changing `core/globals.ts` affects which functions survive tree-shaking.
- Changing `core/post-process.ts` affects marker cleanup and export stripping order.
- Changing `core/utils.ts` affects root/outDir detection for Rollup and esbuild.
- Changing framework-specific hooks in `index.ts` requires testing the affected bundler.
- Vite major version upgrades may change `rolldownOptions`/`rollupOptions` APIs — the `config` hook handles both Vite 5-7 (`rollupOptions`) and Vite 8+ (`rolldownOptions`).
- unplugin major version upgrades may change the factory API or hook signatures.
