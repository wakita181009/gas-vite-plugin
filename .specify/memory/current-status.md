# Current Status

## In Progress

<!-- Nothing currently in progress -->

## Known Gaps

- `apps/gas-webapp` has not been tested with a real `clasp push` deployment (requires GAS project credentials).
- `index.ts` plugin hooks are covered via integration tests; branch coverage is 77.64% due to webpack `afterEmit` callback and esbuild `outfile` paths not being exercised in integration tests. Core modules are at 100%.
- IIFE-wrapped output detection/unwrap is deferred to a future version per spec clarification.
- webpack integration test not yet implemented (webpack is listed as P2 in spec).
- Bun integration test not yet implemented (Bun is listed as P2 in spec).
- Unmatched globals warning is implemented but not covered by a dedicated test (verified via integration behavior).

## Deferred Work

- npm publication artifacts are ready but `npm publish` has not been executed for `@gas-plugin/unplugin`.
- `gas-vite-plugin` npm unpublish pending per spec FR-012.
- IIFE detection/unwrap — deferred per v0.2 spec edge case decision.
- Deno support (US6, P3) — covered via esbuild compatibility, no dedicated adapter.

## Completed

- v0.1 (spec `001-gas-vite-plugin-v01`): Export stripping, manifest copy, build defaults — all implemented and tested.
- v0.2 (spec `002-gas-vite-plugin-v02`): Include copy, globals/autoGlobals protection, export edge cases, web app test app — all implemented and tested.
- v0.0.5 (spec `003-unplugin-migration`): Universal bundler plugin via unplugin v3. Core features (export stripping, manifest copy, include copy, globals protection, build defaults) ported to multi-bundler architecture. Vite 5–8+ compatibility. Unmatched globals warning added. Integration tests for Vite, Rollup, esbuild. Subpath exports for all 5 bundlers. Coverage: core 100%, overall 80%+.
