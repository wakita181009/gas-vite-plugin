# GAS Vite Plugin

A minimal Vite plugin for Google Apps Script projects.

Write standard TypeScript with `export function` — the plugin strips exports, copies manifests, and protects functions from tree-shaking so your code runs on GAS as-is.

## Quick Start

```bash
npm install -D gas-vite-plugin vite
```

```typescript
// vite.config.ts
import gasPlugin from "gas-vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [gasPlugin()],
  build: {
    lib: {
      entry: "src/main.ts",
      formats: ["es"],
      fileName: () => "Code.js",
    },
  },
});
```

```bash
npx vite build
npx clasp push
```

See [`packages/gas-vite-plugin/README.md`](./packages/gas-vite-plugin/README.md) for full documentation and options.

## Packages

| Package | Description |
|---------|-------------|
| [`gas-vite-plugin`](./packages/gas-vite-plugin/) | The Vite plugin (published to npm) |

## Example Apps

| App | Description |
|-----|-------------|
| [`gas-script`](./apps/gas-script/) | Basic GAS project (triggers, menus) |
| [`gas-webapp`](./apps/gas-webapp/) | GAS web app (doGet + HTML + google.script.run) |

## Development

```bash
pnpm install          # Install dependencies
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm -w run check     # Lint & format with Biome
```

## License

MIT
