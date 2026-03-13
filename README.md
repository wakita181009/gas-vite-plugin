# GAS Vite Plugin monorepo

Monorepo for [gas-vite-plugin](./packages/gas-vite-plugin/) — a minimal Vite plugin for Google Apps Script projects.

## Packages

| Package | Description |
|---------|-------------|
| [`gas-vite-plugin`](./packages/gas-vite-plugin/) | The Vite plugin (published to npm) |

## Development

```bash
pnpm install          # Install dependencies
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm check            # Lint & format with Biome
```

## Tech Stack

- **Package manager**: pnpm (workspace)
- **Language**: TypeScript 5.x (ES2022, strict)
- **Build**: Vite library mode (ES + CJS dual output)
- **Test**: Vitest with V8 coverage
- **Lint/Format**: Biome

## License

MIT
