# Feature Specification: gas-vite-plugin v0.2 (Web App & Advanced Features)

**Feature Branch**: `002-gas-vite-plugin-v02`
**Created**: 2026-03-13
**Status**: Draft
**Input**: Extend gas-vite-plugin with HTML/web app support, explicit globals, and export edge case handling

## Clarifications

### Session 2026-03-13

- Q: `globals` mechanism — should it protect functions from tree-shaking? → A: Yes. Functions listed in `globals` are protected from tree-shaking via `transform` hook injection (`typeof <name>;`), removed in `generateBundle`
- Q: `autoGlobals: false` behavior — what happens to exported functions? → A: Export removal always runs. `autoGlobals` only controls whether exported functions are automatically added to the `globals` list for tree-shake protection. No scope hiding is applied
- Q: `include` glob pattern base directory? → A: Resolved relative to Vite's `root` (`config.root`)
- Q: US5 test app verification scope — automate deployment? → A: Build output structure verification only (file existence, top-level function checks). Deployment is manual
- Q: IIFE detection/unwrap in v0.2 scope? → A: Deferred to a future version

## Assumptions & Constraints

- **Inherits all v0.1 constraints**: GAS V8 runtime only, no ES Module support, flat file structure required.
- **GAS `HtmlService` loads files by name only**: `HtmlService.createHtmlOutputFromFile("index")` looks for a file named `index.html` at the project root. Subdirectory paths are not supported. This is why `include` must copy files flat.
- **Backward compatibility with v0.1**: All v0.1 projects must continue to work without configuration changes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Additional file copying via include option (Priority: P1)

A developer can specify glob patterns via the `include` option to copy additional files (HTML, CSS, images, etc.) to the output directory alongside the bundled JS and manifest. This is essential for GAS web apps that serve HTML via `HtmlService.createHtmlOutputFromFile()`.

**Why this priority**: GAS web apps require HTML files in the deployed project. This unlocks the entire web app use case.

**Independent Test**: Configure `include: ["src/**/*.html"]`, place HTML files in `src/`, build, verify all matched files are copied to the output directory.

**Acceptance Scenarios**:

1. **Given** `include: ["src/**/*.html"]` and HTML files exist in `src/`, **When** the project is built, **Then** matched HTML files are copied flat (no subdirectories) to the output directory
2. **Given** `include: ["src/**/*.html", "src/**/*.css"]` (multiple patterns), **When** the project is built, **Then** all matched files from both patterns are copied flat to the output directory
3. **Given** `include` is not configured (default), **When** the project is built, **Then** only `appsscript.json` is copied (backward compatible with v0.1)
4. **Given** an `include` pattern that matches no files, **When** the project is built, **Then** the build succeeds with no errors

---

### User Story 2 - Explicit globals list (Priority: P1)

A developer can specify additional function names via the `globals` option to expose as top-level declarations, even if they aren't directly exported from the entry point. This covers advanced patterns where functions need to be callable by GAS but aren't standard exports (e.g., menu handlers registered by string name, time-driven trigger targets).

**Why this priority**: Needed for real-world patterns where GAS calls functions by string name. Without this, non-exported functions may be tree-shaken away.

**Independent Test**: Configure `globals: ["myHelper"]`, where `myHelper` is defined but not exported, build, verify `myHelper` is callable at top level.

**Acceptance Scenarios**:

1. **Given** a function name is listed in the globals configuration and exists in the bundle, **When** the project is built, **Then** that function is accessible as a top-level declaration
2. **Given** a function name is listed but does not exist in the bundle, **When** the project is built, **Then** it is silently ignored (no error)
3. **Given** a function is already a top-level declaration and also listed in globals, **When** the project is built, **Then** no duplicate declaration is created

---

### User Story 3 - autoGlobals toggle (Priority: P2)

A developer can disable automatic export-to-global conversion with `autoGlobals: false`, relying only on the explicit `globals` list instead. This provides full control over which functions become visible to GAS.

**Why this priority**: Provides escape hatch for users who want precise control. Not needed for most projects.

**Independent Test**: Disable auto-detection, configure only one global, export multiple functions, verify only the configured one is exposed.

**Acceptance Scenarios**:

1. **Given** auto-detection is disabled and no globals are configured, **When** the project is built, **Then** export keywords are always removed (required for GAS compatibility) but no additional global wrappers are generated for the `globals` list
2. **Given** auto-detection is disabled and one global is configured, **When** the project is built, **Then** only that function is exposed as top-level

---

### User Story 4 - Export edge cases (Priority: P2)

The plugin correctly handles all export patterns that a bundler may produce, not just simple `export function` declarations. This includes default exports, class exports, renamed exports, and aggregated export blocks.

**Why this priority**: Real-world projects use re-exports, default exports, and barrel files. Incorrect handling silently breaks GAS deployment.

**Independent Test**: Create files using each export pattern, build, verify no `export` keywords remain and all declarations are accessible.

**Acceptance Scenarios**:

