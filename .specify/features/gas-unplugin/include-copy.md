# Include Copy

## Type and Purpose

- **Type**: command (build-time file operation)
- **Purpose**: Copy additional files (matched by glob patterns) flat into the output directory for GAS `HtmlService` and other file-based APIs

## Spec Traceability

| Spec | Section |
|------|---------|
| 003-unplugin-migration (archived) | FR-004 |
| 002-gas-vite-plugin-v02 (archived) | US1, FR-001, FR-009, FR-010 |

## Business Rules

1. The `include` option accepts an array of glob patterns resolved relative to the root directory via `tinyglobby`.
2. Files are copied flat (basename only) to the output directory. GAS requires flat file structure for `HtmlService.createHtmlOutputFromFile()`.
3. When multiple glob patterns match the same file, deduplication ensures each file is copied once.
4. Filename collisions (different source paths with same basename) trigger a `console.warn`; the first match wins, subsequent files are skipped.
5. If `include` is empty (default), no additional files are copied.
6. Copy runs during finalization alongside manifest copy via the shared `copyFiles()` function.

## Inputs and Outputs

**Inputs**:
- `options.include`: `string[]` (default `[]`) — glob patterns

**Outputs**:
- **Success**: Matched files present in output directory (flat structure)
- **Collision**: Warning logged, first-match file wins

## Error Mapping

| Condition | Error | Code/Status |
|-----------|-------|-------------|
| Filename collision across patterns | `console.warn` with source paths | First match wins, duplicate skipped |
| Zero files matched | No warning, silent success | Build continues |

## Dependencies

- `packages/unplugin/src/core/include.ts`: `resolveIncludeFiles`, `copyFilesFlat`
- `tinyglobby`: `globSync` for pattern resolution

## Touched Files

| File | Role |
|------|------|
| `packages/unplugin/src/core/include.ts` | Glob resolution and flat copy logic |
| `packages/unplugin/src/index.ts` | `copyFiles()` calls include functions when patterns exist |

## Endpoints / Interfaces

| Method | Path/Interface | Description |
|--------|---------------|-------------|
| `resolveIncludeFiles(patterns, rootDir): string[]` | `core/include.ts` | Resolves glob patterns to absolute paths, deduplicates |
| `copyFilesFlat(files, outDir): void` | `core/include.ts` | Copies files flat with collision detection |

## Persistence Touchpoints

- Reads source files matched by glob patterns
- Writes flat copies to output directory

## Related Features

- `.specify/features/gas-unplugin/overview.md`
- `.specify/features/gas-unplugin/manifest-copy.md` (shares `copyFiles()` function)

## Related Tests

| Test | Path |
|------|------|
| Unit: resolveIncludeFiles with various patterns | `packages/unplugin/tests/core/include.test.ts` |
| Unit: copyFilesFlat with collision detection | `packages/unplugin/tests/core/include.test.ts` |
| Integration: Vite copies include files | `packages/unplugin/tests/integration/vite.test.ts` |

## Change Impact

- Changing glob resolution behavior affects which files are copied across all bundlers.
- Changing flat copy logic affects file naming in GAS projects — `HtmlService` relies on basename lookups.
- Switching from `tinyglobby` to another glob library requires verifying pattern compatibility.
