# GAS Vite Plugin

A minimal Vite plugin for Google Apps Script (GAS) projects.

## Design Principles & Architecture

See [`.specify/memory/constitution.md`](../.specify/memory/constitution.md) for design principles, architecture constraints, and governance.

## Project Structure

```text
packages/
  gas-vite-plugin/    # The Vite plugin (published to npm)
    src/
      index.ts        # Plugin factory + Vite hooks
      transforms.ts   # Pure string transforms (export stripping)
      include.ts      # Glob resolution + flat file copy
      types.ts        # GasPluginOptions interface
    tests/
      transforms.test.ts        # Unit tests (mirrors src/)
      include.test.ts           # Unit tests (mirrors src/)
      integration/              # Integration tests (real Vite builds)
        build.test.ts           # v0.1 basic build tests
        include.test.ts         # include option tests
        globals.test.ts         # globals + autoGlobals tests
        exports.test.ts         # export edge case tests
        webapp.test.ts          # gas-webapp test app build
apps/
  gas-script/         # Test app: basic GAS project
  gas-webapp/         # Test app: GAS web app (doGet + HTML)
```

## Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Build all packages
pnpm test             # Run tests (gas-vite-plugin)
pnpm -w run check     # Lint & format check with Biome
```

## Code Style

TypeScript 5.x (compiled via Vite/oxc): Follow standard conventions. See `biome.json` for lint/format rules.
