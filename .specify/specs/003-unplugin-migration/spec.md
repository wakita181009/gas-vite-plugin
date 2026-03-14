# Feature Specification: Universal GAS Plugin with unplugin

**Feature Branch**: `003-unplugin-migration`
**Created**: 2026-03-14
**Status**: Draft
**Input**: User description: "Migrate gas-vite-plugin to use unplugin, creating a universal bundler plugin that works with Vite, Rollup, webpack, esbuild, Rspack, and other bundlers."

## Clarifications

### Session 2026-03-14

- Q: Monorepo package layout — separate packages per bundler or single package with subpath exports? → A: Single package (`@gas-plugin/unplugin`) with subpath exports (`@gas-plugin/unplugin/vite`, `@gas-plugin/unplugin/rollup`, etc.), following unplugin conventions. Lives in `packages/unplugin/`.
- Q: Initial version for `@gas-plugin/unplugin`? → A: Continue from `gas-vite-plugin` version numbering, starting at v0.0.5. Signals continuity with the existing package.
- Q: Output consistency expectation across bundlers? → A: Guarantee "GAS-compatible" functional equivalence (no exports, globals protected, manifest present, clasp-pushable). Byte-identical output across bundlers is not expected.
- Q: Minimum bundler version support? → A: Current major only — Vite 5+, Rollup 4+, webpack 5+, esbuild 0.17+, Bun 1.0+.
- Q: `gas-vite-plugin` deprecation strategy? → A: Immediately unpublish `gas-vite-plugin` from npm. No wrapper or transition period — clean break to `@gas-plugin/unplugin`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use GAS Plugin with Rollup (Priority: P1)

A developer building a Google Apps Script project with Rollup wants to use the same GAS plugin features (export stripping, manifest copy, globals protection) that were previously only available for Vite. They install `@gas-plugin/unplugin/rollup`, configure it in their `rollup.config.js`, and get a working GAS-compatible bundle output.

**Why this priority**: Rollup is the most common non-Vite bundler for GAS projects (used by @google/aside). Supporting Rollup immediately expands the user base to the largest alternative audience.

**Independent Test**: Can be tested by creating a Rollup-based GAS project, adding the plugin, running a build, and verifying that export keywords are stripped, appsscript.json is copied, and globals are protected in the output.

**Acceptance Scenarios**:

1. **Given** a Rollup project with TypeScript GAS source files, **When** the developer adds `@gas-plugin/unplugin/rollup` and runs `rollup -c`, **Then** the output bundle has no `export` keywords and `appsscript.json` is copied to the output directory.
2. **Given** a Rollup project using `globals` option to protect functions called via `google.script.run`, **When** the build completes, **Then** the named functions are preserved in the output (not tree-shaken away).
3. **Given** a Rollup project using the `include` option with glob patterns, **When** the build completes, **Then** the matched files (e.g., HTML files) are copied flat into the output directory.

---

### User Story 2 - Seamless Migration for Existing Vite Users (Priority: P1)

An existing gas-vite-plugin user wants to upgrade to the new universal plugin without changing their build output or workflow. They switch from `gas-vite-plugin` to `@gas-plugin/unplugin/vite` with minimal configuration changes, and their builds produce identical results.

**Why this priority**: Backward compatibility is essential to avoid breaking existing users. This story is co-P1 because without it, the migration creates friction for the existing user base.

**Independent Test**: Can be tested by running the existing integration test suite (build.test.ts, exports.test.ts, globals.test.ts, include.test.ts, webapp.test.ts) against the new `@gas-plugin/unplugin/vite` package and verifying all tests pass with identical output.

**Acceptance Scenarios**:

1. **Given** an existing project using `gas-vite-plugin` with default options, **When** the developer replaces it with `@gas-plugin/unplugin/vite` and runs the build, **Then** the output is identical to the previous build.
2. **Given** an existing project using `gas-vite-plugin` with `include`, `globals`, and `autoGlobals` options, **When** the developer switches to `@gas-plugin/unplugin/vite`, **Then** all options work identically.
3. **Given** the existing `GasPluginOptions` interface, **When** a developer references the new package's types, **Then** the interface is fully compatible (no breaking changes).

---

### User Story 3 - Use GAS Plugin with webpack (Priority: P2)

A developer maintaining a webpack-based GAS project wants to use the GAS plugin. They install `@gas-plugin/unplugin/webpack`, add it to their webpack config, and get a working GAS-compatible bundle.

**Why this priority**: webpack is widely used in enterprise environments. Supporting it broadens adoption but is lower priority than Rollup because fewer GAS projects use webpack.

**Independent Test**: Can be tested by creating a webpack project with GAS source files, adding the plugin, running a build, and verifying export stripping and manifest copy work correctly.

