# Export Stripping

## Type and Purpose

- **Type**: command (build-time output transformation)
- **Purpose**: Remove all ES module export syntax from bundled output so GAS can execute the code

## Spec Traceability

| Spec | Section |
|------|---------|
| 003-unplugin-migration (archived) | FR-002 |
| 001-gas-vite-plugin-v01 (archived) | US1, FR-001–003 |
| 002-gas-vite-plugin-v02 (archived) | US4, FR-004–008 |

## Business Rules

1. `stripExportKeywords()` removes inline `export` from declarations: `function`, `async function`, `const`, `let`, `var`, `class`, `abstract class`.
2. `removeExportBlocks()` removes `export { ... };` blocks entirely.
3. `removeExportBlocks()` strips `export default` from named function/class declarations, preserving the declaration as a top-level statement.
4. `removeExportBlocks()` converts remaining `export default <expr>` into `const __gas_default__ = <expr>`.
5. `postProcessBundle()` first removes `__GAS_GLOBALS__` markers, then calls `stripExportKeywords()`, then `removeExportBlocks()`, then normalizes trailing newlines.
6. For Vite and Rollup, post-processing runs in-memory via `generateBundle` hook (`processBundle()`).
7. For webpack and esbuild/Bun, post-processing runs on disk via `postProcessOutputFiles()`.
8. Only `.js`, `.ts`, `.jsx`, `.tsx` files in the output directory are processed.

## Inputs and Outputs

**Inputs**:
- `code`: string — bundled JavaScript content

**Outputs**:
- **Success**: Code string with all export syntax removed and trailing newline normalized

## Error Mapping

No error conditions — all transforms are pure string operations.

## Dependencies

- `packages/unplugin/src/core/transforms.ts`: `stripExportKeywords`, `removeExportBlocks`
- `packages/unplugin/src/core/post-process.ts`: `postProcessBundle` (orchestrates marker removal + export stripping)
- `packages/unplugin/src/core/utils.ts`: `processBundle` (iterates Vite/Rollup bundle chunks)

## Touched Files

| File | Role |
|------|------|
| `packages/unplugin/src/core/transforms.ts` | Pure string transform functions |
| `packages/unplugin/src/core/post-process.ts` | Orchestrates marker removal + export stripping + newline normalization |
| `packages/unplugin/src/core/utils.ts` | `processBundle()` iterates Vite/Rollup bundle chunks in-memory |
| `packages/unplugin/src/index.ts` | `generateBundle` hooks (Vite/Rollup), `postProcessOutputFiles()` (webpack/esbuild/Bun) |

## Endpoints / Interfaces

| Method | Path/Interface | Description |
|--------|---------------|-------------|
| `stripExportKeywords(code): string` | `core/transforms.ts` | Removes inline export keywords |
| `removeExportBlocks(code): string` | `core/transforms.ts` | Removes export blocks and default exports |
| `postProcessBundle(code): string` | `core/post-process.ts` | Full post-processing pipeline |
| `processBundle(bundle): void` | `core/utils.ts` | Applies post-processing to all chunks in a Vite/Rollup bundle |

## Persistence Touchpoints

- Reads/writes `.js`/`.ts` files in output directory (webpack/esbuild/Bun path via `postProcessOutputFiles`)
- Modifies bundle chunks in-memory (Vite/Rollup path via `processBundle`)

## Related Features

- `.specify/features/gas-unplugin/overview.md`
- `.specify/features/gas-unplugin/globals-protection.md` (marker removal runs before export stripping)
- `.specify/features/gas-unplugin/build-defaults.md` (single file output is prerequisite for correct stripping)

## Related Tests

| Test | Path |
|------|------|
| Unit: strip inline exports (7 patterns) | `packages/unplugin/tests/core/transforms.test.ts` |
| Unit: remove export blocks, default exports | `packages/unplugin/tests/core/transforms.test.ts` |
| Unit: postProcessBundle pipeline | `packages/unplugin/tests/core/post-process.test.ts` |
| Unit: processBundle on chunk objects | `packages/unplugin/tests/core/utils.test.ts` |
| Integration: Vite strips exports | `packages/unplugin/tests/integration/vite.test.ts` |
| Integration: Rollup strips exports | `packages/unplugin/tests/integration/rollup.test.ts` |
| Integration: esbuild strips exports | `packages/unplugin/tests/integration/esbuild.test.ts` |

## Change Impact

- Changing transform regexes can cause exports to leak into GAS output — GAS will fail to load the project.
- Changing `postProcessBundle` ordering (marker removal before export stripping) can cause `__GAS_GLOBALS__` to appear in output.
- Adding new export syntaxes (e.g., `export * from`) requires adding new patterns to transforms.
