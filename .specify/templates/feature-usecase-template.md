# {Use Case Name}

## Type and Purpose

- **Type**: {command | query | event | lifecycle}
- **Purpose**: {One-line description}

## Spec Traceability

| Spec | Section |
|------|---------|
| `.specify/specs/{id}/spec.md` | {section reference} |

## Business Rules

1. {Rule}
2. {Rule}

## Inputs and Outputs

**Inputs**:
- {param}: {type} — {description}

**Outputs**:
- {Success}: {description}
- {Error}: {description}

## Error Mapping

| Condition | Error | Code/Status |
|-----------|-------|-------------|
| {condition} | {error} | {code} |

## Dependencies

- {module/service}: {what it provides}

## Touched Files

| File | Role |
|------|------|
| `{path}` | {what this file does for this use case} |

## Endpoints / Interfaces

| Method | Path/Interface | Description |
|--------|---------------|-------------|
| {method} | {path} | {description} |

## Persistence Touchpoints

{Tables, files, or storage this use case reads/writes}

## Related Features

- {link to related overview or use case doc}

## Related Tests

| Test | Path |
|------|------|
| {description} | `{path}` |

## Change Impact

{What breaks or needs updating if this use case changes}
