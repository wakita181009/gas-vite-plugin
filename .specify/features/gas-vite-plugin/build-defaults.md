# Build Defaults

## Type and Purpose

- **Type**: command (build-time configuration)
- **Purpose**: Apply GAS-compatible Vite build defaults so projects work without manual configuration

## Spec Traceability

| Spec | Section |
|------|---------|
| `.specify/specs/001-gas-vite-plugin-v01/spec.md` | User Story 3, FR-005, FR-006 |

## Business Rules

1. `build.minify` is set to `false` by default. GAS output must be human-readable.
2. `build.rolldownOptions.output.codeSplitting` is set to `false` when the project is NOT using library mode and NOT using multiple inputs. This ensures all code lands in a single output file.
3. When the project uses library mode (`config.build.lib` is truthy) or multiple inputs (`Array.isArray(config.build.rolldownOptions.input)`), `codeSplitting` is left as `undefined` (Vite's default behavior).
4. Developer explicit overrides take precedence — the plugin merges its defaults under the user's config via the `config()` hook.

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
| `packages/gas-vite-plugin/src/index.ts` | `config()` hook returns default overrides using `rolldownOptions` |

## Endpoints / Interfaces

| Method | Path/Interface | Description |
|--------|---------------|-------------|
| `config(config): UserConfig` | Vite plugin hook in `index.ts` | Returns GAS-compatible build defaults via `rolldownOptions` |

## Persistence Touchpoints

No persistence — this use case only affects in-memory Vite configuration.

## Related Features

- `.specify/features/gas-vite-plugin/overview.md`
- `.specify/features/gas-vite-plugin/export-stripping.md` (single file output is prerequisite for correct stripping)

## Related Tests

| Test | Path |
|------|------|
| Output is not minified by default | `packages/gas-vite-plugin/tests/integration/build.test.ts` (US3) |
| Produces a single output file | `packages/gas-vite-plugin/tests/integration/build.test.ts` (US3) |

## Change Impact

- Changing `minify` default affects all consumers — document if ever changed.
- Changing `codeSplitting` logic can break multi-module GAS projects that rely on single-file output.
- Vite major version upgrades may deprecate or rename `codeSplitting` or `rolldownOptions` — check Vite changelog.
