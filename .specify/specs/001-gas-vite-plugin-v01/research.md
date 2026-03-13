# Research: gas-vite-plugin v0.1

## R-001: Vite library mode output patterns

**Decision**: Rely on Vite library mode's predictable output format for regex-based transforms.

**Rationale**: Vite library mode (ES format) compiles `export function foo() {}` into:
```javascript
function foo() { ... }
export { foo };
```
This means:
1. Function declarations are already at top level (no wrapping)
2. Exports are collected into `export { ... }` blocks at the end
3. Inline `export function` may also appear in some cases

Our two transform functions handle both patterns:
- `stripExportKeywords`: Removes `export` prefix from inline declarations
- `removeExportBlocks`: Removes `export { ... }` aggregation blocks

**Alternatives considered**:
- AST-based transform (e.g., using acorn/babel): More robust but adds ~500KB dependency. Overkill for line-level patterns that Vite already structures cleanly.
- `gas-entry-generator` (used by gas-webpack-plugin, rollup-plugin-google-apps-script): Requires `global.xxx = ...` pattern. Worse DX — we want `export function` to just work.

## R-002: Test framework choice

**Decision**: Vitest

**Rationale**:
- Native Vite integration (same config, same transforms)
- Supports ESM natively (no CJS workarounds)
- Built-in coverage via v8 provider
- Already standard in the Vite ecosystem
- Can run actual Vite builds inside tests via `vite.build()` API

**Alternatives considered**:
- Jest: Requires extra ESM configuration, not Vite-native
- Node test runner: Minimal, but no built-in coverage; less ecosystem support

## R-003: Vite config merge behavior

**Decision**: Use Vite's `config` hook return value for defaults. User config takes precedence.

**Rationale**: Vite's `config` hook merges the returned object with the user's config. The user's explicit values win. This means:
- `build.minify: false` from plugin is overridden if user sets `build.minify: true`
- No need for custom merge logic

Verified in Vite source: plugin `config()` return is deep-merged, with user config having higher priority for scalar values.

## R-004: Manifest copy timing

**Decision**: Use `closeBundle` hook (not `generateBundle`) for manifest copy.

**Rationale**:
- `closeBundle` runs after all output files are written
- Uses synchronous `copyFileSync` — simple and reliable
- Warnings use `console.warn` (Vite displays these in output)
- Does not participate in Rollup's output pipeline (manifest is not a JS asset)

**Alternatives considered**:
- `generateBundle` + `this.emitFile`: Would make manifest part of Rollup's asset pipeline. Unnecessary complexity for a simple file copy.
- `writeBundle`: Similar to `closeBundle` but receives output options. No advantage for our use case.

## R-005: npm packaging (ESM + CJS dual output)

**Decision**: Use Vite library mode with `formats: ["es", "cjs"]` to produce dual output.

**Rationale**:
- `dist/index.js` (ESM) + `dist/index.cjs` (CJS) + `dist/index.d.ts` (types)
- Package.json `exports` field handles resolution
- Already configured and working in the prototype
- `peerDependencies: { "vite": ">=5.0.0" }` — no bundled dependencies

**Type generation**: Currently no `tsc` step for `.d.ts`. Need to add `vite-plugin-dts` or run `tsc --emitDeclarationOnly`. Research shows `vite-plugin-dts` is the standard approach for Vite library plugins.
