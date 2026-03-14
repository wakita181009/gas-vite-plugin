# @gas-plugin/cli

[![CI](https://github.com/wakita181009/gas-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/wakita181009/gas-plugin/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/wakita181009/gas-plugin/graph/badge.svg)](https://codecov.io/gh/wakita181009/gas-plugin)
[![npm Version](https://img.shields.io/npm/v/@gas-plugin/cli.svg)](https://www.npmjs.com/package/@gas-plugin/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Extensible CLI tool for scaffolding Google Apps Script projects. Generates a ready-to-build project with your choice of bundler and template.

## Quick Start

```bash
# npm
npx @gas-plugin/cli create

# yarn
yarn dlx @gas-plugin/cli create

# pnpm
pnpm dlx @gas-plugin/cli create
```

Follow the interactive prompts to choose a project name, template, and bundler.

> **Note:** The CLI automatically detects which package manager you used to run it and uses the same one for dependency installation and "Next steps" output.

## Usage

### Interactive (default)

```bash
npx @gas-plugin/cli create
```

### Non-interactive

Use `--yes` to accept all defaults, or pass flags explicitly:

```bash
npx @gas-plugin/cli create my-project
```

```bash
# Example with pnpm
pnpm dlx @gas-plugin/cli create my-app \
  --template webapp \
  --bundler vite \
  --clasp \
  --script-id YOUR_SCRIPT_ID
```

## Options

| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `name` | | positional | — | Project name (prompted if omitted) |
| `--template` | `-t` | `basic` \| `webapp` | `basic` | Project template |
| `--bundler` | `-b` | `vite` \| `rollup` \| `esbuild` \| `webpack` \| `bun` | `vite` | Bundler to use |
| `--install` | | boolean | `true` | Install dependencies after scaffolding |
| `--clasp` | | boolean | `true` | Include `.clasp.json` and `.claspignore` |
| `--script-id` | | string | — | GAS Script ID for `.clasp.json` (requires `--clasp`) |
| `--force` | | boolean | `false` | Skip target directory confirmation |
| `--yes` | `-y` | boolean | `false` | Use defaults for all prompts |

## Templates

### `basic`

Spreadsheet automation with an `onOpen` trigger.

```
src/
├── index.ts    # onOpen(), runScript(), greet()
└── utils.ts    # formatDate(), log()
```

### `webapp`

Web app with `doGet`/`doPost` and an HTML client.

```
src/
├── index.ts      # doGet(), doPost(), processRequest()
├── utils.ts      # getCurrentUserEmail(), log()
└── client.html   # HTML template served by doGet
```

## Generated Project Structure

```
my-project/
├── src/
│   ├── index.ts          # GAS entry points
│   ├── utils.ts          # Utility functions
│   └── client.html       # (webapp only)
├── package.json          # Dependencies and build script
├── appsscript.json       # GAS manifest (OAuth scopes, V8 runtime)
├── tsconfig.json         # TypeScript config
├── biome.json            # Linter / formatter config
├── vite.config.ts        # Bundler config (varies by choice)
├── .gitignore
├── .clasp.json           # (when --clasp is used)
├── .claspignore          # (when --clasp is used)
└── README.md
```

## Bundler Support

| Bundler | Config File | Build Command |
|---------|-------------|---------------|
| Vite | `vite.config.ts` | `vite build` |
| Rollup | `rollup.config.mjs` | `rollup -c` |
| esbuild | `esbuild.config.mjs` | `node esbuild.config.mjs` |
| webpack | `webpack.config.mjs` | `webpack` |
| Bun | `bun.build.ts` | `bun run bun.build.ts` |

All bundler configs use [`@gas-plugin/unplugin`](../unplugin/) under the hood.

## License

MIT
