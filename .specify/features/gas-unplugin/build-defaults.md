# Build Defaults

## Type and Purpose

- **Type**: command (build-time configuration)
- **Purpose**: Apply GAS-compatible build defaults so projects work without manual configuration

## Spec Traceability

| Spec | Section |
|------|---------|
| 003-unplugin-migration (archived) | FR-010 |
| 001-gas-vite-plugin-v01 (archived) | US3, FR-005, FR-006 |

## Business Rules

1. `build.minify` is set to `false` by default. GAS output must be human-readable. User-specified `minify` value takes precedence.
2. **Vite 8+ (Rolldown-based)**: `build.rolldownOptions.output.codeSplitting` is set to `false` when not in library mode and not using multiple inputs.
3. **Vite 5/6/7 (Rollup-based)**: `build.rollupOptions.output.inlineDynamicImports` is set to `true` under the same conditions, preventing chunk splitting.
4. The `config()` hook returns both `rolldownOptions` and `rollupOptions` in the config object. Vite picks up whichever is relevant for its version and ignores the other.
5. When using library mode (`config.build.lib` is truthy) or multiple inputs, splitting options are left as `undefined`.
6. Developer explicit overrides take precedence — the plugin merges its defaults under the user's config.
7. Build defaults are Vite-specific. Rollup, webpack, and esbuild users must configure their bundler directly.

## Inputs and Outputs

**Inputs**:
- `config`: Vite `UserConfig` — the current configuration being resolved

**Outputs**:
- **Success**: Partial `UserConfig` with GAS-friendly defaults that Vite merges with user config

## Error Mapping

No error conditions — configuration merging always succeeds.

## Dependencies

- Vite `config()` hook — called during config resolution, before build starts

## Touched Files

| File | Role |
|------|------|
| `packages/unplugin/src/index.ts` | `vite.config()` hook returns default overrides for both `rolldownOptions` and `rollupOptions` |

## Endpoints / Interfaces

| Method | Path/Interface | Description |
|--------|---------------|-------------|
| `vite.config(config): UserConfig` | Vite plugin hook in `index.ts` | Returns GAS-compatible build defaults |

## Persistence Touchpoints

No persistence — this use case only affects in-memory Vite configuration.

## Related Features

- `.specify/features/gas-unplugin/overview.md`
- `.specify/features/gas-unplugin/export-stripping.md` (single file output is prerequisite for correct stripping)

## Related Tests

| Test | Path |
|------|------|
| Output is not minified by default | `packages/unplugin/tests/integration/vite.test.ts` |

## Change Impact

- Changing `minify` default affects all Vite consumers.
- Changing `codeSplitting`/`inlineDynamicImports` logic can break multi-module GAS projects relying on single-file output.
- Vite major version upgrades may deprecate or rename these options. The dual `rolldownOptions`/`rollupOptions` approach covers Vite 5 through 8+.
- This use case does NOT apply to Rollup/webpack/esbuild/Bun — those bundlers must be configured by the user.
