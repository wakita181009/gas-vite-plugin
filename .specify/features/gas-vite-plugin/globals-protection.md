# Globals Protection

## Type and Purpose

- **Type**: command (build-time tree-shake protection)
- **Purpose**: Prevent designated functions from being tree-shaken by the bundler, ensuring they remain as top-level declarations callable by GAS

## Spec Traceability

| Spec | Section |
|------|---------|
| 002-gas-vite-plugin-v02 (archived) | User Story 2 (globals), User Story 3 (autoGlobals), FR-002, FR-003 |

## Business Rules

1. The `globals` option lists function names to explicitly protect from tree-shaking. These functions are kept as top-level declarations even if not exported or used.
2. When `autoGlobals` is `true` (default), exported functions are automatically detected via a regex (`EXPORT_PATTERN`) and added to the protection list alongside any explicit `globals`.
3. When `autoGlobals` is `false`, only functions explicitly listed in `globals` are protected. Export keyword removal still runs regardless.
4. Protection is implemented in the `transform` hook by injecting `/* __GAS_GLOBALS__ */ globalThis.__gas_keep__ = [name1, name2];` which the bundler recognizes as a side effect.
5. Only names that are actually declared in the module (via `function`, `const`, `let`, `var`, or `class`) are injected — unknown names from the `globals` list are silently filtered out.
6. Deduplication: if a name appears in both `globals` and is auto-detected from exports, it is injected only once.
7. All injected `__GAS_GLOBALS__` markers are removed in `generateBundle` before export stripping runs — they never appear in final output.
8. Virtual modules (`\0`-prefixed IDs) and non-JS/TS files are skipped in the `transform` hook.

## Inputs and Outputs

**Inputs**:
- `options.globals`: `string[]` (default `[]`) — explicit function names to protect
- `options.autoGlobals`: `boolean` (default `true`) — auto-detect exported functions
- `code`: string — source code of each module during `transform`
- `id`: string — module identifier

**Outputs**:
- **Transform success**: Source code with `__GAS_GLOBALS__` marker appended (if names to protect exist)
- **No names to protect**: Source code returned unchanged (no injection)
- **GenerateBundle cleanup**: All markers removed from chunks

## Error Mapping

No error conditions — detection and injection are pure string operations.

## Dependencies

- `packages/gas-vite-plugin/src/index.ts`: `detectNamesToProtect()` helper, `transform` hook, `generateBundle` hook

## Touched Files

| File | Role |
|------|------|
| `packages/gas-vite-plugin/src/index.ts` | `EXPORT_PATTERN` regex, `detectNamesToProtect()`, `transform` hook (injection), `generateBundle` hook (cleanup) |
| `packages/gas-vite-plugin/src/types.ts` | `globals` and `autoGlobals` options in `GasPluginOptions` |

## Endpoints / Interfaces

| Method | Path/Interface | Description |
|--------|---------------|-------------|
| `detectNamesToProtect(code, globals, autoGlobals): string[]` | `index.ts` (module-level function) | Merges explicit globals with auto-detected exports, filters to names declared in the module |
| `transform(code, id)` | Vite plugin hook in `index.ts` | Injects `globalThis.__gas_keep__` side-effect reference |
| `generateBundle(_, bundle)` | Vite plugin hook in `index.ts` | Removes injected markers before export stripping |

## Persistence Touchpoints

No persistence — all injection is in-memory during build. Markers are removed before output is written.

## Related Features

- `.specify/features/gas-vite-plugin/overview.md`
- `.specify/features/gas-vite-plugin/export-stripping.md` (runs after marker cleanup in `generateBundle`)

## Related Tests

| Test | Path |
|------|------|
| Non-exported function survives tree-shaking via globals | `packages/gas-vite-plugin/tests/integration/globals.test.ts` (US2) |
| Silently ignores function names not found in bundle | `packages/gas-vite-plugin/tests/integration/globals.test.ts` (US2) |
| No duplicate when function is both exported and in globals | `packages/gas-vite-plugin/tests/integration/globals.test.ts` (US2) |
| autoGlobals: false — exports stripped but no tree-shake protection | `packages/gas-vite-plugin/tests/integration/globals.test.ts` (US3) |
| autoGlobals: false with explicit globals — only listed function protected | `packages/gas-vite-plugin/tests/integration/globals.test.ts` (US3) |
| Web app: getData/saveData survive via globals | `packages/gas-vite-plugin/tests/integration/webapp.test.ts` (US5) |

## Change Impact

- Changing `EXPORT_PATTERN` regex affects auto-detection of exports — may cause functions to be unexpectedly tree-shaken.
- Changing `GLOBALS_MARKER` format requires coordinated changes in both `transform` and `generateBundle` hooks.
- Changing from `globalThis.__gas_keep__` to a different side-effect mechanism may affect bundler compatibility.
- Changing `detectNamesToProtect` filtering logic can cause false positives (injecting non-existent names) or false negatives (missing valid names).
