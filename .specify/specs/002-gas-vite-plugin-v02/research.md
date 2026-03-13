# Research: gas-vite-plugin v0.2

## R1: `globals` tree-shake protection mechanism

**Decision**: Use `transform` hook to inject `typeof <name>;` references for each `globals` entry, then strip them in `generateBundle`.

**Rationale**: `typeof <name>;` is a side-effect-free expression that tricks the bundler into keeping the referenced declaration. It's the simplest approach that doesn't require AST parsing or Rollup-internal APIs.

**Alternatives considered**:
- `moduleSideEffects: "no-treeshake"` on the module — too coarse, prevents tree-shaking for the entire module
- Virtual module that re-exports globals — more complex, requires `resolveId` + `load` hooks
- `/* @__NO_SIDE_EFFECTS__ */` annotations — requires user to annotate their code

## R2: `include` option implementation

**Decision**: Use `tinyglobby.globSync()` in the `closeBundle` hook (alongside existing manifest copy) to resolve patterns relative to `config.root` and copy matched files flat to `outDir`.

**Rationale**: `tinyglobby` is already a transitive dependency (via Vite). Adding it as a direct dependency is low cost. `closeBundle` is the right hook because file operations happen after bundle generation. `globSync` is appropriate since it runs once per build.

**Alternatives considered**:
- `fast-glob` — heavier, tinyglobby is lighter and already available
- Async glob in `closeBundle` — unnecessary complexity for a one-time operation
- Using `generateBundle` for file copy — wrong semantic; `generateBundle` is for bundle manipulation, not filesystem operations

## R3: `autoGlobals` behavior

**Decision**: `autoGlobals` (default: `true`) controls whether exported function names are automatically added to the tree-shake protection list. When `false`, only explicitly listed `globals` are protected. Export stripping always runs regardless.

**Rationale**: This keeps the toggle simple — it only affects the tree-shake injection in `transform`, not the export removal in `generateBundle`. No scope hiding or closure wrapping needed.

**Alternatives considered**:
- Closure-wrapping non-global functions — too complex, changes output structure, GAS doesn't benefit
- Removing the toggle entirely — some users want explicit control over what's exposed

## R4: Export edge case patterns (FR-004 through FR-008)

**Decision**: Extend existing regex transforms in `transforms.ts` to handle `export class` declarations. Other patterns (`export default function`, `export { ... }`, `export default expr`) are already handled by v0.1.

**Rationale**: The constitution mandates no AST parser. Regex-based transforms are sufficient for the patterns Vite/Rollup actually produces.

**Alternatives considered**:
- AST parsing (acorn/oxc) — violates constitution principle I (no AST parser dependency)
- Rollup `renderChunk` hook — no advantage over current `generateBundle` approach

## R5: tinyglobby dependency status

**Decision**: Add `tinyglobby` as a direct production dependency (not dev-only).

**Rationale**: It's already installed as a transitive dependency of Vite (v0.2.15). Adding it explicitly ensures it's available and version-pinned. This will be the plugin's first (and only) runtime dependency.

**Alternatives considered**:
- Relying on transitive availability — fragile; Vite could drop it in future versions
- Using Node.js built-in `fs.glob()` (Node 22+) — too new, plugin supports Node 20+
