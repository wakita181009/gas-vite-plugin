# @gas-plugin/unplugin

A universal bundler plugin for Google Apps Script (GAS) projects. Supports Vite, Rollup, webpack, esbuild, and Bun via [unplugin](https://github.com/unjs/unplugin).

## Design Principles & Architecture

See [`.specify/memory/constitution.md`](../.specify/memory/constitution.md) for design principles, architecture constraints, and governance.

## Project Structure

```text
packages/
  unplugin/             # @gas-plugin/unplugin (published to npm)
    src/
      index.ts          # unplugin factory + bundler-specific hooks
      vite.ts           # Vite entry point
      rollup.ts         # Rollup entry point
      webpack.ts        # webpack entry point
      esbuild.ts        # esbuild entry point
      bun.ts            # Bun entry point
      core/
        transforms.ts   # Pure string transforms (export stripping)
        post-process.ts # Bundle post-processing pipeline
        include.ts      # Glob resolution + flat file copy
        globals.ts      # Tree-shake protection detection
        types.ts        # GasPluginOptions interface
        utils.ts        # Shared utilities (input extraction, root detection)
    tests/
      core/
        transforms.test.ts     # Unit tests for transforms
        post-process.test.ts   # Unit tests for post-processing
        include.test.ts        # Unit tests for include/copy
        globals.test.ts        # Unit tests for globals detection
        utils.test.ts          # Unit tests for utilities
      exports.test.ts          # Package export validation
      integration/
        helpers.ts             # Shared test helpers
        vite.test.ts           # Vite integration tests
        rollup.test.ts         # Rollup integration tests
        esbuild.test.ts        # esbuild integration tests
  gas-vite-plugin/      # Legacy Vite-only plugin (deprecated)
apps/
  gas-script/           # Test app: basic GAS project
  gas-webapp/           # Test app: GAS web app (doGet + HTML)
```

## Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm -w run check     # Lint & format check with Biome
```

## Versioning

`@gas-plugin/unplugin` and `@gas-plugin/cli` share the same version. To bump:

```bash
pnpm -r exec -- npm version <ver> --no-git-tag-version
```

`gas-vite-plugin` (deprecated) is also updated but that is fine.

## Code Style

TypeScript 5.x (compiled via Vite/oxc): Follow standard conventions. See `biome.json` for lint/format rules.

## Active Technologies
- TypeScript 5.x, ES2022 target, Node.js 20+
- `unplugin` (universal bundler plugin framework), `tinyglobby` (glob resolution)
- TypeScript 5.x, ES2022 target, Node.js 20+ + `citty` ^0.2.1 (CLI framework, subcommand routing), `@clack/prompts` ^1.1.0 (interactive prompts) (004-gas-cli)
- N/A (file-system only — template copy + string substitution) (004-gas-cli)

## Recent Changes
- 004-gas-cli: Added TypeScript 5.x, ES2022 target, Node.js 20+ + `citty` ^0.2.1 (CLI framework, subcommand routing), `@clack/prompts` ^1.1.0 (interactive prompts)
