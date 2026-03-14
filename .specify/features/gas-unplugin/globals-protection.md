# Globals Protection

## Type and Purpose

- **Type**: command (build-time tree-shake protection)
- **Purpose**: Prevent designated functions from being tree-shaken by the bundler, ensuring they remain as top-level declarations callable by GAS

## Spec Traceability

| Spec | Section |
|------|---------|
| 003-unplugin-migration (archived) | FR-005, FR-006 |
| 002-gas-vite-plugin-v02 (archived) | US2 (globals), US3 (autoGlobals), FR-002, FR-003 |

## Business Rules

1. The `globals` option lists function names to explicitly protect from tree-shaking.
2. When `autoGlobals` is `true` (default), exported functions are automatically detected via regex and added to the protection list alongside any explicit `globals`.
3. When `autoGlobals` is `false`, only functions explicitly listed in `globals` are protected. Export keyword removal still runs regardless.
4. Protection is implemented in the universal `transform` hook by injecting `/* __GAS_GLOBALS__ */ globalThis.__gas_keep__ = [name1, name2];` — recognized by bundlers as a side effect.
5. Only names that are actually declared in the module (via `function`, `const`, `let`, `var`, or `class`) are injected — unknown names are filtered out per-module.
6. Deduplication: if a name appears in both `globals` and is auto-detected, it is injected only once.
7. All `__GAS_GLOBALS__` markers are removed during `postProcessBundle()` before export stripping — they never appear in final output.
8. Virtual modules (`\0`-prefixed IDs) and non-JS/TS files are skipped via `transform.filter`.
9. **Unmatched globals warning**: The factory tracks which explicit `globals` names matched across all modules via a `matchedGlobals` Set. At build finalization, any unmatched names trigger a `console.warn` per name: `globals: "{name}" was not found in any source module`.

## Inputs and Outputs

**Inputs**:
- `options.globals`: `string[]` (default `[]`) — explicit function names to protect
- `options.autoGlobals`: `boolean` (default `true`) — auto-detect exported functions
- `code`: string — source code of each module during `transform`

**Outputs**:
- **Transform success**: Source code with `__GAS_GLOBALS__` marker appended (if names to protect exist)
- **No names to protect**: Source code returned unchanged
- **Post-process cleanup**: All markers removed from output
- **Unmatched globals**: Warning logged at build finalization

## Error Mapping

| Condition | Error | Code/Status |
|-----------|-------|-------------|
| Explicit global not declared in any module | `console.warn` at finalization | Build continues |

## Dependencies

- `packages/unplugin/src/core/globals.ts`: `detectNamesToProtect`
- `packages/unplugin/src/core/post-process.ts`: marker removal in `postProcessBundle`

## Touched Files

| File | Role |
|------|------|
| `packages/unplugin/src/core/globals.ts` | `detectNamesToProtect()` — merges explicit + auto-detected globals, filters to declared names |
| `packages/unplugin/src/index.ts` | `transform` hook (injection + matchedGlobals tracking), `warnUnmatchedGlobals()` at finalization points |
| `packages/unplugin/src/core/post-process.ts` | `GLOBALS_MARKER_RE` removal in `postProcessBundle()` |
| `packages/unplugin/src/core/types.ts` | `globals` and `autoGlobals` options in `GasPluginOptions` |

## Endpoints / Interfaces

| Method | Path/Interface | Description |
|--------|---------------|-------------|
| `detectNamesToProtect(code, globals, autoGlobals): string[]` | `core/globals.ts` | Merges explicit globals with auto-detected exports, filters to declared names |
| `transform.handler(code)` | unplugin universal hook in `index.ts` | Injects `globalThis.__gas_keep__` side-effect reference, tracks matched globals |
| `warnUnmatchedGlobals()` | `index.ts` (private) | Warns about explicit globals not found in any module |

## Persistence Touchpoints

No persistence — injection is in-memory during build. Markers removed before output is written.

## Related Features

- `.specify/features/gas-unplugin/overview.md`
- `.specify/features/gas-unplugin/export-stripping.md` (runs after marker cleanup)

## Related Tests

| Test | Path |
|------|------|
| Unit: auto-detect exported functions | `packages/unplugin/tests/core/globals.test.ts` |
| Unit: filter undeclared globals | `packages/unplugin/tests/core/globals.test.ts` |
| Unit: deduplication | `packages/unplugin/tests/core/globals.test.ts` |
| Unit: regex safety | `packages/unplugin/tests/core/globals.test.ts` |
| Integration: Vite globals protection | `packages/unplugin/tests/integration/vite.test.ts` |
| Integration: Rollup globals protection | `packages/unplugin/tests/integration/rollup.test.ts` |

## Change Impact

- Changing `detectNamesToProtect` regex affects auto-detection — may cause functions to be unexpectedly tree-shaken.
- Changing `GLOBALS_MARKER` format requires coordinated changes in `transform` hook and `post-process.ts`.
- Changing `globalThis.__gas_keep__` mechanism may affect bundler compatibility.
- The `matchedGlobals` tracking is factory-level state — shared across all `transform` calls within a single build.
