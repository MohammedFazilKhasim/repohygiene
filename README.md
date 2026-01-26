# 🧹 RepoHygiene

**One CLI to rule all your repo maintenance**

[![npm version](https://img.shields.io/npm/v/repohygiene.svg)](https://www.npmjs.com/package/repohygiene)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)

RepoHygiene is a comprehensive repository maintenance toolkit that helps you manage CODEOWNERS, audit licenses, scan for secrets, clean up stale branches, and analyze dependencies—all from a single CLI.

![Demo](https://raw.githubusercontent.com/your-username/repohygiene/main/docs/demo.gif)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **CODEOWNERS** | Generate and validate CODEOWNERS files from git history |
| 📜 **License Audit** | Scan dependencies for license compliance |
| 🔑 **Secret Scanner** | Detect leaked secrets with 40+ patterns + entropy analysis |
| 🌿 **Branch Cleanup** | Find and remove stale branches safely |
| 📦 **Dependency Analysis** | Check for outdated, duplicate, and circular deps |

---

## 🚀 Quick Start

### Installation

```bash
# npm
npm install -g repohygiene

# pnpm
pnpm add -g repohygiene

# yarn
yarn global add repohygiene

# npx (no install)
npx repohygiene scan
```

### Basic Usage

```bash
# Run all checks
repohygiene scan

# Individual modules
repohygiene codeowners --analyze
repohygiene licenses
repohygiene secrets
repohygiene branches --stale-days 60
```

---

## 📖 Commands

### `scan` - Full Repository Scan

Run all maintenance checks at once:

```bash
repohygiene scan [options]

Options:
  --fail-on <level>    Exit with error on: error, warning, any (default: "error")
  --json               Output as JSON
  --verbose            Verbose output
```

**Example:**
```bash
$ repohygiene scan

  ╭─────────────────────────────────────────────╮
  │                                             │
  │   🧹 RepoHygiene v1.0.0                     │
  │   Scanning: my-awesome-project              │
  │                                             │
  ╰─────────────────────────────────────────────╯

  ▸ CODEOWNERS ·································· ✓ Valid
  ▸ Licenses ···································· ⚠ 2 issues
  ▸ Secrets ····································· ✓ None found  
  ▸ Branches ···································· ⚠ 5 stale
```

---

### `codeowners` - CODEOWNERS Management

Generate, validate, or analyze CODEOWNERS files:

```bash
repohygiene codeowners [options]

Options:
  --analyze              Analyze git history to determine owners
  --generate             Generate CODEOWNERS file
  --validate             Validate existing CODEOWNERS file
  --threshold <n>        Min commits to be considered owner (default: 10)
  --since <date>         Only consider commits since date
  --output <path>        Output path (default: .github/CODEOWNERS)
```

**Example:**
```bash
# Analyze and generate
repohygiene codeowners --analyze --generate

# Output:
# .github/CODEOWNERS created with 15 ownership rules
```

---

### `licenses` - License Audit

Scan dependencies for license compliance:

```bash
repohygiene licenses [options]

Options:
  --allow <licenses>     Comma-separated allowed licenses
  --deny <licenses>      Comma-separated denied licenses
  --fail-on <type>       Fail on: unknown, restricted, any (default: "restricted")
  --production           Only check production dependencies
```

**Default Allowed:** MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, Unlicense

**Default Denied:** GPL-2.0, GPL-3.0, AGPL-3.0

**Example:**
```bash
repohygiene licenses --allow "MIT,Apache-2.0" --deny "GPL-3.0"
```

---

### `secrets` - Secret Scanner

Detect leaked secrets in your codebase:

```bash
repohygiene secrets [options]

Options:
  --scan-git-history     Scan git history for secrets
  --entropy-threshold    Min entropy for detection (default: 4.5)
  --exclude <patterns>   Glob patterns to exclude
  --include <patterns>   Glob patterns to include
```

**Detected Patterns:**
- AWS Access Keys & Secrets
- GitHub/GitLab Tokens
- Stripe, Slack, Twilio API Keys
- Database Connection Strings
- Private Keys (RSA, SSH, PGP)
- JWT Tokens
- And 30+ more...

**Example:**
```bash
repohygiene secrets

# Found 2 potential secrets:
# ✗ AWS Access Key ID: AKIA****XXXX in src/config.ts:42
# ⚠ High Entropy String: ****YxZ9 in .env:7
```

---

### `branches` - Branch Cleanup

Find and clean stale branches:

```bash
repohygiene branches [options]

Options:
  --stale-days <n>       Days since last commit (default: 90)
  --exclude <patterns>   Branch patterns to exclude
  --dry-run              Show what would be deleted (default)
  --delete               Actually delete branches
  --remote               Include remote branches
  --merged-only          Only show/delete merged branches
```

**Protected by Default:** main, master, develop, release/*, hotfix/*

**Example:**
```bash
# Preview stale branches
repohygiene branches --stale-days 60

# Delete them
repohygiene branches --stale-days 60 --delete
```

---

## ⚙️ Configuration

Create a `repohygiene.config.js` in your project root:

```javascript
export default {
  // Global settings
  exclude: ['node_modules', 'dist', '.git'],
  
  // CODEOWNERS settings
  codeowners: {
    output: '.github/CODEOWNERS',
    threshold: 10,
    teamMappings: {
      'frontend-team': ['@alice', '@bob'],
      'backend-team': ['@charlie', '@dave'],
    },
  },
  
  // License policy
  licenses: {
    allow: ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'ISC'],
    deny: ['GPL-3.0', 'AGPL-3.0'],
    failOn: 'restricted',
  },
  
  // Secret scanning
  secrets: {
    scanHistory: false,
    entropyThreshold: 4.5,
  },
  
  // Branch cleanup
  branches: {
    staleDays: 90,
    exclude: ['main', 'master', 'develop'],
  },
};
```

**Configuration Search Locations:**
- `repohygiene.config.js`
- `repohygiene.config.mjs`
- `.repohygienerc`
- `.repohygienerc.json`
- `package.json` → `"repohygiene"` field

---

## 🔄 CI/CD Integration

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
          fetch-depth: 0  # Full history for branch analysis
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npx repohygiene scan --fail-on error
```

### Pre-commit Hook

```bash
# .husky/pre-commit
npx repohygiene secrets
```

---

## 📊 Output Formats

```bash
# Human-readable (default)
repohygiene scan

# JSON (for CI/scripts)
repohygiene scan --json

# SARIF (GitHub Security tab)
repohygiene scan --format sarif > results.sarif
```

---

## 🛡️ Security

RepoHygiene is designed with security in mind:

- ✅ Runs entirely locally - no data leaves your machine
- ✅ No external API calls required
- ✅ Open source and auditable
- ✅ Zero config by default

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Clone the repo
git clone https://github.com/your-username/repohygiene.git

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

---

## 📝 License

MIT © [Your Name](https://github.com/your-username)

---

<p align="center">
  Made with ❤️ for developers who care about repo hygiene
</p>
