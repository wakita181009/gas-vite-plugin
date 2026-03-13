# GAS Vite Plugin

A minimal Vite plugin for Google Apps Script (GAS) projects.

## Design Principles & Architecture

See [`.specify/memory/constitution.md`](../.specify/memory/constitution.md) for all design principles, architecture constraints, and governance rules.

## Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Build all packages
pnpm test             # Run tests (gas-vite-plugin)
pnpm check            # Lint & format check with Biome
```

## Remaining TODO

- [ ] Consider edge cases: re-exports, default exports, namespace exports
- [ ] Test with clasp 3.x push workflow
- [ ] Publish to npm