**Acceptance Scenarios**:

1. **Given** a webpack 5 project with GAS source files, **When** the developer adds `@gas-plugin/unplugin/webpack` to the plugins array and runs the build, **Then** the output has export keywords stripped and appsscript.json is present in the output directory.
2. **Given** a webpack project with the `globals` option set, **When** the build completes, **Then** the protected functions are retained in the output bundle.

---

### User Story 4 - Use GAS Plugin with esbuild (Priority: P2)

A developer who prefers esbuild for its speed wants to use the GAS plugin. They install `@gas-plugin/unplugin/esbuild`, add it to their esbuild build script, and get a correctly processed GAS bundle.

**Why this priority**: esbuild is popular for fast builds. It shares P2 with webpack as an important but secondary bundler target.

**Independent Test**: Can be tested by creating an esbuild build script with GAS source files, adding the plugin, and verifying the output.

**Acceptance Scenarios**:

1. **Given** an esbuild build script with GAS source files, **When** the developer adds `@gas-plugin/unplugin/esbuild` and runs the build, **Then** export keywords are stripped and appsscript.json is copied to the output.

---

### User Story 5 - Use GAS Plugin with Bun Bundler (Priority: P2)

A developer using Bun as their runtime and bundler wants to use the GAS plugin. They install `@gas-plugin/unplugin/bun`, configure it in their Bun build script, and get a correctly processed GAS bundle.

**Why this priority**: Bun is a rapidly growing runtime with a built-in bundler. Supporting it positions the plugin for the modern JS ecosystem.

**Independent Test**: Can be tested by creating a Bun build script with GAS source files, adding the plugin, and verifying the output has exports stripped and manifest copied.

**Acceptance Scenarios**:

1. **Given** a Bun build script with GAS source files, **When** the developer adds `@gas-plugin/unplugin/bun` and runs `bun build`, **Then** export keywords are stripped and appsscript.json is copied to the output.
2. **Given** Bun's plugin API has limited lifecycle hooks, **When** the plugin runs, **Then** it gracefully handles missing hooks and still performs core functions (transform, file copy via alternative mechanisms).

---

### User Story 6 - Use GAS Plugin with Deno (Priority: P3)

A developer using Deno wants to build a GAS project. They use the plugin with Deno's bundling capabilities (esbuild-based or Deno-native) and get a working GAS-compatible output.

**Why this priority**: Deno's bundler ecosystem is still maturing. Support is valuable for forward-looking developers but less critical than established bundlers.

**Independent Test**: Can be tested by creating a Deno-based build pipeline that uses the plugin and verifying the output.

**Acceptance Scenarios**:

