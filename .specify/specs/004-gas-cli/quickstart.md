# Quickstart: GAS CLI Development

**Feature**: 004-gas-cli | **Date**: 2026-03-14

## Prerequisites

- Node.js 20+
- pnpm 10.x (managed via corepack: `corepack enable`)
- Repository cloned and on feature branch

## Setup

```bash
# Install all workspace dependencies
pnpm install

# Build the unplugin package first (CLI templates depend on it)
pnpm --filter @gas-plugin/unplugin build
```

## Development Workflow

### Build the CLI package

```bash
pnpm --filter @gas-plugin/cli build
```

### Run the CLI locally (dev)

```bash
# Via pnpm workspace
pnpm --filter @gas-plugin/cli exec gas-plugin create my-project

# Or directly after build
node packages/cli/dist/index.js create my-project
```

### Run tests

```bash
# All CLI tests
pnpm --filter @gas-plugin/cli test

# With coverage
pnpm --filter @gas-plugin/cli test:coverage

# Specific test file
pnpm --filter @gas-plugin/cli test tests/core/render.test.ts
```

### Lint & format

```bash
# From workspace root (checks all packages)
pnpm -w run check
```

## Key Development Paths

### Adding a new template

1. Create template directory: `packages/cli/src/templates/<name>/`
2. Add template files with `{{placeholder}}` variables
3. Register in template registry (`src/core/templates.ts`)
4. Add test case in `tests/core/templates.test.ts`
5. Add integration test in `tests/integration/create.test.ts`

### Adding a new bundler option

1. Add bundler entry to bundler registry (`src/core/templates.ts`)
2. Create bundler config template file
3. Add test case for the new bundler config generation
4. Add integration test verifying end-to-end scaffolding

### Adding a new subcommand

1. Create `src/commands/<name>.ts` with `defineCommand()`
2. Register as lazy subcommand in `src/index.ts`
3. Add tests in `tests/` following existing patterns

## File Naming Conventions

- Template dotfiles: Use `_` prefix (e.g., `_gitignore` → `.gitignore`) because npm strips dotfiles from published packages
- Config files: Match community conventions (`vite.config.ts`, `rollup.config.mjs`)
- Test files: Mirror `src/` structure in `tests/` (e.g., `src/core/render.ts` → `tests/core/render.test.ts`)

## Useful Commands

```bash
# Check package exports are correct
node -e "import('@gas-plugin/cli/create')"

# Test the CLI binary directly
node packages/cli/dist/index.js --help
```
