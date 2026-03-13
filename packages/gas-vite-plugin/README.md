# GAS Vite Plugin

A minimal Vite plugin for Google Apps Script (GAS) projects.

Write standard TypeScript with `export function` — the plugin handles the rest.

## Features

- Strips `export` keywords → top-level functions callable by GAS
- Copies `appsscript.json` to dist automatically
- Sets GAS-safe build defaults (no minification, no code splitting)
- Zero runtime footprint — no code injected into your GAS output
- V8 runtime assumed — no unnecessary legacy transforms

## Install

```bash
npm install -D gas-vite-plugin
```

## Usage

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

```typescript
// src/main.ts
export function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("My Menu")
    .addItem("Run", "myFunction")
    .addToUi();
}

export function myFunction() {
  SpreadsheetApp.getActiveSpreadsheet().toast("Hello!");
}
```

```bash
npx vite build
npx clasp push
```

## Options

```typescript
gasPlugin({
  manifest: "src/appsscript.json", // Path to manifest (default)
});
```

## Requirements

- Vite 5+
- Node.js 18+

## License

MIT