1. **Given** `export default function handler() {}`, **When** built, **Then** `function handler() {}` exists at top level
2. **Given** `export { foo, bar }` (named export aggregation), **When** built, **Then** the export block is removed, `foo` and `bar` remain as top-level declarations
3. **Given** `export { foo as bar }` (renamed export), **When** built, **Then** handled correctly (alias resolved by the bundler, export removed by the plugin)
4. **Given** `export class MyService {}`, **When** built, **Then** `class MyService {}` exists at top level
5. **Given** `export default expression` (non-function default), **When** built, **Then** the `export default` prefix is removed

---

### User Story 5 - Test app: GAS web app (Priority: P1)

A standalone test app (`apps/gas-webapp`) that exercises the GAS web app pattern: `doGet`/`doPost` returning HTML or text responses, with server-side functions callable from client-side HTML via `google.script.run`. Uses the `include` option for HTML files.

**Why this priority**: Validates the web app use case and the `include` option together.

**Independent Test**: Build the app, deploy as web app, verify the HTML page loads and server-side functions are callable from the client.

**Acceptance Scenarios**:

1. **Given** a project with `doGet()` returning an HTML page, **When** built, **Then** `doGet` is a top-level function in the output
2. **Given** HTML files configured via `include: ["src/**/*.html"]`, **When** built, **Then** HTML files are present in the output directory
3. **Given** server-side functions called from client HTML (e.g., `getData`, `saveData`), **When** built, **Then** all are top-level declarations accessible from the client
4. **Given** the built output, **When** inspected, **Then** the output structure is correct for GAS web app deployment (verified manually)

---

### Edge Cases

- What happens with IIFE-wrapped output? → Deferred to future version. Vite library mode ES output does not produce IIFE wrapping; only affects users explicitly choosing `formats: ['iife']`
- What happens when `include` patterns overlap (same file matched twice)? → File is copied only once, no error
- What happens when `include` matches files outside the project root? → Ignored for security; warn the developer
- What happens when `include` matches files in subdirectories (e.g., `src/views/index.html`)? → Copied flat to output directory as `index.html` (GAS requires flat file structure; `HtmlService.createHtmlOutputFromFile("index")` looks by name only)
- What happens when flat copying causes filename collisions (e.g., `src/a/page.html` and `src/b/page.html`)? → Warn the developer and skip the duplicate
- What happens with `globals: ["onOpen"]` when `autoGlobals: true` and `onOpen` is also exported? → No conflict; function exists once at top level
- What happens with anonymous default export `export default () => {}`? → The bundler typically assigns a name; if unnamed, the `export default` prefix is removed leaving the expression

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Plugin MUST support an `include` option accepting glob patterns (via `tinyglobby`) to copy additional files flat (no subdirectory structure) to the output directory, since GAS projects require a flat file structure. Patterns are resolved relative to Vite's `root` (`config.root`)
- **FR-002**: Plugin MUST support a `globals` option for explicitly listing function names to expose as top-level declarations. Functions listed in `globals` MUST be protected from tree-shaking via `transform` hook injection (`typeof <name>;`), removed in `generateBundle`
- **FR-003**: Plugin MUST support an `autoGlobals` option (default: `true`) to toggle automatic export detection. Export removal always runs regardless of this setting; `autoGlobals` only controls whether exported functions are automatically added to the globals list for tree-shake protection. No scope hiding is applied when `autoGlobals: false`
- **FR-004**: Plugin MUST correctly handle `export default function` declarations
- **FR-005**: Plugin MUST correctly handle `export { name, ... }` aggregation blocks
- **FR-006**: Plugin MUST correctly handle `export { name as alias }` renamed exports
- **FR-007**: Plugin MUST correctly handle `export class` declarations
- **FR-008**: Plugin MUST correctly handle `export default expression` (non-function defaults)
- **FR-009**: Plugin MUST remain backward compatible with v0.1 configuration (no breaking changes)
- **FR-010**: `include` option MUST NOT affect the existing `appsscript.json` copy behavior

### Key Entities

- **Plugin Configuration** (extended): Adds `include`, `globals`, and `autoGlobals` fields to the v0.1 configuration
- **GAS Triggers**: The set of well-known function names that GAS calls automatically (`onOpen`, `onEdit`, `onInstall`, `onSelectionChange`, `onFormSubmit`, `doGet`, `doPost`). These are NOT auto-included in `globals`; users must explicitly export or list them in `globals` if needed.
- **Include Pattern**: A glob pattern string (resolved by `tinyglobby`) that matches files to copy flat to the output directory

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: HTML files specified via `include` are present in the output directory after build
- **SC-002**: All functions listed in `globals` are callable as top-level declarations in the output
- **SC-003**: All 5 export patterns (default function, aggregation, renamed, class, default expression) produce correct output
- **SC-004**: Test app (`apps/gas-webapp`) builds and produces correct output structure (file existence, top-level function verification). Actual GAS deployment is verified manually
- **SC-005**: v0.1 projects continue to work without configuration changes (backward compatibility)
- **SC-006**: New features have 100% unit test coverage
