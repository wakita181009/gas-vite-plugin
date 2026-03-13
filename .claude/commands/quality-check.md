---
description: Run linting and tests to validate code quality
---

Run quality checks on the codebase.

1. Run `pnpm check` (Biome lint & format)
2. If errors are found, fix them automatically with `pnpm check --fix`
3. Run `pnpm test`
4. If tests fail, investigate and fix the root cause
5. Report a summary of results (pass/fail counts)
