# gas-vite-plugin Constitution

## Core Principles

### I. Minimalism — Do Only What GAS Requires

The plugin handles **only** the gap between Vite's output and what Google Apps Script expects. Everything else (TypeScript compilation, path aliases, tree-shaking) is Vite's job. If Vite or Rolldown already handles it, we don't touch it.

- No arrow function conversion (V8 handles modern JS)
- No `console.log` → `Logger.log` conversion
- No AST parser dependency — regex-based transforms only
- Feature additions must justify why Vite/Rolldown cannot handle the concern

### II. V8 Runtime Assumed

All output targets the GAS V8 runtime. No legacy transforms, no ES5 downleveling. This keeps the plugin simple and the output readable.

### III. Vite-Native Integration

The plugin is a well-behaved Vite plugin that follows Vite's plugin API conventions:

- Uses `enforce: "post"` and `apply: "build"` — only runs during build, after other plugins
- Uses `config` hook to set sensible defaults (`minify: false`, code-splitting conditionally disabled — skipped in lib mode)
- Uses `configResolved` hook to capture resolved `root` and `outDir`
- Uses `transform` hook for tree-shake protection injection (`globals` feature); skips virtual modules (`\0` prefix) and non-JS/TS files
- Uses `generateBundle` for post-processing (export stripping, injection cleanup, trailing newline normalization)
- Uses `closeBundle` for file operations (manifest copy, `include` file copy)
- Peer dependency: `vite >=5.0.0` (supports Vite 5, 6, 7, 8+)
- Vite 8+: uses `rolldownOptions` (not deprecated `rollupOptions`)

### IV. Dual Output — ES + CJS

The plugin itself ships as both ESM (`dist/index.js`) and CJS (`dist/index.cjs`) with bundled type declarations (`dist/index.d.ts`). This ensures compatibility with both `import` and `require` consumers.

### V. Test-First with 100% Coverage on Core Logic

- `transforms.ts` and `include.ts` enforce **100% coverage** across statements, branches, functions, and lines
- Unit tests (`tests/*.test.ts`) validate pure functions in isolation, mirroring `src/` structure
- Integration tests (`tests/integration/`) run real Vite builds against fixture projects and assert on actual output
- Shared test infrastructure in `tests/integration/helpers.ts`: `createTestContext(fixturesDir)` factory provides `createFixture`, `readOutput`, `buildFixture`, and `cleanup` functions
- Each integration test file uses its own fixtures directory to prevent cross-test interference
- Fixtures are created and torn down per test via `beforeEach`/`afterEach` calling `cleanup`
- `webapp.test.ts` builds against the real `apps/gas-webapp` directory with `configFile: false` to avoid loading its `vite.config.ts` (which imports the plugin by package name and fails when `dist/` is not built)

### VI. Strict Code Quality via Biome

Biome enforces lint + format with strict rules:

- **Async safety**: `noFloatingPromises`, `noMisusedPromises`, `noNestedPromises`, `useAwait`
- **No dead code**: `noUnusedImports`, `noUnusedVariables`, `noUnusedFunctionParameters`
- **Explicit exports**: `noBarrelFile`, `noReExportAll` (except where `biome-ignore` is justified)
- **Style discipline**: `noCommonJs`, `noNonNullAssertion`, `noParameterAssign`, `noEvolvingTypes`, `noVoid`, `useNamingConvention` (camelCase/PascalCase for functions, CONSTANT_CASE allowed for const)
- **Complexity**: `noExcessiveCognitiveComplexity`
- **Console**: `noConsole: warn` — console usage requires explicit `biome-ignore` justification
- **Import ordering**: `organizeImports` assist enabled — type imports sort before value imports
- **Formatter**: 2-space indent, double quotes, trailing commas, semicolons always, `arrowParentheses: always`, `lineWidth: 100`

## Project Structure

- **Monorepo**: pnpm workspace (`packages/*`, `apps/*`)
- **Package manager**: pnpm 10.x (corepack-managed via `packageManager` field)
- **TypeScript**: ES2022 target, bundler module resolution, strict mode
- **Type definitions**: `@types/node` in `packages/gas-vite-plugin` devDependencies; `@types/google-apps-script` in `apps/gas-webapp` devDependencies
- **Build**: Vite library mode (entry: `src/index.ts`) with `vite-plugin-dts` for type generation
- **External**: `vite`, `node:fs`, `node:path`, `node:fs/promises`, `tinyglobby` are externalized — not bundled
- **Test apps**: `apps/gas-script` (basic GAS project), `apps/gas-webapp` (GAS web app with doGet + HTML; has its own `tsconfig.json` with `types: ["google-apps-script"]`)
- **CI**: GitHub Actions — lint, test (Node 20/22/24), build, release on tag push

## Architecture Constraints

- **Core separation**: `src/index.ts` (plugin factory + Vite hooks), `src/transforms.ts` (pure string transforms), `src/include.ts` (glob + file copy), `src/types.ts` (type definitions). Hooks orchestrate, pure functions are testable.
- **One runtime dependency**: `tinyglobby` for glob pattern resolution. Justified: Node.js built-in `fs.glob()` requires Node 22+, plugin supports Node 20+.
- **Plugin options**: `manifest`, `include`, `globals`, `autoGlobals`. New options must justify their necessity. The `GasPluginOptions` interface in `src/types.ts` is the public API contract.
- **Tree-shake protection**: Uses `globalThis.__gas_keep__ = [...]` injection in `transform` hook (cleaned up in `generateBundle`). Note: `typeof <name>;` does NOT prevent tree-shaking in Rolldown — must use actual side-effect references.
- **User input in regex**: Always escape user-provided strings (e.g., `globals` names) with `escapeRegExp()` before constructing `RegExp` to prevent ReDoS.

## What This Plugin Does NOT Do (by design)

These are intentional omissions, not TODOs:

- Arrow function → function declaration conversion
- `console.log` → `Logger.log` conversion
- Path alias detection
- TypeScript compilation
- Any AST parsing
- IIFE unwrapping (deferred; Vite library mode ES output does not produce IIFE)
- Auto-inclusion of GAS trigger names (users explicitly export or list in `globals`)

## Governance

- Constitution supersedes ad-hoc decisions
- Changes to core transforms require both unit and integration test coverage
- New plugin options require documentation in the `GasPluginOptions` interface JSDoc
- Breaking changes to the public API require a major version bump

**Version**: 2.1.0 | **Ratified**: 2026-03-13 | **Last Amended**: 2026-03-14
