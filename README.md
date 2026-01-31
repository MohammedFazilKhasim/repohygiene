# RepoHygiene

> One CLI to rule all your repo maintenance

[![npm version](https://img.shields.io/npm/v/repohygiene.svg)](https://www.npmjs.com/package/repohygiene)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org/)

RepoHygiene is a comprehensive repository maintenance toolkit that combines **CODEOWNERS generation**, **license auditing**, **secret scanning**, **branch cleanup**, and **dependency analysis** into a single, fast CLI.

## Installation

```bash
npm install -g repohygiene
```

Or run directly with npx:

```bash
npx repohygiene scan
```

## Quick Start

```bash
cd your-project
repohygiene scan
```

Output:

```
╭─────────────────────────────────────────────╮
│   🧹 RepoHygiene v0.1.0                     │
╰─────────────────────────────────────────────╯

▸ CODEOWNERS ············ ✓ Valid
▸ Licenses ·············· ⚠ 2 issues
▸ Secrets ··············· ✓ None found
▸ Branches ·············· ⚠ 5 stale
▸ Dependencies ·········· ✓ Up to date
```

## Features

| Feature | Description |
|---------|-------------|
| **CODEOWNERS** | Generate and validate CODEOWNERS from git history |
| **License Audit** | Scan dependencies for license compliance |
| **Secret Scanner** | Detect 40+ secret patterns with entropy analysis |
| **Branch Cleanup** | Find and remove stale branches safely |
| **Dependency Analysis** | Check for outdated and duplicate packages |
| **SARIF Output** | Export to GitHub Security tab format |
| **Git Hooks** | Pre-commit and pre-push scanning |
| **Reports** | Generate markdown scan reports |

## Commands

### Scan Everything

```bash
repohygiene scan
repohygiene scan --json              # JSON output
repohygiene scan --fail-on error     # Fail CI on errors
```

### CODEOWNERS

```bash
repohygiene codeowners --analyze     # Analyze git history
repohygiene codeowners --generate    # Generate CODEOWNERS file
repohygiene codeowners --validate    # Validate existing file
```

### License Audit

```bash
repohygiene licenses
repohygiene licenses --production    # Production deps only
```

### Secret Scanner

```bash
repohygiene secrets
repohygiene secrets --scan-git-history   # Include git history
```

Detects: AWS keys, GitHub tokens, Stripe keys, database URLs, private keys, and 40+ more patterns.

### Branch Cleanup

```bash
repohygiene branches                  # List stale branches
repohygiene branches --delete         # Delete stale branches
repohygiene branches --merged-only    # Only merged branches
```

### Dependency Analysis

```bash
repohygiene deps
repohygiene deps --outdated           # Check for updates
repohygiene deps --duplicates         # Find duplicates
```

### Git Hooks

```bash
repohygiene hooks --install           # Install pre-commit hooks
repohygiene hooks --uninstall         # Remove hooks
repohygiene hooks --status            # Check hook status
```

### Generate Report

```bash
repohygiene report                    # Create HYGIENE_REPORT.md
repohygiene report --output report.md # Custom output path
```

## Configuration

Create `repohygiene.config.js` or run `repohygiene init`:

```javascript
export default {
  exclude: ['node_modules', 'dist', '.git'],

  codeowners: {
    threshold: 10,
    output: '.github/CODEOWNERS',
  },

  licenses: {
    allow: ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'ISC'],
    deny: ['GPL-3.0', 'AGPL-3.0'],
  },

  secrets: {
    entropyThreshold: 4.5,
    scanHistory: false,
  },

  branches: {
    staleDays: 90,
    exclude: ['main', 'master', 'develop'],
  },

  deps: {
    outdated: true,
    duplicates: true,
  },
};
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Repo Hygiene
on: [push, pull_request]

jobs:
  hygiene:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx repohygiene scan --fail-on error
```

### Pre-commit Hook

```bash
repohygiene hooks --install
```

Or manually with Husky:

```bash
# .husky/pre-commit
npx repohygiene secrets
```

## Security

- Runs entirely locally — no data leaves your machine
- No external API calls
- Open source and auditable

Found a security issue? Email [siddiqmohammed697@gmail.com](mailto:siddiqmohammed697@gmail.com).

## Contributing

```bash
git clone https://github.com/MohammedFazilKhasim/repohygiene.git
cd repohygiene
npm install
npm test
npm run build
```

## License

MIT © [MohammedFazilKhasim](https://github.com/MohammedFazilKhasim)
