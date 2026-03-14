# {{projectName}}

A Google Apps Script project built with [@gas-plugin/unplugin](https://github.com/nicr-org/gas-plugin).

## Getting Started

```bash
# Install dependencies
npm install

# Build the project
{{buildCommand}}
```

## Deployment

1. Install [clasp](https://github.com/google/clasp): `npm install -g @google/clasp`
2. Login: `clasp login`
3. Create or link a GAS project: `clasp create` or `clasp clone <scriptId>`
4. Push to GAS: `clasp push`

## Project Structure

```
src/           Source TypeScript files
dist/          Built output (GAS-compatible)
appsscript.json  GAS manifest
```
