# 🧹 RepoHygiene

**One CLI to rule all your repo maintenance**

[![npm version](https://img.shields.io/npm/v/repohygiene.svg)](https://www.npmjs.com/package/repohygiene)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org/)

RepoHygiene is a comprehensive repository maintenance toolkit that helps you manage **CODEOWNERS**, audit **licenses**, scan for **secrets**, clean up **stale branches**, and analyze **dependencies**—all from a single CLI.

---

## 📋 Table of Contents

- [Why RepoHygiene?](#-why-repohygiene)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Commands](#-commands)
- [Configuration](#-configuration)
- [CI/CD Integration](#-cicd-integration)
- [FAQ](#-faq)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🤔 Why RepoHygiene?

Managing a repository involves many boring but essential tasks:

| Problem | Without RepoHygiene | With RepoHygiene |
|---------|---------------------|------------------|
| Who owns this code? | Manually check git blame | Auto-generate CODEOWNERS |
| Are my licenses compliant? | Install separate tool | `repohygiene licenses` |
| Did I leak a secret? | Multiple scanners | `repohygiene secrets` |
| Too many old branches? | Delete one by one | `repohygiene branches --delete` |
| Outdated dependencies? | `npm outdated` (limited) | `repohygiene deps` |

**RepoHygiene bundles all these into one fast, beautiful CLI.**

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
# npm (global)
npm install -g repohygiene

# npx (no install needed)
npx repohygiene scan

# pnpm
pnpm add -g repohygiene

# yarn
yarn global add repohygiene
```

### Your First Scan

```bash
# Navigate to any git repository
cd your-project

# Run a full scan
repohygiene scan
```

**Example output:**

```
╭─────────────────────────────────────────────╮
│   🧹 RepoHygiene v0.1.0                     │
│   Scanning: your-project                    │
╰─────────────────────────────────────────────╯

▸ CODEOWNERS ·································· ✓ Valid
▸ Licenses ···································· ⚠ 2 issues
▸ Secrets ····································· ✓ None found  
▸ Branches ···································· ⚠ 5 stale
▸ Dependencies ································ ✓ Up to date
```

### Generate Config (Optional)

```bash
# Create a config file to customize behavior
repohygiene init

# Or JSON format
repohygiene init --format json
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
repohygiene codeowners --analyze --generate
# Creates .github/CODEOWNERS with 15 ownership rules
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

**Defaults:**
- ✅ Allowed: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, Unlicense
- ❌ Denied: GPL-2.0, GPL-3.0, AGPL-3.0

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

**Detects 40+ secret types:**
- AWS Access Keys & Secrets
- GitHub/GitLab Tokens  
- Stripe, Slack, Twilio API Keys
- Database Connection Strings
- Private Keys (RSA, SSH, PGP)
- JWT Tokens, and more...

---

### `branches` - Branch Cleanup

Find and clean stale branches:

```bash
repohygiene branches [options]

Options:
  --stale-days <n>       Days since last commit (default: 90)
  --exclude <patterns>   Branch patterns to exclude
  --dry-run              Show what would be deleted (default)
  --delete               Actually delete stale branches
  --remote               Include remote branches
  --merged-only          Only show/delete merged branches
```

**Protected by default:** main, master, develop, release/*, hotfix/*

---

### `deps` - Dependency Analysis

Analyze project dependencies:

```bash
repohygiene deps [options]

Options:
  --outdated             Check for outdated packages
  --duplicates           Find duplicate dependencies
  --circular             Detect circular dependencies
  --graph                Generate dependency graph
```

---

### `init` - Generate Config

Create a configuration file:

```bash
repohygiene init [options]

Options:
  --format <type>        Config format: js, json (default: "js")
  --force                Overwrite existing config file
```

---

## ⚙️ Configuration

Create `repohygiene.config.js` in your project root:

```javascript
export default {
  // Directories to exclude from all scans
  exclude: ['node_modules', 'dist', '.git', 'coverage'],
  
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

  // Dependency analysis
  deps: {
    outdated: true,
    duplicates: true,
  },
};
```

**Config file locations (searched in order):**
1. `repohygiene.config.js`
2. `repohygiene.config.mjs`
3. `.repohygienerc`
4. `.repohygienerc.json`
5. `package.json` → `"repohygiene"` field

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

### Pre-commit Hook (with Husky)

```bash
# .husky/pre-commit
npx repohygiene secrets
```

### GitLab CI

```yaml
repo-hygiene:
  image: node:20
  script:
    - npm ci
    - npx repohygiene scan --fail-on error
```

---

## 📊 Output Formats

```bash
# Human-readable (default)
repohygiene scan

# JSON (for CI/scripts)
repohygiene scan --json

# Verbose (debug info)
repohygiene scan --verbose
```

---

## ❓ FAQ

### How is this different from existing tools?

RepoHygiene **bundles** multiple tools into one:
- Instead of Snyk (security only) + license-checker + manual branch cleanup
- You get one CLI that does it all

### Does it send data anywhere?

**No.** RepoHygiene runs entirely locally. No external API calls, no telemetry.

### What languages/package managers are supported?

Currently optimized for JavaScript/TypeScript with npm. Coming soon: Python, Go, Rust.

### Can I use it in CI/CD?

Yes! Use `--fail-on error` to make CI fail on issues. Use `--json` for machine-readable output.

### How do I ignore false positives?

Add patterns to the `exclude` array in your config file, or use inline comments.

---

## 🤝 Contributing

Contributions are welcome! Here's how:

```bash
# 1. Fork and clone the repo
git clone https://github.com/MohammedFazilKhasim/repohygiene.git
cd repohygiene

# 2. Install dependencies
npm install

# 3. Run tests
npm test

# 4. Build
npm run build

# 5. Test locally
node dist/cli/index.js scan
```

### Development Commands

```bash
npm run dev        # Watch mode
npm run build      # Build for production
npm test           # Run tests
npm run lint       # Lint code
npm run typecheck  # TypeScript checks
```

---

## 🛡️ Security

RepoHygiene is designed with security in mind:

- ✅ Runs entirely locally - no data leaves your machine
- ✅ No external API calls required
- ✅ Open source and auditable
- ✅ Zero config required by default

Found a security issue? Please email [siddiqmohammed697@gmail.com](mailto:siddiqmohammed697@gmail.com) instead of opening a public issue.

---

## 📝 License

MIT © [MohammedFazilKhasim](https://github.com/MohammedFazilKhasim)

---

<p align="center">
  Made with ❤️ for developers who care about repo hygiene
</p>
