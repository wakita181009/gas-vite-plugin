# Research: Universal GAS Plugin with unplugin

**Date**: 2026-03-14
**Branch**: `003-unplugin-migration`

## Decision 1: Hook Mapping Strategy

### Decision
Use a two-tier approach: universal hooks for bundler-agnostic operations, framework-specific hooks for Vite/Rollup-specific operations.

### Rationale
The current plugin has 5 Vite hooks. Only 2 (`transform`, file copy) map cleanly to unplugin universal hooks. The other 3 (`config`, `configResolved`, `generateBundle`) are Vite/Rollup-specific and require framework-specific sections.

### Mapping Table

| Current Vite Hook | Universal Hook | Framework-Specific | Notes |
|---|---|---|---|
| `config()` | N/A | `vite: { config() }` | Vite-only: minify defaults, codeSplitting |
| `configResolved()` | N/A | `vite: { configResolved() }` | Captures root/outDir |
| `transform()` | `transform` with `filter` | -- | Universal: globals injection |
| `generateBundle()` | N/A | `vite: { generateBundle() }`, `rollup: { generateBundle() }` | Export stripping must happen post-bundle |
| `closeBundle()` | `writeBundle` | -- | File copy: no args needed (closure) |

### Alternatives Considered
- **Move export stripping to `transform` hook**: Rejected. Export keywords are needed by the bundler for module resolution and tree-shaking. Removing them pre-bundle breaks the build.
- **Use `writeBundle` for export stripping (read/rewrite output files)**: Viable as a fallback for webpack/esbuild. Less efficient than in-memory processing but works universally.

## Decision 2: Export Stripping Per Bundler

### Decision
- **Vite/Rollup**: Use `generateBundle` (in-memory, efficient) via framework-specific hooks
- **webpack**: Use `compilation.processAssets` via `webpack(compiler)` hook
- **esbuild/Bun**: Use `writeBundle` to read output files from disk, strip exports, and write back

### Rationale
`generateBundle` provides in-memory access to bundle chunks (string content) before they're written to disk. This is the most efficient approach but only available in Vite and Rollup. For webpack, the `processAssets` tap provides similar in-memory access. For esbuild and Bun, no post-bundle in-memory hook exists, so disk-based post-processing in `writeBundle` is the only option.

### Alternatives Considered
- **Unified disk-based approach for all bundlers**: Rejected. Less efficient for Vite/Rollup where in-memory access is available.
- **AST-based transform in `transform` hook**: Rejected per constitution (regex-only, no AST parser).

## Decision 3: Root/OutDir Resolution Per Bundler

### Decision
Each bundler captures root and output directory through its own mechanism:
- **Vite**: `configResolved(config)` → `config.root`, `config.build.outDir`
- **Rollup**: `outputOptions(options)` → `options.dir` or `options.file`
- **webpack**: `compiler.options.context` (root), `compiler.options.output.path` (outDir)
- **esbuild**: `build.initialOptions.outdir`
- **Bun**: `build.config.outdir`

### Rationale
There is no universal way to get root/outDir across all bundlers. Each bundler exposes this through different APIs. The plugin factory function captures these values via closure.

## Decision 4: Filter API for Transform

### Decision
Use the unplugin `transform.filter` API (recommended) instead of `transformInclude` (legacy).

```
filter: {
  id: {
    include: [/\.[jt]sx?(\?|$)/],
    exclude: [/\0/]
  }
}
```

### Rationale
`filter` is the recommended approach in unplugin v2+. It enables native Rust-side filtering in Rolldown and Rspack for better performance.

## Decision 5: Package Build Tooling

### Decision
Use tsdown (tsup successor, recommended by unplugin ecosystem) or Vite library mode to build the `@gas-plugin/unplugin` package with multiple entry points (one per bundler subpath export).

### Rationale
The package needs multiple entry points for subpath exports. Each bundler adapter (`vite.ts`, `rollup.ts`, etc.) is a separate entry point that imports from the shared core. The unplugin-starter template uses tsdown for this exact pattern.

### Alternatives Considered
- **Vite library mode**: Already used for gas-vite-plugin. Can handle multiple entries but less conventional for unplugin packages.
- **tsup**: Predecessor to tsdown. Still works but tsdown is the recommended successor.
- **tsdown**: Recommended by unplugin ecosystem. Better for multiple entry points.

## Decision 6: Tree-Shake Protection Across Bundlers

### Decision
The `globalThis.__gas_keep__ = [...]` injection approach works universally across all bundlers since it operates at the source code level (in `transform` hook) before any bundler-specific tree-shaking.

### Rationale
The injection creates a side-effect reference that prevents any bundler from eliminating the referenced symbols. This approach is bundler-agnostic by design. The marker cleanup happens in the post-bundle phase (per-bundler, same as export stripping).
