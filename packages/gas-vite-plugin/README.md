# GAS Vite Plugin

A minimal Vite plugin for Google Apps Script (GAS) projects.

Write standard TypeScript with `export function` — the plugin handles the rest.

## Features

- Strips `export` keywords — top-level functions become callable by GAS
- Copies `appsscript.json` to dist automatically
- `include` option — copy HTML/CSS/images flat to dist for web apps
- `globals` option — protect non-exported functions from tree-shaking
- `autoGlobals` toggle — fine-grained control over tree-shake protection
- Sets GAS-safe build defaults (no minification, no code splitting)
- V8 runtime assumed — no unnecessary legacy transforms
- No AST parser dependency — regex-based transforms

## What this plugin does NOT do (by design)

- Arrow function → function declaration conversion (V8 handles this)
- `console.log` → `Logger.log` conversion
- Path alias detection (Vite's job)
- TypeScript compilation (Vite's job via oxc/esbuild)

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
  include: ["src/**/*.html"],       // Copy additional files flat to dist
  globals: ["processData"],         // Protect functions from tree-shaking
  autoGlobals: true,                // Auto-protect exported functions (default)
});
```

### `include`

Copy additional files (HTML, CSS, images) flat to the output directory. Essential for GAS web apps using `HtmlService.createHtmlOutputFromFile()`.

```typescript
gasPlugin({
  include: ["src/**/*.html", "src/**/*.css"],
});
```

Files are flattened — `src/views/index.html` becomes `dist/index.html`. Duplicate basenames trigger a warning.

### `globals`

Protect non-exported functions from tree-shaking. Use for functions called by GAS via string name (menu handlers, trigger targets).

```typescript
// vite.config.ts
gasPlugin({ globals: ["processData"] });

// src/main.ts
export function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Tools")
    .addItem("Run", "processData")  // GAS calls by string name
    .addToUi();
}

function processData() {  // Not exported, but protected by globals
  Logger.log("Processing...");
}
```

### `autoGlobals`

When `true` (default), exported functions are automatically protected from tree-shaking. Set to `false` for explicit control — only functions in `globals` are protected.

```typescript
gasPlugin({
  autoGlobals: false,
  globals: ["onOpen", "doGet"],
});
```

## Web App Example

```typescript
// vite.config.ts
import gasPlugin from "gas-vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    gasPlugin({
      include: ["src/**/*.html"],
      globals: ["getData", "saveData"],
    }),
  ],
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
export function doGet() {
  return HtmlService.createHtmlOutputFromFile("index").setTitle("My App");
}

// Called by client via google.script.run — protected by globals config
function getData() {
  return SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getDataRange().getValues();
}
```

```html
<!-- src/index.html (copied flat to dist via include) -->
<!DOCTYPE html>
<html>
  <body>
    <div id="app"></div>
    <script>
      google.script.run.withSuccessHandler(console.log).getData();
    </script>
  </body>
</html>
```

## Project Structure

```
your-gas-project/
├── src/
│   ├── main.ts            # Entry point
│   ├── appsscript.json    # GAS manifest (auto-copied)
│   └── index.html         # Optional: for web apps
├── vite.config.ts
└── package.json
```

## Requirements

- Vite 5+
- Node.js 20+

## License

MIT
