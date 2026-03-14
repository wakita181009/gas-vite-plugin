# Public API Contract: @gas-plugin/unplugin

## Package Exports (package.json)

```json
{
  "name": "@gas-plugin/unplugin",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./vite": {
      "import": "./dist/vite.js",
      "require": "./dist/vite.cjs",
      "types": "./dist/vite.d.ts"
    },
    "./rollup": {
      "import": "./dist/rollup.js",
      "require": "./dist/rollup.cjs",
      "types": "./dist/rollup.d.ts"
    },
    "./webpack": {
      "import": "./dist/webpack.js",
      "require": "./dist/webpack.cjs",
      "types": "./dist/webpack.d.ts"
    },
    "./esbuild": {
      "import": "./dist/esbuild.js",
      "require": "./dist/esbuild.cjs",
      "types": "./dist/esbuild.d.ts"
    },
    "./bun": {
      "import": "./dist/bun.js",
      "require": "./dist/bun.cjs",
      "types": "./dist/bun.d.ts"
    }
  },
  "peerDependencies": {
    "vite": ">=5.0.0",
    "rollup": ">=4.0.0",
    "webpack": ">=5.0.0",
    "esbuild": ">=0.17.0"
  },
  "peerDependenciesMeta": {
    "vite": { "optional": true },
    "rollup": { "optional": true },
    "webpack": { "optional": true },
    "esbuild": { "optional": true }
  }
}
```

## Import Patterns

```typescript
// Vite
import gasPlugin from "@gas-plugin/unplugin/vite"
export default defineConfig({ plugins: [gasPlugin(options)] })

// Rollup
import gasPlugin from "@gas-plugin/unplugin/rollup"
export default { plugins: [gasPlugin(options)] }

// webpack
import gasPlugin from "@gas-plugin/unplugin/webpack"
module.exports = { plugins: [gasPlugin(options)] }

// esbuild
import gasPlugin from "@gas-plugin/unplugin/esbuild"
await build({ plugins: [gasPlugin(options)] })

// Bun
import gasPlugin from "@gas-plugin/unplugin/bun"
Bun.build({ plugins: [gasPlugin(options)] })
```

## Options Interface (unchanged)

```typescript
interface GasPluginOptions {
  /** Path to appsscript.json manifest. Default: "src/appsscript.json" */
  manifest?: string;
  /** Glob patterns for additional files to copy to output. Default: [] */
  include?: string[];
  /** Function names to protect from tree-shaking. Default: [] */
  globals?: string[];
  /** Auto-protect exported function names. Default: true */
  autoGlobals?: boolean;
}
```

## Behavioral Contract

For all supported bundlers, the plugin guarantees:

1. **Export stripping**: All `export` keywords, `export {}` blocks, and `export default` are removed from the final output
2. **Manifest copy**: `appsscript.json` is copied to the output directory
3. **Include copy**: Files matching `include` glob patterns are copied flat to the output directory
4. **Globals protection**: Functions listed in `globals` or detected via `autoGlobals` are not eliminated by tree-shaking
5. **No minification by default**: Build output is not minified (user can override)
6. **Non-JS/TS skip**: Files that are not JavaScript or TypeScript are not transformed
7. **Virtual module skip**: Virtual modules (with `\0` prefix) are not transformed
