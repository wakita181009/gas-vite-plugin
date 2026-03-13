# Quickstart: gas-vite-plugin v0.2

## Basic usage (unchanged from v0.1)

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

## Web app with HTML files (new in v0.2)

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    gasPlugin({
      include: ["src/**/*.html"],
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
  return HtmlService.createHtmlOutputFromFile("index");
}

export function getData() {
  return SpreadsheetApp.getActiveSpreadsheet().getName();
}
```

```html
<!-- src/index.html -->
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

Build output:
```
dist/
├── Code.js          # doGet(), getData() as top-level functions
├── index.html       # Copied flat from src/
└── appsscript.json  # Manifest
```

## Protecting non-exported functions (new in v0.2)

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    gasPlugin({
      globals: ["processData", "onTimeTrigger"],
    }),
  ],
  // ...
});
```

```typescript
// src/main.ts
export function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Tools")
    .addItem("Run", "processData") // called by string name
    .addToUi();
}

// Not exported, but protected by globals config
function processData() {
  Logger.log("Processing...");
}
```

## Disabling auto-globals (new in v0.2)

```typescript
gasPlugin({
  autoGlobals: false,
  globals: ["onOpen", "doGet"],
});
```

Only `onOpen` and `doGet` are protected from tree-shaking. Other exported functions may be removed if unused.
