# Include Copy

## Type and Purpose

- **Type**: command (build-time file operation)
- **Purpose**: Copy additional files (HTML, CSS, images, etc.) flat to the output directory for GAS web app deployment via `HtmlService.createHtmlOutputFromFile()`

## Spec Traceability

| Spec | Section |
|------|---------|
| `.specify/specs/002-gas-vite-plugin-v02/spec.md` | User Story 1, FR-001, FR-009, FR-010 |

## Business Rules

1. When `include` patterns are specified, resolve them via `tinyglobby` relative to Vite's `root`.
2. Matched files are copied flat (basename only) to the output directory — no subdirectory structure is preserved.
3. GAS requires flat file structure: `HtmlService.createHtmlOutputFromFile("index")` looks by name only.
4. Duplicate basenames from overlapping patterns trigger a `console.warn` with `[gas-vite-plugin]` prefix; first match wins.
5. Overlapping glob patterns that resolve to the same file are deduplicated (only copied once, no warning).
6. Empty `include` array or patterns matching no files — build succeeds with no errors.
7. Include copy runs in `closeBundle` after manifest copy and does not affect manifest behavior.

## Inputs and Outputs

**Inputs**:
- `options.include`: `string[]` (default `[]`) — glob patterns resolved via `tinyglobby`
- `rootDir`: string — Vite-resolved project root
- `outDir`: string — Vite-resolved output directory

**Outputs**:
- **Success**: Matched files are copied flat to the output directory
- **No matches**: Build succeeds silently
- **Filename collision**: Warning logged, duplicate skipped (first match wins)

## Error Mapping

| Condition | Error | Code/Status |
|-----------|-------|-------------|
| Filename collision | `console.warn("[gas-vite-plugin] filename collision: \"{name}\" from \"{path}\" skipped (already copied from \"{first}\")")` | Build succeeds |

## Dependencies

- `tinyglobby`: `globSync` for pattern resolution
- `node:fs`: `copyFileSync`
- `node:path`: `basename`, `resolve`

## Touched Files

| File | Role |
|------|------|
| `packages/gas-vite-plugin/src/include.ts` | `resolveIncludeFiles()` and `copyFilesFlat()` implementations |
| `packages/gas-vite-plugin/src/index.ts` | `closeBundle` hook calls include functions when patterns are configured |
| `packages/gas-vite-plugin/src/types.ts` | `include` option in `GasPluginOptions` interface |

## Endpoints / Interfaces

| Method | Path/Interface | Description |
|--------|---------------|-------------|
| `resolveIncludeFiles(patterns: string[], rootDir: string): string[]` | `include.ts` | Resolves glob patterns to deduplicated absolute file paths |
| `copyFilesFlat(files: string[], outDir: string): void` | `include.ts` | Copies files flat to output directory with collision detection |

## Persistence Touchpoints

| Source | Destination |
|--------|-------------|
| Files matched by `include` patterns | `{outDir}/{basename}` (flat copy) |

## Related Features

- `.specify/features/gas-vite-plugin/overview.md`
- `.specify/features/gas-vite-plugin/manifest-copy.md` (runs in same `closeBundle` hook, before include)

## Related Tests

| Test | Path |
|------|------|
| resolveIncludeFiles: single pattern | `packages/gas-vite-plugin/tests/include.test.ts` |
| resolveIncludeFiles: multiple patterns | `packages/gas-vite-plugin/tests/include.test.ts` |
| resolveIncludeFiles: no matches | `packages/gas-vite-plugin/tests/include.test.ts` |
| resolveIncludeFiles: empty patterns | `packages/gas-vite-plugin/tests/include.test.ts` |
| resolveIncludeFiles: deduplicates overlapping | `packages/gas-vite-plugin/tests/include.test.ts` |
| copyFilesFlat: copies to output | `packages/gas-vite-plugin/tests/include.test.ts` |
| copyFilesFlat: flattens subdirectories | `packages/gas-vite-plugin/tests/include.test.ts` |
| copyFilesFlat: warns on collision | `packages/gas-vite-plugin/tests/include.test.ts` |
| copyFilesFlat: handles empty list | `packages/gas-vite-plugin/tests/include.test.ts` |
| Integration: copies HTML flat to output | `packages/gas-vite-plugin/tests/integration/include.test.ts` |
| Integration: multiple patterns (HTML + CSS) | `packages/gas-vite-plugin/tests/integration/include.test.ts` |
| Integration: backward compatible (no include) | `packages/gas-vite-plugin/tests/integration/include.test.ts` |
| Integration: empty pattern match succeeds | `packages/gas-vite-plugin/tests/integration/include.test.ts` |
| Integration: web app with include | `packages/gas-vite-plugin/tests/integration/webapp.test.ts` |

## Change Impact

- Changing `resolveIncludeFiles` pattern handling affects all file resolution — rerun include tests.
- Changing `copyFilesFlat` collision behavior may affect users with overlapping patterns.
- Adding `tinyglobby` as a runtime dependency means version bumps could affect pattern matching behavior.
- GAS flat file constraint is fundamental; any change to copying logic must preserve flat output.
