---
name: tdd-workflow
description: Use this skill when writing new features, fixing bugs, or refactoring code. Enforces test-driven development with 100% coverage on core transforms and 80%+ overall coverage.
origin: ECC
---

# Test-Driven Development Workflow

This skill ensures all code development follows TDD principles with comprehensive test coverage, tailored for the gas-vite-plugin project.

## When to Activate

- Writing new features or functionality
- Fixing bugs or issues
- Refactoring existing code
- Adding new transform functions
- Modifying Vite plugin hooks

## Core Principles

### 1. Tests BEFORE Code
ALWAYS write tests first, then implement code to make tests pass.

### 2. Coverage Requirements
- **`src/transforms.ts` (core logic)**: 100% coverage — statements, branches, functions, lines
- **Overall**: 80%+ coverage
- All edge cases covered
- Error scenarios tested
- Boundary conditions verified

### 3. Test Types

#### Unit Tests (`tests/unit/`)
- Pure transform functions in isolation
- String-in, string-out validation
- Edge cases: empty strings, comments, string literals, indentation

#### Integration Tests (`tests/integration/`)
- Real Vite builds against fixture projects
- Assert on actual build output
- Fixtures created and torn down per test (no shared mutable state)
- Plugin options and config hook behavior

## TDD Workflow Steps

### Step 1: Write User Journeys
```
As a [role], I want to [action], so that [benefit]

Example:
As a GAS developer, I want export keywords stripped from my build output,
so that Google Apps Script can execute my functions as top-level declarations.
```

### Step 2: Generate Test Cases
For each user journey, create comprehensive test cases:

```typescript
import { describe, expect, it } from "vitest";
import { stripExportKeywords } from "../../src/transforms.js";

describe("stripExportKeywords", () => {
  it("strips export from function declarations", () => {
    const input = "export function onOpen() { return 1; }";
    const result = stripExportKeywords(input);
    expect(result).toBe("function onOpen() { return 1; }");
  });

  it("returns code unchanged when no exports exist", () => {
    const input = "function foo() {}";
    const result = stripExportKeywords(input);
    expect(result).toBe(input);
  });

  it("does not modify export inside a string literal", () => {
    const input = 'const msg = "export function fake() {}";';
    const result = stripExportKeywords(input);
    expect(result).toBe(input);
  });
});
```

### Step 3: Run Tests (They Should Fail)
```bash
pnpm test
# Tests should fail — we haven't implemented yet
```

### Step 4: Implement Code
Write minimal code to make tests pass:

```typescript
// Implementation guided by tests — pure functions, no side effects
export function stripExportKeywords(code: string): string {
  // Implementation here
}
```

### Step 5: Run Tests Again
```bash
pnpm test
# Tests should now pass
```

### Step 6: Refactor
Improve code quality while keeping tests green:
- Remove duplication
- Improve naming
- Optimize performance
- Enhance readability

### Step 7: Verify Coverage
```bash
pnpm test:coverage
# Verify 100% on transforms.ts, 80%+ overall
```

## Testing Patterns

### Unit Test Pattern (Vitest)
```typescript
import { describe, expect, it } from "vitest";
import { removeExportBlocks } from "../../src/transforms.js";

describe("removeExportBlocks", () => {
  it("removes single named export block", () => {
    const input = "function foo() {}\nexport { foo };";
    const result = removeExportBlocks(input);
    expect(result).toBe("function foo() {}\n");
  });

  it("removes export default prefix", () => {
    const input = "export default function handler() {}";
    const result = removeExportBlocks(input);
    expect(result).toBe("function handler() {}");
  });

  it("returns code unchanged when no export blocks exist", () => {
    const input = "function foo() {}\nconst bar = 1;";
    const result = removeExportBlocks(input);
    expect(result).toBe(input);
  });
});
```

