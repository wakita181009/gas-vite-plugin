# Manifest Copy

## Type and Purpose

- **Type**: command (build-time file operation)
- **Purpose**: Copy `appsscript.json` manifest to the output directory so `clasp push` can deploy the project

## Spec Traceability

| Spec | Section |
|------|---------|
| 003-unplugin-migration (archived) | FR-003 |
| 001-gas-vite-plugin-v01 (archived) | US2, FR-004, FR-013 |

## Business Rules

1. The manifest source path defaults to `"src/appsscript.json"` and is resolved relative to the detected root directory.
2. The destination is always `<outDir>/appsscript.json`.
3. If the source file does not exist, a warning is emitted via `console.warn` — the build does not fail.
4. Copy runs during finalization: Vite `closeBundle`, Rollup `closeBundle`, webpack `afterEmit`, or `writeBundle` fallback (esbuild/Bun).

## Inputs and Outputs

**Inputs**:
- `options.manifest`: string (default `"src/appsscript.json"`) — relative path to manifest

**Outputs**:
- **Success**: `appsscript.json` present in output directory
- **Missing manifest**: Warning logged, build continues

## Error Mapping

| Condition | Error | Code/Status |
|-----------|-------|-------------|
| Manifest source not found | `console.warn` with path | Build continues (no failure) |

## Dependencies

- `node:fs`: `existsSync`, `copyFileSync`
- Root directory detection: varies per bundler (Vite `configResolved`, Rollup/esbuild `findRootDir`, webpack `compiler.options.context`)

## Touched Files

| File | Role |
|------|------|
| `packages/unplugin/src/index.ts` | `copyFiles()` private function |

## Endpoints / Interfaces

| Method | Path/Interface | Description |
|--------|---------------|-------------|
| `copyFiles()` | `index.ts` (private) | Copies manifest + include files to output directory |

## Persistence Touchpoints

- Reads `<rootDir>/<manifest>` (source)
- Writes `<outDir>/appsscript.json` (destination)

## Related Features

- `.specify/features/gas-unplugin/overview.md`
- `.specify/features/gas-unplugin/include-copy.md` (shares `copyFiles()` function)

## Related Tests

| Test | Path |
|------|------|
| Vite: copies appsscript.json to output | `packages/unplugin/tests/integration/vite.test.ts` |
| Rollup: copies appsscript.json to output | `packages/unplugin/tests/integration/rollup.test.ts` |
| esbuild: copies appsscript.json to output | `packages/unplugin/tests/integration/esbuild.test.ts` |

## Change Impact

- Changing the default manifest path is a breaking change for users relying on `src/appsscript.json`.
- Changing `copyFiles()` affects both manifest copy and include copy.
- Root directory detection differs per bundler — changes to `findRootDir` affect Rollup and esbuild.
