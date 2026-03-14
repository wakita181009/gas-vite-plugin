# Multi-Bundler Dispatch

## Type and Purpose

- **Type**: lifecycle (cross-cutting build orchestration)
- **Purpose**: Route plugin hooks to the correct framework-specific implementation and prevent double processing across bundler boundaries

## Spec Traceability

| Spec | Section |
|------|---------|
| 003-unplugin-migration (archived) | FR-001, FR-008, US1–US7 |
| `.specify/memory/design-decisions.md` | Two-tier hook strategy (003-D1), Export stripping per bundler (003-D2), Root/outDir resolution (003-D3) |

## Business Rules

1. The plugin uses unplugin v3 `createUnplugin` to create a single factory that exposes `.vite`, `.rollup`, `.webpack`, `.esbuild`, `.bun` adapters.
2. Each bundler adapter is exposed via a subpath export: `@gas-plugin/unplugin/vite`, `@gas-plugin/unplugin/rollup`, etc.
3. The `transform` hook is universal — it runs for all bundlers via unplugin's `transform.filter` API (filters to `.js`/`.ts`/`.jsx`/`.tsx`, excludes virtual modules).
4. A `handledByFramework` boolean flag prevents the `writeBundle` fallback from running when Vite, Rollup, or webpack already handled post-processing and file copy in their own hooks.
5. **Root directory detection** varies per bundler:
   - Vite: `configResolved.root`
   - Rollup: `findRootDir(firstInput, manifest)` via `options` hook
   - webpack: `compiler.options.context`
   - esbuild: `findRootDir(firstEntry, manifest)` via `setup`
6. **Output directory detection** varies per bundler:
   - Vite: `configResolved.build.outDir`
   - Rollup: `outputOptions.dir` (absolute path set directly)
   - webpack: `compiler.options.output.path`
   - esbuild: `opts.outdir` or `dirname(opts.outfile)`
7. **Post-processing strategy** varies:
   - Vite/Rollup: In-memory via `generateBundle` → `processBundle()`
   - webpack/esbuild/Bun: On-disk via `postProcessOutputFiles()`
8. **Finalization** runs `warnUnmatchedGlobals()` + `copyFiles()` at the appropriate hook per bundler.

## Inputs and Outputs

**Inputs**:
- `GasPluginOptions` — shared across all bundlers
- Framework-specific config objects (Vite `UserConfig`, Rollup `InputOptions`, webpack `Compiler`, esbuild `PluginBuild`)

**Outputs**:
- GAS-compatible output in the bundler's output directory
- `appsscript.json` and include files copied

## Error Mapping

No dedicated error conditions — each bundler path delegates to shared functions that handle their own warnings.

## Dependencies

- `unplugin` v3: `createUnplugin` factory
- `packages/unplugin/src/core/utils.ts`: `extractFirstInput`, `findRootDir`, `processBundle`
- All core modules for actual processing

## Touched Files

| File | Role |
|------|------|
| `packages/unplugin/src/index.ts` | `unpluginFactory` with `vite`, `rollup`, `webpack`, `esbuild` hook blocks; `handledByFramework` guard; `writeBundle` fallback |
| `packages/unplugin/src/vite.ts` | Thin adapter: `unplugin.vite` default export |
| `packages/unplugin/src/rollup.ts` | Thin adapter: `unplugin.rollup` default export |
| `packages/unplugin/src/webpack.ts` | Thin adapter: `unplugin.webpack` default export |
| `packages/unplugin/src/esbuild.ts` | Thin adapter: `unplugin.esbuild` default export |
| `packages/unplugin/src/bun.ts` | Thin adapter: `unplugin.bun` default export |
| `packages/unplugin/src/core/utils.ts` | `extractFirstInput`, `findRootDir` for Rollup/esbuild root detection |

## Endpoints / Interfaces

| Method | Path/Interface | Description |
|--------|---------------|-------------|
| `unpluginFactory(options): UnpluginOptions` | `index.ts` | Creates the universal plugin instance |
| `createUnplugin(factory)` | `index.ts` | unplugin v3 factory — generates `.vite`, `.rollup`, `.webpack`, `.esbuild`, `.bun` |
| Subpath exports | `package.json` `exports` field | `./vite`, `./rollup`, `./webpack`, `./esbuild`, `./bun` |

## Persistence Touchpoints

No direct persistence — delegates to `copyFiles()` and `postProcessOutputFiles()`.

## Related Features

- `.specify/features/gas-unplugin/overview.md`
- `.specify/features/gas-unplugin/build-defaults.md` (Vite-specific config hook)
- `.specify/features/gas-unplugin/export-stripping.md` (post-processing varies by bundler)

## Related Tests

| Test | Path |
|------|------|
| Subpath exports return valid factories | `packages/unplugin/tests/exports.test.ts` |
| Integration: Vite full build | `packages/unplugin/tests/integration/vite.test.ts` |
| Integration: Rollup full build | `packages/unplugin/tests/integration/rollup.test.ts` |
| Integration: esbuild full build | `packages/unplugin/tests/integration/esbuild.test.ts` |
| Unit: extractFirstInput (various formats) | `packages/unplugin/tests/core/utils.test.ts` |
| Unit: findRootDir (ancestor traversal) | `packages/unplugin/tests/core/utils.test.ts` |

## Change Impact

- Adding a new bundler requires: adapter file in `src/`, entry in `vite.config.ts` build, `package.json` exports, optional peer dependency.
- Changing `handledByFramework` logic can cause double processing or missed processing.
- Changing root/outDir detection for one bundler does not affect others (isolated per framework block).
- unplugin major version upgrades may change the factory signature or available hooks.
- Changing `extractFirstInput` affects both Rollup and esbuild root detection.
