# Feature Specification: GAS CLI - Extensible CLI Tool

**Feature Branch**: `004-gas-cli`
**Created**: 2026-03-14
**Status**: Draft
**Input**: User description: "Create a CLI for scaffolding GAS projects with templates, similar to google/aside, published as @gas-plugin/cli."

## Clarifications

### Session 2026-03-14

- Q: CLI scope — single `create` command or extensible multi-command CLI? → A: Extensible CLI with subcommand architecture (`gas-plugin create`, `gas-plugin deploy`, `gas-plugin init`, etc.). Initial release focuses on `create` subcommand; architecture supports future subcommands.
- Q: Package manager detection and auto-install behavior after scaffolding? → A: Auto-detect user's package manager (npm/pnpm/yarn/bun) and prompt to install dependencies (default Yes). Follows create-vite/create-next-app pattern.
- Q: Should generated projects include linting/formatting config? → A: Include Biome config only (lint + format, minimal setup). Consistent with the gas-plugin ecosystem's own tooling.
- Q: How should appsscript.json oauthScopes be handled per template? → A: Preset minimal scopes per template type (basic → spreadsheets, web app → html service, library → none). Users can add scopes as needed.
- Q: Should scaffolded projects auto-initialize a git repository? → A: Auto git init + .gitignore generation. Skip git init if already inside a git repo.
- Q: CLI framework and prompt library selection? → A: citty (unjs) + @clack/prompts. Aligns with unjs ecosystem (same as unplugin), TypeScript-first with strong type inference, native subcommand support with lazy loading. @clack/prompts is the industry standard adopted by create-vite.
- Q: `@gas-plugin/create` vs `@gas-plugin/cli` package relationship? → A: Single package `@gas-plugin/cli` only. Use `create` bin entry in package.json to support `npm create @gas-plugin` convention. No separate `@gas-plugin/create` package needed.
- Q: Template storage and rendering mechanism? → A: Plain file copy + lightweight string substitution (`{{projectName}}`, `{{bundler}}` placeholders). No template engine dependency. Templates are readable as-is. Same approach as create-vite and giget.
- Q: Testing strategy for the CLI? → A: Unit tests for template generation logic (string substitution, file structure, argument parsing) + integration tests running the actual `create` command in temp directories + build verification for representative combinations (e.g., basic+vite, webapp+rollup) in CI. Uses Vitest consistent with unplugin package.
- Q: Should scaffolded projects include a `dev` (watch) script? → A: Not in initial release. All templates generate `build` script only for now. `dev` (watch/rebuild) support is a future development item.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a New GAS Project from Template (Priority: P1)

A developer wants to start a new Google Apps Script project quickly. They run a single command (e.g., `npx @gas-plugin/create` or `npm create @gas-plugin`), answer a few prompts (project name, template type), and get a fully configured project directory with source files, bundler config, manifest, and package.json ready to go.

**Why this priority**: This is the core value proposition of the CLI. Without project scaffolding, the tool has no purpose. This single feature delivers immediate value to any new GAS developer.

**Independent Test**: Can be tested by running the create command in an empty directory, selecting the default template, and verifying that the generated project has a valid structure, installs dependencies, and builds successfully.

**Acceptance Scenarios**:

1. **Given** an empty directory, **When** the developer runs the create command and selects the "basic script" template, **Then** a project is generated with: source entry file, appsscript.json manifest, bundler config, package.json with correct dependencies, and a README.
2. **Given** the developer provides a project name via the prompt, **When** the scaffolding completes, **Then** the project directory is named accordingly and package.json reflects the project name.
3. **Given** the scaffolded project, **When** the developer runs `npm install && npm run build`, **Then** the project builds successfully and produces a valid GAS-compatible output in the dist directory.

---

### User Story 2 - Choose a Bundler (Priority: P1)

A developer has a preferred bundler (Vite, Rollup, esbuild, webpack, etc.). During scaffolding, they select their preferred bundler, and the generated project is preconfigured with the correct bundler config and the matching `@gas-plugin/unplugin/*` subpath export.

**Why this priority**: Co-P1 because the CLI's value is tightly linked to the unplugin ecosystem. Users must be able to choose their bundler to make the scaffolding useful beyond a single workflow.

**Independent Test**: Can be tested by running the create command, selecting each bundler option, and verifying that the correct bundler config file and `@gas-plugin/*` dependency are present.

**Acceptance Scenarios**:

