# Design Decisions

Consolidated from specs 001, 002, 003. Preserved for future design changes.

## Architecture

### Two-tier hook strategy (003-D1)
Universal hooks for bundler-agnostic operations (`transform`, `writeBundle` fallback), framework-specific hooks for Vite/Rollup/webpack-specific operations (`config`, `configResolved`, `generateBundle`). Reason: only `transform` and file copy map cleanly to unplugin universal hooks; `config`, `configResolved`, `generateBundle` are framework-specific.

### Export stripping per bundler (003-D2)
- **Vite/Rollup**: `generateBundle` (in-memory, efficient)
- **webpack**: `afterEmit` with disk read/rewrite
- **esbuild/Bun**: `writeBundle` disk-based post-processing

Reason: `generateBundle` is most efficient but only available in Vite/Rollup. No post-bundle in-memory hook exists for esbuild/Bun.

### Root/outDir resolution per bundler (003-D3)
No universal way to get root/outDir. Each bundler captured via its own API through closures: Vite `configResolved`, Rollup `options`+`outputOptions`, webpack `compiler.options`, esbuild `build.initialOptions`.

## Transform Design

### Regex-based transforms, no AST parser (001-R1)
Vite library mode produces predictable output: top-level declarations + `export { ... }` blocks. Two regex functions (`stripExportKeywords`, `removeExportBlocks`) suffice. AST parser (acorn/oxc) rejected per constitution — ~500KB dependency overkill for line-level patterns.

### Tree-shake protection via `globalThis.__gas_keep__` (002-R1, 003-D6)
`transform` hook injects `globalThis.__gas_keep__ = [name1, name2]` which bundlers recognize as a side effect. Works universally across all bundlers since it operates at source level before bundler-specific tree-shaking. Original approach used `typeof <name>;` — later changed to `globalThis.__gas_keep__` array for clarity.

Alternatives rejected: `moduleSideEffects: "no-treeshake"` (too coarse), virtual module re-exports (complex), `@__NO_SIDE_EFFECTS__` annotations (burden on user).

### `autoGlobals` toggle scope (002-R3)
Only affects tree-shake injection in `transform`. Export stripping always runs regardless. Keeps the toggle simple — no scope hiding or closure wrapping needed.

## Build & Packaging

### Vite config merge for defaults (001-R3)
Vite `config()` hook return is deep-merged with user config; user's explicit values win. No custom merge logic needed.

### Manifest copy in `closeBundle` (001-R4)
`closeBundle` runs after all output files are written. Synchronous `copyFileSync` is simple and reliable. `generateBundle` + `this.emitFile` rejected — unnecessary complexity for a non-JS asset.

### tinyglobby as direct dependency (002-R5)
Transitive via Vite but added explicitly for version pinning and independence from Vite internals. Node.js `fs.glob()` rejected (Node 22+ only, plugin supports Node 20+).

### unplugin transform filter API (003-D4)
`transform.filter` (recommended in unplugin v2+) instead of `transformInclude` (legacy). Enables native Rust-side filtering in Rolldown/Rspack.

### ESM-only output for unplugin package (003-D5)
Vite library mode with ES format + `vite-plugin-dts` for type generation. CJS dropped in v0.0.5 (003-unplugin-migration). Multiple entry points for subpath exports.