1. **Given** a Deno project that uses esbuild for bundling, **When** the developer adds `@gas-plugin/unplugin/esbuild` (compatible with Deno's esbuild usage), **Then** the GAS bundle is produced correctly.

---

### User Story 7 - Single Package with Subpath Exports (Priority: P3)

A developer installs `@gas-plugin/unplugin` and imports the bundler-specific entry point via subpath exports (e.g., `import gasPlugin from "@gas-plugin/unplugin/vite"`). The single package provides all bundler adapters without requiring separate installations per bundler.

**Why this priority**: Clean subpath export structure is a quality-of-life improvement. The core functionality must work first (P1/P2) before optimizing the distribution ergonomics.

**Independent Test**: Can be tested by installing `@gas-plugin/unplugin` and importing from each subpath, verifying each returns a valid plugin instance for the respective bundler.

**Acceptance Scenarios**:

1. **Given** a developer installs `@gas-plugin/unplugin`, **When** they import from `@gas-plugin/unplugin/vite`, **Then** it returns a valid Vite plugin instance with the same API as the current `gas-vite-plugin`.
2. **Given** a developer installs `@gas-plugin/unplugin`, **When** they import from `@gas-plugin/unplugin/rollup`, **Then** it returns a valid Rollup plugin instance.
3. **Given** the package.json `exports` field, **When** a developer tries to import from an unsupported subpath, **Then** the module resolution fails with a clear error (standard Node.js subpath export behavior).

---

### Edge Cases

- What happens when a bundler does not support the `writeBundle` hook (e.g., Bun)? The plugin should gracefully degrade and use `buildEnd` for file operations, or clearly warn the user that file copy features are unavailable.
- What happens when a user configures bundler-specific build options (e.g., webpack's `optimization.minimize`) that conflict with the plugin's defaults? The plugin should respect user configuration and not override explicit bundler settings.
- What happens when the `transform` hook receives non-JS/TS files? The plugin should skip transformation for files that are not JavaScript or TypeScript (filter by file extension).
- What happens when `autoGlobals` detects export names in a bundler that already handles tree-shaking differently? The globals protection injection should work consistently across bundlers since it operates at the source code level before bundler-specific tree-shaking.
- What happens when the `include` glob pattern resolves to zero files? The plugin should silently succeed (no error), matching current behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The plugin MUST provide a universal core that works across Vite 5+, Rollup 4+, webpack 5+, esbuild 0.17+, Rspack, Bun 1.0+, and Deno-compatible bundlers.
- **FR-002**: The plugin MUST strip `export` keywords (inline exports, export blocks, default exports) from the final bundle output for all supported bundlers.
- **FR-003**: The plugin MUST copy `appsscript.json` manifest to the output directory for all supported bundlers.
- **FR-004**: The plugin MUST support the `include` option to copy additional files (matched by glob patterns) to the output directory for all supported bundlers.
- **FR-005**: The plugin MUST support the `globals` option to protect named functions from tree-shaking for all supported bundlers.
- **FR-006**: The plugin MUST support the `autoGlobals` option (default: true) to automatically protect exported function names from tree-shaking.
- **FR-007**: The plugin MUST accept the existing `GasPluginOptions` interface without breaking changes (`manifest`, `include`, `globals`, `autoGlobals`).
- **FR-008**: The plugin MUST be distributed as a single package `@gas-plugin/unplugin` with subpath exports for each bundler (`@gas-plugin/unplugin/vite`, `@gas-plugin/unplugin/rollup`, `@gas-plugin/unplugin/webpack`, `@gas-plugin/unplugin/esbuild`, `@gas-plugin/unplugin/bun`), following unplugin conventions.
- **FR-009**: The plugin MUST skip transformation for non-JS/TS files and virtual modules.
- **FR-010**: The plugin MUST set sensible build defaults per bundler (e.g., disable minification) while respecting user overrides.
- **FR-011**: The `@gas-plugin/unplugin/vite` package MUST produce output identical to the current `gas-vite-plugin` for all existing test cases.
- **FR-012**: The existing `gas-vite-plugin` package MUST be unpublished from npm upon release of `@gas-plugin/unplugin`. No wrapper or transition period.

### Key Entities

- **Plugin Core**: The shared logic containing export stripping, globals protection, file inclusion, and manifest copy — bundler-agnostic.
- **Bundler Adapter**: A thin entry point per bundler that wraps the core and exposes the correct plugin interface for that bundler.
- **GasPluginOptions**: The user-facing configuration interface shared across all bundler adapters.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All existing integration tests pass against `@gas-plugin/unplugin/vite` with identical output to the current `gas-vite-plugin`.
- **SC-002**: A Rollup-based GAS project produces a GAS-compatible bundle (no exports, globals protected, manifest present, clasp-pushable) using `@gas-plugin/unplugin/rollup`.
- **SC-003**: A webpack-based GAS project produces a GAS-compatible bundle using `@gas-plugin/unplugin/webpack`.
- **SC-004**: An esbuild-based GAS project produces a GAS-compatible bundle using `@gas-plugin/unplugin/esbuild`.
- **SC-004a**: A Bun-based GAS project produces a GAS-compatible bundle using `@gas-plugin/unplugin/bun`.
- **SC-005**: Pure transform modules (transforms.ts, include.ts, globals.ts) maintain 100% test coverage.
- **SC-006**: A single `@gas-plugin/unplugin` install provides all bundler adapters via subpath exports, with bundlers listed as optional peer dependencies (no forced bundler installation).
- **SC-007**: Migration from `gas-vite-plugin` to `@gas-plugin/unplugin/vite` requires only changing the package name and import path — no config or option changes needed.

## Assumptions

- Rspack support is covered via webpack compatibility (Rspack is webpack-compatible). A dedicated `@gas-plugin/rspack` package can be added later if needed.
- Bun's plugin API has limited lifecycle hooks (no `buildEnd`/`writeBundle`). The `@gas-plugin/unplugin/bun` adapter will use alternative mechanisms (e.g., post-build file operations) to handle manifest copy and file inclusion.
- Deno support is provided through esbuild compatibility. Deno projects can use `@gas-plugin/unplugin/esbuild` since Deno's bundling ecosystem is esbuild-based. A dedicated Deno package may be added if Deno develops its own distinct bundler API.
- The `gas-vite-plugin` npm package will be unpublished from npm upon `@gas-plugin/unplugin` release. Clean break, no transition wrapper.
- The `@gas-plugin` npm organization/scope is available and owned by the project maintainer.
- `@gas-plugin/unplugin` starts at v0.0.5, continuing the `gas-vite-plugin` (v0.0.4) version lineage.