1. **Given** the developer selects "Vite" as the bundler, **When** scaffolding completes, **Then** the project contains a `vite.config.ts` with `@gas-plugin/unplugin/vite` configured and the correct peer dependency in package.json.
2. **Given** the developer selects "Rollup" as the bundler, **When** scaffolding completes, **Then** the project contains a `rollup.config.mjs` with `@gas-plugin/unplugin/rollup` configured.
3. **Given** the developer selects "esbuild" as the bundler, **When** scaffolding completes, **Then** the project contains a build script using `@gas-plugin/unplugin/esbuild`.

---

### User Story 3 - Choose a Project Template (Priority: P2)

A developer wants to create a specific type of GAS project. The CLI offers template choices: a basic script (spreadsheet automation), a web app (doGet/doPost with HTML), or a library. Each template generates appropriate source files and configuration for that project type.

**Why this priority**: Multiple templates increase the CLI's utility but the basic template alone (from P1) already delivers a working project. Additional templates refine the experience.

**Independent Test**: Can be tested by scaffolding each template type and verifying the generated source files match the expected project structure for that type.

**Acceptance Scenarios**:

1. **Given** the developer selects the "web app" template, **When** scaffolding completes, **Then** the project contains a `doGet` function, an HTML file for the client UI, and the bundler config includes `include: ["src/**/*.html"]` and `globals` for server-side functions.
2. **Given** the developer selects the "basic script" template, **When** scaffolding completes, **Then** the project contains an `onOpen` function, a utilities module, and a simple appsscript.json manifest.
3. **Given** the developer selects the "library" template, **When** scaffolding completes, **Then** the project is structured for publishing as a GAS library with exported functions.

---

### User Story 4 - Non-Interactive Mode (Priority: P2)

A developer or CI system wants to scaffold a project without interactive prompts. They pass all options as command-line flags (e.g., `--template web-app --bundler vite --name my-project`), and the project is generated without any user interaction.

**Why this priority**: Non-interactive mode is essential for automation and CI/CD pipelines but not for the initial manual scaffolding use case.

**Independent Test**: Can be tested by running the create command with all flags specified and verifying that no prompts appear and the project is generated correctly.

**Acceptance Scenarios**:

1. **Given** the developer runs the command with `--template basic --bundler vite --name my-gas-app`, **When** the command completes, **Then** a `my-gas-app` directory is created with the basic Vite template and no prompts were shown.
2. **Given** the developer passes the `--yes` flag, **When** the command runs, **Then** all prompts use their default values.

---

### User Story 5 - clasp Integration Setup (Priority: P3)

A developer wants their scaffolded project to be ready for deployment via Google's clasp tool. During scaffolding, the CLI optionally sets up `.clasp.json` configuration, `.claspignore`, and deploy scripts in package.json.

**Why this priority**: clasp integration is a convenience feature. Developers can always set up clasp manually after scaffolding. It enhances the workflow but is not required for a functioning project.

**Independent Test**: Can be tested by scaffolding with clasp integration enabled and verifying the clasp config files are present and deploy scripts work.

**Acceptance Scenarios**:

1. **Given** the developer opts into clasp setup during scaffolding, **When** scaffolding completes, **Then** `.clasp.json` (with placeholder Script ID), `.claspignore`, and `deploy` npm scripts are added to the project.
2. **Given** the developer opts out of clasp setup, **When** scaffolding completes, **Then** no clasp-related files or scripts are present.
3. **Given** the developer provides a Script ID via flag (`--script-id`), **When** scaffolding completes, **Then** `.clasp.json` is configured with the provided ID.

---

### Edge Cases

