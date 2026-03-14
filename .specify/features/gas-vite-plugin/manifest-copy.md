# Manifest Copy

## Type and Purpose

- **Type**: command (build-time file operation)
- **Purpose**: Copy `appsscript.json` to the output directory so `clasp push` can deploy both code and manifest together

## Spec Traceability

| Spec | Section |
|------|---------|
| 001-gas-vite-plugin-v01 (archived) | User Story 2, FR-004, FR-013 |
| 002-gas-vite-plugin-v02 (archived) | FR-010 (include must not affect manifest copy) |

## Business Rules

1. After the bundle is written, copy `appsscript.json` from the configured source path to `dist/appsscript.json`.
2. The source path defaults to `"src/appsscript.json"` and is configurable via `GasPluginOptions.manifest`.
3. The path is resolved relative to the Vite root directory (not `process.cwd()`).
4. If the source file does not exist, emit a `console.warn` with `[gas-vite-plugin]` prefix. Do NOT fail the build.
5. Manifest copy runs in the `closeBundle` hook before `include` file copying, and is independent of the `include` option.

## Inputs and Outputs

**Inputs**:
- `options.manifest`: string (default `"src/appsscript.json"`) — relative path to manifest
- `rootDir`: string — Vite-resolved project root

**Outputs**:
- **Success**: `dist/appsscript.json` exists as an exact copy of the source
- **Missing source**: Warning logged, `dist/appsscript.json` does not exist

## Error Mapping

| Condition | Error | Code/Status |
|-----------|-------|-------------|
| Manifest file not found | `console.warn("[gas-vite-plugin] manifest not found: {path}. Skipping copy.")` | Build succeeds |

## Dependencies

- `node:fs`: `existsSync`, `copyFileSync`
- `node:path`: `resolve`

## Touched Files

| File | Role |
|------|------|
| `packages/gas-vite-plugin/src/index.ts` | `closeBundle` hook implements the copy logic |

## Endpoints / Interfaces

| Method | Path/Interface | Description |
|--------|---------------|-------------|
| `closeBundle()` | Vite plugin hook in `index.ts` | Copies manifest after bundle is written, then copies include files |

## Persistence Touchpoints

| Source | Destination |
|--------|-------------|
| `{rootDir}/{manifest}` | `{rootDir}/dist/appsscript.json` |

## Related Features

- `.specify/features/gas-vite-plugin/overview.md`
- `.specify/features/gas-vite-plugin/include-copy.md` (runs in same `closeBundle` hook, after manifest)

## Related Tests

| Test | Path |
|------|------|
| Copies manifest from default location | `packages/gas-vite-plugin/tests/integration/build.test.ts` (US2) |
| Copies manifest from custom path | `packages/gas-vite-plugin/tests/integration/build.test.ts` (US2) |
| Warns when manifest is missing | `packages/gas-vite-plugin/tests/integration/build.test.ts` (US2) |
| Backward compatible: no include = only appsscript.json copied | `packages/gas-vite-plugin/tests/integration/include.test.ts` |

## Change Impact

- Changing the default manifest path is a breaking change for consumers relying on convention.
- Changing from `copyFileSync` to async copy would require moving from `closeBundle` to an async-compatible hook.
