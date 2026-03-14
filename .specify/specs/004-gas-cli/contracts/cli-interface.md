# CLI Interface Contract: @gas-plugin/cli

**Feature**: 004-gas-cli | **Date**: 2026-03-14

## Package Exports

### @gas-plugin/cli

```jsonc
{
  "name": "@gas-plugin/cli",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "gas-plugin": "./dist/index.js"
  },
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./create": {
      "import": "./dist/commands/create.js",
      "types": "./dist/commands/create.d.ts"
    }
  }
}
```

## CLI Command Interface

### Top-level

```
gas-plugin <command> [options]

Commands:
  create    Scaffold a new GAS project

Global Options:
  --help       Show help
  --version    Show version
```

### `gas-plugin create`

```
gas-plugin create [project-name] [options]

Arguments:
  project-name    Name for the new project (prompted if omitted)

Options:
  --template, -t <type>     Template: basic | webapp | library (default: prompted)
  --bundler, -b <bundler>   Bundler: vite | rollup | esbuild | webpack (default: prompted)
  --install / --no-install   Install dependencies after scaffolding (default: true)
  --clasp                   Include clasp configuration files
  --script-id <id>          GAS Script ID for .clasp.json (requires --clasp)
  --force                   Overwrite target directory without confirmation
  --yes, -y                 Use default values for all prompts
  --help                    Show help for create command
```

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | User cancelled (Ctrl+C or prompt cancellation) |
| `2` | Invalid arguments (unknown flag, invalid template/bundler name) |
| `3` | Target directory conflict (non-empty, no `--force`) |

## Programmatic API

Exported from `@gas-plugin/cli/create` for programmatic use:

```typescript
export interface ScaffoldOptions {
  projectName: string;
  template: "basic" | "webapp" | "library";
  bundler: "vite" | "rollup" | "esbuild" | "webpack";
  installDeps: boolean;
  clasp: boolean;
  scriptId?: string;
  packageManager: "npm" | "pnpm" | "yarn" | "bun";
  targetDir: string;
}

/** Run the scaffolding pipeline with resolved options. */
export function scaffold(options: ScaffoldOptions): Promise<void>;

/** Run the create command (interactive or flag-driven). */
export function runCreate(argv?: string[]): Promise<void>;
```

## Generated Project Structure Contract

Every scaffolded project MUST contain:

```text
<project-name>/
├── src/
│   └── index.ts              # Entry point (content varies by template)
├── <bundler-config>           # vite.config.ts | rollup.config.mjs | etc.
├── package.json               # With build script, dependencies
├── tsconfig.json              # TypeScript config for GAS
├── biome.json                 # Biome lint/format config
├── appsscript.json            # GAS manifest
├── .gitignore                 # node_modules/, dist/, .clasp.json
└── README.md                  # Getting started instructions
```

### Template-specific additions

**basic**:
```text
src/
├── index.ts        # onOpen trigger + sample function
└── utils.ts        # Utility module
```

**webapp**:
```text
src/
├── index.ts        # doGet/doPost handlers
├── utils.ts        # Server-side utilities
└── client.html     # Client-side HTML
```

**library**:
```text
src/
├── index.ts        # Exported library functions
└── types.ts        # Type definitions
```

### Optional additions (when `--clasp` is set):

```text
├── .clasp.json      # { "scriptId": "<id>", "rootDir": "dist" }
└── .claspignore     # node_modules, src, *.ts
```

## Bundler Config Contract

Each generated bundler config MUST:
1. Import the gas plugin from the correct `@gas-plugin/unplugin/*` subpath
2. Configure the plugin with template-appropriate options (`globals`, `include`, `manifest`)
3. Set output directory to `dist/`
4. Target ESM format where applicable

Example (Vite):
```typescript
import { defineConfig } from "vite";
import gasPlugin from "@gas-plugin/unplugin/vite";

export default defineConfig({
  plugins: [
    gasPlugin({
      // Template-specific options injected here
    }),
  ],
  build: {
    outDir: "dist",
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
    },
  },
});
```
