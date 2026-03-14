# Data Model: Universal GAS Plugin with unplugin

**Date**: 2026-03-14
**Branch**: `003-unplugin-migration`

## Entities

### GasPluginOptions (Public API — unchanged)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| manifest | `string` | `"src/appsscript.json"` | Path to appsscript.json manifest |
| include | `string[]` | `[]` | Glob patterns for additional files to copy |
| globals | `string[]` | `[]` | Function names to protect from tree-shaking |
| autoGlobals | `boolean` | `true` | Auto-protect exported function names |

### PluginContext (Internal State)

| Field | Type | Description |
|-------|------|-------------|
| rootDir | `string` | Project root directory (resolved per-bundler) |
| outDir | `string` | Build output directory (resolved per-bundler) |
| framework | `string` | Current bundler detected by unplugin (`meta.framework`) |

### UnpluginFactory

The `createUnplugin` factory receives `GasPluginOptions` and `meta` (containing `framework` identifier), returns a plugin object with universal hooks and framework-specific overrides.

## Module Structure

```
@gas-plugin/unplugin
├── src/
│   ├── index.ts          # createUnplugin factory + universal hooks
│   ├── types.ts           # GasPluginOptions (unchanged from gas-vite-plugin)
│   ├── transforms.ts      # Pure: stripExportKeywords, removeExportBlocks (unchanged)
│   ├── include.ts         # Pure: resolveIncludeFiles, copyFilesFlat (unchanged)
│   ├── globals.ts         # Pure: detectNamesToProtect (unchanged)
│   ├── post-process.ts    # Pure: postProcessBundle (export strip + marker cleanup on string)
│   ├── vite.ts            # Subpath export: unplugin.vite
│   ├── rollup.ts          # Subpath export: unplugin.rollup
│   ├── webpack.ts         # Subpath export: unplugin.webpack
│   ├── esbuild.ts         # Subpath export: unplugin.esbuild
│   └── bun.ts             # Subpath export: unplugin.bun
├── tests/
│   ├── transforms.test.ts  # Existing unit tests (unchanged)
│   ├── include.test.ts      # Existing unit tests (unchanged)
│   ├── globals.test.ts      # Existing unit tests (unchanged)
│   ├── post-process.test.ts # New: postProcessBundle unit tests
│   └── integration/
│       ├── vite.test.ts     # Existing tests ported
│       ├── rollup.test.ts   # New: Rollup integration tests
│       ├── webpack.test.ts  # New: webpack integration tests
│       ├── esbuild.test.ts  # New: esbuild integration tests
│       └── bun.test.ts      # New: Bun integration tests
└── package.json             # Subpath exports, optional peer deps
```

## State Transitions

The plugin has no persistent state. Each build invocation:

1. **Init**: Factory creates plugin with captured options + empty rootDir/outDir
2. **Config** (Vite/Rollup only): Set build defaults, capture rootDir/outDir
3. **Transform**: For each JS/TS file, inject globals protection if needed
4. **Post-Bundle**: Strip exports, clean markers (per-bundler mechanism)
5. **File Copy**: Copy manifest + include files to outDir
