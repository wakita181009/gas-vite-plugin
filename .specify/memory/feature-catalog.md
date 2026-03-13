# Feature Catalog

## Entities / Topics

| Entity/Topic | Overview Doc | Description |
|-------------|-------------|-------------|
| gas-vite-plugin | `.specify/features/gas-vite-plugin/overview.md` | Vite plugin that transforms ES module output into GAS-compatible flat files with web app support |

## Use Cases

| Entity/Topic | Use Case | Doc Path | Type |
|-------------|----------|----------|------|
| gas-vite-plugin | Export Stripping | `.specify/features/gas-vite-plugin/export-stripping.md` | command |
| gas-vite-plugin | Manifest Copy | `.specify/features/gas-vite-plugin/manifest-copy.md` | command |
| gas-vite-plugin | Build Defaults | `.specify/features/gas-vite-plugin/build-defaults.md` | command |
| gas-vite-plugin | Include Copy | `.specify/features/gas-vite-plugin/include-copy.md` | command |
| gas-vite-plugin | Globals Protection | `.specify/features/gas-vite-plugin/globals-protection.md` | command |

## Reverse Lookup — by Endpoint

| Endpoint | Use Case Doc |
|----------|-------------|
| `stripExportKeywords()` | `.specify/features/gas-vite-plugin/export-stripping.md` |
| `removeExportBlocks()` | `.specify/features/gas-vite-plugin/export-stripping.md` |
| `resolveIncludeFiles()` | `.specify/features/gas-vite-plugin/include-copy.md` |
| `copyFilesFlat()` | `.specify/features/gas-vite-plugin/include-copy.md` |
| `detectNamesToProtect()` | `.specify/features/gas-vite-plugin/globals-protection.md` |
| `gasPlugin()` | `.specify/features/gas-vite-plugin/overview.md` |
| Vite `config()` hook | `.specify/features/gas-vite-plugin/build-defaults.md` |
| Vite `transform()` hook | `.specify/features/gas-vite-plugin/globals-protection.md` |
| Vite `generateBundle()` hook | `.specify/features/gas-vite-plugin/export-stripping.md`, `.specify/features/gas-vite-plugin/globals-protection.md` |
| Vite `closeBundle()` hook | `.specify/features/gas-vite-plugin/manifest-copy.md`, `.specify/features/gas-vite-plugin/include-copy.md` |

## Reverse Lookup — by File

| File Path | Related Docs |
|-----------|-------------|
| `packages/gas-vite-plugin/src/index.ts` | overview, export-stripping, manifest-copy, build-defaults, include-copy, globals-protection |
| `packages/gas-vite-plugin/src/transforms.ts` | export-stripping |
| `packages/gas-vite-plugin/src/include.ts` | include-copy |
| `packages/gas-vite-plugin/src/types.ts` | overview, include-copy, globals-protection |
| `packages/gas-vite-plugin/tests/transforms.test.ts` | export-stripping |
| `packages/gas-vite-plugin/tests/include.test.ts` | include-copy |
| `packages/gas-vite-plugin/tests/integration/build.test.ts` | export-stripping, manifest-copy, build-defaults |
| `packages/gas-vite-plugin/tests/integration/exports.test.ts` | export-stripping |
| `packages/gas-vite-plugin/tests/integration/globals.test.ts` | globals-protection |
| `packages/gas-vite-plugin/tests/integration/include.test.ts` | include-copy |
| `packages/gas-vite-plugin/tests/integration/webapp.test.ts` | include-copy, globals-protection |

## Reverse Lookup — by Search Tag

| Tag | Related Docs |
|-----|-------------|
| GAS | overview, export-stripping, manifest-copy, build-defaults, include-copy, globals-protection |
| export removal | export-stripping |
| appsscript.json | manifest-copy |
| minify | build-defaults |
| code splitting | build-defaults |
| clasp push | manifest-copy |
| Vite plugin | overview |
| include | include-copy |
| glob | include-copy |
| HTML | include-copy |
| HtmlService | include-copy |
| web app | include-copy, globals-protection |
| globals | globals-protection |
| autoGlobals | globals-protection |
| tree-shaking | globals-protection |
| tinyglobby | include-copy |
| rolldownOptions | build-defaults |

## Spec Traceability

| Spec | Feature Docs |
|------|-------------|
| `.specify/specs/001-gas-vite-plugin-v01/spec.md` | overview, export-stripping (US1, FR-001–003), manifest-copy (US2, FR-004/013), build-defaults (US3, FR-005/006) |
| `.specify/specs/002-gas-vite-plugin-v02/spec.md` | include-copy (US1, FR-001/009/010), globals-protection (US2 FR-002, US3 FR-003), export-stripping (US4, FR-004–008) |
