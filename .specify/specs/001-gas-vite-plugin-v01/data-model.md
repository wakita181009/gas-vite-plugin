# Data Model: gas-vite-plugin v0.1

## Entities

### GasPluginOptions (v0.1)

The configuration object passed to `gasPlugin()`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `manifest` | `string` | `"src/appsscript.json"` | Path to the GAS manifest file (relative to project root) |

### Output Chunk (Rollup internal)

Represents a bundled JS output file processed by the plugin.

| Attribute | Type | Description |
|-----------|------|-------------|
| `type` | `"chunk" \| "asset"` | Only chunks (JS code) are processed |
| `code` | `string` | The bundled JS source code to transform |
| `fileName` | `string` | Output filename (e.g., `Code.js`) |

### Transform Pipeline

The plugin applies two transforms sequentially to each output chunk:

```
Input (Vite output)
  → stripExportKeywords()    // Remove `export` prefix from declarations
  → removeExportBlocks()     // Remove `export { ... }` aggregation blocks
Output (GAS-compatible)
```

**Invariant**: After both transforms, the output contains zero `export` keywords at line start.

## State Transitions

None. This is a stateless build-time transform. Each build invocation processes chunks independently.

## Relationships

```
GasPluginOptions ──configures──→ Vite Plugin Instance
Vite Plugin Instance ──processes──→ Output Chunk(s)
Vite Plugin Instance ──copies──→ appsscript.json
```