### Integration Test Pattern (Vitest + real Vite builds)
```typescript
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "vite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import gasPlugin from "../../src/index.js";

const FIXTURES_DIR = resolve(import.meta.dirname, "../fixtures");

function createFixture(name: string, files: Record<string, string>): string {
  const dir = resolve(FIXTURES_DIR, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  mkdirSync(resolve(dir, "src"), { recursive: true });

  for (const [path, content] of Object.entries(files)) {
    const fullPath = resolve(dir, path);
    mkdirSync(resolve(fullPath, ".."), { recursive: true });
    writeFileSync(fullPath, content);
  }
  return dir;
}

async function buildFixture(fixtureDir: string, pluginOptions = {}) {
  await build({
    root: fixtureDir,
    logLevel: "silent",
    plugins: [gasPlugin(pluginOptions)],
    build: {
      lib: {
        entry: resolve(fixtureDir, "src/main.ts"),
        formats: ["es"],
        fileName: () => "Code.js",
      },
    },
  });
}

beforeEach(() => {
  rmSync(FIXTURES_DIR, { recursive: true, force: true });
});

afterEach(() => {
  rmSync(FIXTURES_DIR, { recursive: true, force: true });
});

describe("Build output", () => {
  it("removes export keywords from function declarations", async () => {
    const dir = createFixture("basic", {
      "src/main.ts": "export function onOpen() { return 1; }",
    });

    await buildFixture(dir);
    const output = readFileSync(resolve(dir, "dist/Code.js"), "utf-8");

    expect(output).not.toMatch(/^export\s/m);
    expect(output).toMatch(/^function onOpen\(\)/m);
  });
});
```

### Mocking with Vitest
```typescript
import { vi } from "vitest";

// Spy on console.warn (e.g., for missing manifest warning)
const warnSpy = vi
  .spyOn(console, "warn")
  .mockImplementation(() => {}); // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional no-op mock

// Assert on warning
expect(warnSpy).toHaveBeenCalledWith(
  expect.stringContaining("[gas-vite-plugin] manifest not found"),
);

warnSpy.mockRestore();
```

## Test File Organization

```
packages/gas-vite-plugin/
├── src/
│   ├── index.ts              # Plugin factory + Vite hooks
│   └── transforms.ts         # Pure string transforms (100% coverage)
├── tests/
│   ├── unit/
│   │   └── transforms.test.ts    # Unit tests for pure functions
│   ├── integration/
│   │   └── build.test.ts         # Real Vite build tests with fixtures
│   └── fixtures/                  # Created/destroyed per test run
└── vitest.config.ts
```

## Coverage Configuration (vitest.config.ts)

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/transforms.ts"],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
```

## Common Testing Mistakes to Avoid

### Don't: Test Implementation Details
```typescript
// Don't rely on internal variable names — esbuild may rename them
expect(output).toContain("const greeting = 'hello'");
```

### Do: Test Observable Behavior
```typescript
// Test that the function exists and output is valid GAS
expect(output).toMatch(/^function onOpen\(/m);
expect(output).not.toMatch(/^export\s/m);
```

### Don't: Share Mutable State Between Tests
```typescript
// Tests depend on each other via shared fixture
const dir = createFixture("shared", { ... }); // created once, used by multiple tests
```

### Do: Isolate Each Test
```typescript
// Each test creates and cleans up its own fixture
beforeEach(() => rmSync(FIXTURES_DIR, { recursive: true, force: true }));
afterEach(() => rmSync(FIXTURES_DIR, { recursive: true, force: true }));
```

## Development Workflow Commands

### Run Tests
```bash
pnpm test
```

### Run Tests in Watch Mode
```bash
pnpm --filter gas-vite-plugin exec vitest --watch
```

### Run Coverage Report
```bash
pnpm test:coverage
```

### Lint & Format Check
```bash
pnpm check
```

### CI/CD (GitHub Actions)
```yaml
- name: Run Tests
  run: pnpm test
- name: Check Coverage
  run: pnpm test:coverage
- name: Lint & Format
  run: pnpm check
```

## Best Practices

1. **Write Tests First** — Always TDD
2. **Pure Functions for Transforms** — String-in, string-out; no side effects
3. **Real Builds for Integration** — Use actual Vite builds, not mocks
4. **Fixture Per Test** — Create and tear down fixtures in beforeEach/afterEach
5. **Test Edge Cases** — Empty strings, comments, string literals, indentation
6. **Test Error Paths** — Missing manifests, invalid configs
7. **Keep Tests Fast** — Unit tests < 50ms; integration tests use `logLevel: "silent"`
8. **No Shared Mutable State** — Every test is independent
9. **Regex Assertions on Output** — Use `toMatch(/pattern/m)` for build output validation
10. **Review Coverage Reports** — 100% on transforms.ts is enforced, not optional

## Success Metrics

- 100% code coverage on `src/transforms.ts`
- 80%+ overall coverage
- All tests passing (green)
- No skipped or disabled tests
- Integration tests cover all user stories (US1, US2, US3, ...)
- Tests catch regressions before CI fails

---

**Remember**: Tests are not optional. Core transform logic requires 100% coverage. Integration tests use real Vite builds — no mocking the build pipeline.