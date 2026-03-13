# gas-vite-plugin

A minimal Vite plugin for Google Apps Script (GAS) projects.

## Design Principles

- **V8 runtime assumed** — no arrow function conversion, no legacy transforms
- **Minimal and focused** — only does what GAS requires, delegates everything else to Vite
- **Vite 8+ first-class support**
- **No AST parser dependency** — uses Rollup's `generateBundle` hook for clean post-processing

## Differentiation from existing `vite-plugin-gas`

The existing https://github.com/11gather11/vite-plugin-gas has these issues:
- Regex-based code transformations (fragile, breaks on edge cases)
- Unnecessary arrow function conversion (V8 handles modern JS)
- Disables tree-shaking entirely
- Fixed list of 7 GAS trigger functions only
- Unmaintained, Vite 8 compatibility unknown

This plugin avoids all of those problems.

## Core Features (implemented or planned)

1. **Export statement removal** — GAS doesn't support ES modules
2. **Auto-global exposure** — `export function` declarations become top-level globals (for `google.script.run`, triggers, menus)
3. **Explicit globals list** — user can specify additional function names to expose
4. **`appsscript.json` copy** — copies manifest to dist/
5. **Vite build defaults** — applies `minify: false` automatically

## What this plugin does NOT do (by design)

- Arrow function → function declaration conversion (V8 handles this)
- `console.log` → `Logger.log` conversion
- Path alias detection (Vite's job)
- TypeScript compilation (Vite's job via esbuild)

## Plugin Options (`GasPluginOptions`)

```typescript
{
  manifest?: string;      // Path to appsscript.json (default: "src/appsscript.json")
  globals?: string[];     // Extra function names to expose as top-level globals
  autoGlobals?: boolean;  // Auto-detect exported functions (default: true)
}
```

## Project Setup

- Package manager: pnpm
- Linter/formatter: Biome
- Build: Vite (library mode, ES + CJS dual output)
- Peer dependency: vite >=5.0.0

## Remaining TODO

- [ ] Install dependencies (`pnpm install`)
- [ ] Build and verify output (`pnpm build`)
- [ ] Add tests (test with the fastmoss_scraping project as real-world case)
- [ ] Add biome.json config
- [ ] Consider edge cases: re-exports, default exports, namespace exports
- [ ] Add README.md for npm
- [ ] Test with clasp 3.x push workflow
- [ ] Publish to npm

## Related Project

- `/Users/tetsuyawakita/WebstormProjects/fastmoss_scraping/` — the original GAS project that motivated this plugin. Use it as a test case.

## Commands

```bash
pnpm install    # Install dependencies
pnpm build      # Build the plugin
pnpm check      # Lint & format check with Biome
```
