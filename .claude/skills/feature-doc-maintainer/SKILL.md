---
name: feature-doc-maintainer
description: >
  Maintain `.specify/features/**`, `.specify/memory/feature-catalog.md`, and
  `.specify/memory/current-status.md` after implementation work. Use when code
  changes are complete and the orchestrator needs to record business rules,
  traceability, touched files, persistence touchpoints, and change impact for
  future search and safe modification.
---

# Feature Doc Maintainer

Use this skill after implementation or refactoring work has finished. This skill is for the orchestrator, not for the `implement-usecase` subagent.

## Inputs

Gather only the minimum context needed:

1. `.specify/memory/constitution.md`
2. `.specify/memory/current-status.md`
3. `.specify/memory/feature-catalog.md`
4. Relevant spec files for the implemented feature
5. Relevant implementation files and tests
6. `.specify/templates/feature-overview-template.md`
7. `.specify/templates/feature-usecase-template.md`

## Responsibilities

1. Create or update `.specify/features/{entity}/overview.md` when entity-level behavior or invariants changed.
2. Create or update `.specify/features/{entity}/{usecase}.md` for each implemented or modified use case.
3. Create cross-cutting docs under `.specify/features/{topic}/` when logic spans multiple entities.
4. Update `.specify/memory/feature-catalog.md` with:
   - entity/topic entry
   - use case rows
   - reverse lookup indexes by endpoint, table, and search tag
   - spec traceability
5. Update `.specify/memory/current-status.md` when work is partial, deferred, or leaves known gaps.

## Required Content

### Overview docs

Must include:

- purpose and scope
- business invariants
- lifecycle or state machine rules when applicable
- value objects and validation
- persistence touchpoints
- code entry points
- related use cases
- related tests
- change impact

### Use case docs

Must include:

- type and purpose
- spec traceability
- business rules
- inputs and outputs
- error mapping
- dependencies
- touched files
- endpoints or interfaces
- persistence touchpoints
- related features
- related tests
- change impact

## Writing Rules

- Describe implemented behavior, not desired behavior.
- Prefer exact file paths and concrete identifiers.
- Record partial implementation explicitly.
- If code diverges from spec, state the divergence and point to the affected code.
- Keep docs optimized for future reverse lookup and impact analysis.

## Completion Check

Before finishing, verify:

- every modified feature has a doc update
- `feature-catalog.md` points to all changed docs
- reverse lookup indexes were updated if endpoints, tables, or major concepts changed
- `current-status.md` reflects any remaining gaps
