# Quickstart: gas-vite-plugin v0.1

## For plugin users

### 1. Install

```bash
npm install -D gas-vite-plugin
```

### 2. Configure vite.config.ts

```typescript
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

### 3. Write TypeScript

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

### 4. Build and deploy

```bash
npx vite build
npx clasp push
```

Output (`dist/Code.js`):
```javascript
function onOpen() {
  SpreadsheetApp.getUi().createMenu("My Menu").addItem("Run", "myFunction").addToUi();
}
function myFunction() {
  SpreadsheetApp.getActiveSpreadsheet().toast("Hello!");
}
```

## For plugin developers

### Setup

```bash
git clone <repo>
cd gas-vite-plugin
pnpm install
```

### Build

```bash
pnpm build          # Build all packages
pnpm --filter gas-vite-plugin build   # Build plugin only
```

### Test

```bash
pnpm --filter gas-vite-plugin test    # Run tests
pnpm --filter gas-vite-plugin test --coverage  # With coverage
```

### Test app

```bash
cd apps/gas-script
pnpm build          # Build test app with the plugin
# Verify dist/Code.js has no export keywords
# Verify dist/appsscript.json exists
```