- What happens when the target directory already exists and contains files? The CLI should warn the user and ask for confirmation before overwriting. In non-interactive mode, it should abort unless `--force` is specified.
- What happens when the developer has no internet connection during scaffolding? The CLI should generate all files from local templates without requiring network access. Dependency installation (`npm install`) may fail, but the project structure should still be created.
- What happens when an invalid template name or bundler name is provided via flags? The CLI should display available options and exit with a helpful error message.
- What happens when the project name contains special characters? The CLI should sanitize the name for use in package.json (following npm naming rules) while preserving the directory name as-is.
- What happens when the user runs the CLI from within an existing GAS project? The CLI should detect the existing appsscript.json and warn that a GAS project already exists in this directory.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The CLI MUST scaffold a complete, buildable GAS project from a single command.
- **FR-002**: The CLI MUST offer an interactive mode with prompts for: project name, template type, bundler choice, and dependency installation confirmation.
- **FR-003**: The CLI MUST offer a non-interactive mode where all options can be provided as command-line flags.
- **FR-004**: The CLI MUST support at least three template types: basic script, web app, and library.
- **FR-005**: The CLI MUST support bundler selection for at least: Vite, Rollup, esbuild, and webpack.
- **FR-006**: The CLI MUST generate a valid `appsscript.json` manifest for each template, with minimal preset OAuth scopes appropriate to the template type (e.g., spreadsheet scope for basic script, HTML service scope for web app, no scopes for library).
- **FR-007**: The CLI MUST generate a bundler configuration file preconfigured with the appropriate `@gas-plugin/unplugin/*` subpath export.
- **FR-008**: The CLI MUST generate a `package.json` with correct dependencies, scripts (`build` only for initial release; `dev` watch mode is a future development item), and metadata.
- **FR-009**: The CLI MUST generate TypeScript source files with a `tsconfig.json` appropriate for GAS development.
- **FR-009a**: The CLI MUST include a Biome configuration (`biome.json`) in generated projects with lint and format rules preconfigured.
- **FR-010**: The CLI MUST be invocable via `npx @gas-plugin/cli create`, `npm create @gas-plugin` (alias for create subcommand), or `pnpm create @gas-plugin`.
- **FR-011**: The CLI MUST warn and request confirmation when the target directory is not empty.
- **FR-012**: The CLI MUST optionally set up clasp configuration (`.clasp.json`, `.claspignore`, deploy scripts) when requested by the user.
- **FR-013**: The CLI MUST display a success message with next steps (install, build, deploy) after scaffolding completes.
- **FR-014**: The CLI MUST be published as a single package `@gas-plugin/cli` with a `create` bin entry in `package.json` to support `npm create @gas-plugin` / `pnpm create @gas-plugin` conventions. No separate `@gas-plugin/create` package is needed.
- **FR-015**: The CLI MUST use a subcommand architecture where `create` is the initial subcommand, with the design supporting future subcommands (e.g., `deploy`, `init`) without breaking changes.
- **FR-016**: The CLI MUST auto-detect the user's package manager (npm, pnpm, yarn, bun) from lockfiles or invocation context, and prompt to install dependencies after scaffolding (default: Yes).
- **FR-017**: In non-interactive mode, the CLI MUST accept a `--install` / `--no-install` flag to control dependency installation. Default is to install.
- **FR-018**: The CLI MUST auto-initialize a git repository (`git init`) and generate a `.gitignore` (covering `node_modules/`, `dist/`, `.clasp.json`) in the scaffolded project. If the target directory is already inside a git repository, `git init` MUST be skipped.

### Key Entities

- **CLI**: The extensible command-line tool (`@gas-plugin/cli`) with a subcommand router. Initial subcommand: `create`. Future subcommands can be added without architectural changes.
- **Template**: A predefined project structure with source files, config files, and manifest tailored to a specific GAS project type (basic script, web app, library). Templates are stored as plain files with `{{variable}}` placeholders, rendered via simple string substitution (no template engine).
- **Bundler Config**: A generated configuration file specific to the chosen bundler (vite.config.ts, rollup.config.mjs, etc.) preconfigured with the `@gas-plugin/*` plugin.
- **Project Manifest**: The `appsscript.json` file that defines GAS project settings (runtime version, scopes, web app configuration).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can go from zero to a buildable GAS project in under 60 seconds using the interactive CLI.
- **SC-002**: All three template types (basic script, web app, library) generate projects that build successfully on first attempt without manual edits.
- **SC-003**: All four bundler options (Vite, Rollup, esbuild, webpack) produce working build configurations.
- **SC-004**: Non-interactive mode generates identical output to interactive mode when given equivalent options.
- **SC-005**: The generated project's build output is a valid GAS-compatible bundle (no export keywords, manifest present, globals protected where applicable).
- **SC-006**: The CLI provides clear, actionable error messages for all invalid inputs.
- **SC-007**: Unit tests cover template generation logic (string substitution, file structure output). Integration tests verify end-to-end `create` command execution in temp directories. Representative template+bundler combinations build successfully in CI.

## Assumptions

- The CLI is built with `citty` (unjs CLI framework) for subcommand routing/argument parsing and `@clack/prompts` for interactive prompts. This aligns with the unjs ecosystem used by `@gas-plugin/unplugin`.
- The CLI depends on the unplugin migration (Feature 003) being complete, as templates reference `@gas-plugin/unplugin` subpath exports.
- Templates are bundled within the CLI package (not fetched from a remote registry), ensuring offline operation.
- The default bundler suggestion is Vite, as it is the most common choice in the modern JS ecosystem and the original bundler this plugin was built for.
- TypeScript is the default language for all templates. Plain JavaScript templates may be added later but are not in initial scope.
- The CLI does not handle Google OAuth or clasp login — it only generates clasp config files. Actual authentication is handled by the user running `clasp login` separately.
- Bun and Deno bundler options will be added to the CLI when their `@gas-plugin/unplugin/*` adapters are stable (covered by Feature 003).
