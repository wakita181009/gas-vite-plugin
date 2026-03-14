# Quickstart: @gas-plugin/unplugin Development

## Prerequisites

- Node.js 20+
- pnpm 10+
- Git

## Setup

```bash
git checkout 003-unplugin-migration
pnpm install
```

## Package Location

```
packages/unplugin/     # @gas-plugin/unplugin source
```

## Build

```bash
pnpm --filter @gas-plugin/unplugin build
```

## Test

```bash
# Unit tests (pure transform modules)
pnpm --filter @gas-plugin/unplugin test

# Integration tests (real builds per bundler)
pnpm --filter @gas-plugin/unplugin test:integration

# Coverage
pnpm --filter @gas-plugin/unplugin test:coverage
```

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | createUnplugin factory + universal hooks |
| `src/transforms.ts` | Export stripping (pure, ported from gas-vite-plugin) |
| `src/include.ts` | File copy (pure, ported from gas-vite-plugin) |
| `src/globals.ts` | Globals detection (pure, ported from gas-vite-plugin) |
| `src/post-process.ts` | Post-bundle processing (export strip + marker cleanup) |
| `src/vite.ts` | Vite subpath export |
| `src/rollup.ts` | Rollup subpath export |
| `src/webpack.ts` | webpack subpath export |
| `src/esbuild.ts` | esbuild subpath export |
| `src/bun.ts` | Bun subpath export |

## Testing a Bundler Integration

To test with a specific bundler (e.g., Rollup):

```bash
# Run only Rollup integration tests
pnpm --filter @gas-plugin/unplugin vitest run tests/integration/rollup.test.ts
```

## Verifying Vite Backward Compatibility

The existing test apps (`apps/gas-script`, `apps/gas-webapp`) should be updated to import from `@gas-plugin/unplugin/vite` and verified to produce identical output.
