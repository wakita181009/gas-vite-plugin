# Data Model: gas-vite-plugin v0.2

## Entities

### GasPluginOptions (extended)

The public API configuration interface. Extends v0.1 with three new fields.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `manifest` | `string?` | `"src/appsscript.json"` | Path to appsscript.json manifest (v0.1) |
| `include` | `string[]?` | `[]` | Glob patterns for additional files to copy flat to outDir |
| `globals` | `string[]?` | `[]` | Function names to protect from tree-shaking |
| `autoGlobals` | `boolean?` | `true` | Auto-add exported functions to globals list |

**Validation rules**:
- `include` patterns are resolved relative to `config.root`
- `globals` names must be valid JavaScript identifiers
- All fields are optional — v0.1 projects work with zero config

### Plugin Internal State

Captured during `configResolved`, used across hooks.

| Field | Type | Source |
|-------|------|--------|
| `rootDir` | `string` | `config.root` |
| `outDir` | `string` | `config.build.outDir` |
| `globalsToProtect` | `string[]` | Computed from `globals` + auto-detected exports (if `autoGlobals: true`) |

### Include File Resolution

| Step | Input | Output |
|------|-------|--------|
| 1. Glob resolve | `include` patterns + `rootDir` | Matched file paths (absolute) |
| 2. Flatten | Absolute paths | `basename(path)` only |
| 3. Dedup check | Basenames | Warn on collision, skip duplicate |
| 4. Copy | Source path → `outDir/basename` | Files in output directory |

## State Transitions

### Build Pipeline (hook execution order)

```
config() → Set defaults (minify: false, codeSplitting)
    ↓
configResolved() → Capture rootDir, outDir
    ↓
transform(code, id) → [NEW] Inject `typeof <name>;` for globals protection
    ↓
[Rollup tree-shaking runs — globals survive due to typeof references]
    ↓
generateBundle(_, bundle) → Strip exports + remove typeof injections
    ↓
closeBundle() → Copy manifest + [NEW] copy include files
```
