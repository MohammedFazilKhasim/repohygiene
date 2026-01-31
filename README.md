# RepoHygiene

> **All-in-one repository maintenance CLI** — CODEOWNERS generator, license checker, secret scanner, branch cleaner, and dependency analyzer.

[![npm version](https://img.shields.io/npm/v/repohygiene.svg)](https://www.npmjs.com/package/repohygiene)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org/)

**RepoHygiene** is a fast, zero-config CLI tool that automates repository maintenance tasks. Stop juggling multiple tools — scan for **leaked secrets**, audit **open source licenses**, generate **CODEOWNERS files**, clean up **stale git branches**, and analyze **npm dependencies** with a single command.

<!-- SEO Keywords: git secret scanner, codeowners generator, license audit tool, branch cleanup, dependency checker, repository maintenance, devops tools, npm security scanner, eslint alternative, pre-commit hooks, CI/CD security, open source compliance -->

## Why RepoHygiene?

| Problem | Solution |
|---------|----------|
| Accidentally committed secrets? | Scans 40+ secret patterns + entropy detection |
| Need to generate CODEOWNERS? | Auto-generates from git history |
| License compliance headaches? | Audits all dependencies against allow/deny lists |
| Too many stale branches? | Identifies and safely deletes them |
| Outdated packages? | Finds outdated and duplicate dependencies |

## Installation

```bash
# npm
npm install -g repohygiene

# npx (no install)
npx repohygiene scan

# pnpm
pnpm add -g repohygiene

# yarn
yarn global add repohygiene
```

## Quick Start

```bash
cd your-project
repohygiene scan
```

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

### 🔑 Secret Scanner
Detect leaked API keys, tokens, and credentials before they reach production.
- 40+ built-in patterns (AWS, GitHub, Stripe, Slack, etc.)
- Entropy-based detection for custom secrets
- Git history scanning

```bash
repohygiene secrets
repohygiene secrets --scan-git-history
```

### 🔐 CODEOWNERS Generator
Automatically generate CODEOWNERS from git commit history.

```bash
repohygiene codeowners --generate
repohygiene codeowners --validate
```

### 📜 License Audit
Scan npm dependencies for license compliance. Block GPL, AGPL, or any license you specify.

```bash
repohygiene licenses
repohygiene licenses --production
```

### 🌿 Branch Cleanup
Find and remove stale, merged, or abandoned branches.

```bash
repohygiene branches
repohygiene branches --delete --merged-only
```

### 📦 Dependency Analysis
Check for outdated packages, duplicates, and circular dependencies.

```bash
repohygiene deps --outdated --duplicates
```

### 🪝 Git Hooks
Auto-install pre-commit hooks to scan for secrets before every commit.

```bash
repohygiene hooks --install
```

### 📝 Markdown Reports
Generate shareable hygiene reports for your team.

```bash
repohygiene report --output HYGIENE_REPORT.md
```

## All Commands

| Command | Description |
|---------|-------------|
| `repohygiene scan` | Run all checks |
| `repohygiene secrets` | Scan for leaked secrets |
| `repohygiene licenses` | Audit dependency licenses |
| `repohygiene codeowners` | Generate/validate CODEOWNERS |
| `repohygiene branches` | Find stale branches |
| `repohygiene deps` | Analyze dependencies |
| `repohygiene hooks` | Manage git hooks |
| `repohygiene report` | Generate markdown report |
| `repohygiene init` | Create config file |

## Configuration

Create `repohygiene.config.js` or run `repohygiene init`:

```javascript
export default {
  exclude: ['node_modules', 'dist', '.git'],

  secrets: {
    entropyThreshold: 4.5,
    scanHistory: false,
  },

  licenses: {
    allow: ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'ISC'],
    deny: ['GPL-3.0', 'AGPL-3.0'],
  },

  branches: {
    staleDays: 90,
    exclude: ['main', 'master', 'develop'],
  },
};
```

## CI/CD Integration

### GitHub Actions

```yaml
- run: npx repohygiene scan --fail-on error
```

### Pre-commit Hook

```bash
repohygiene hooks --install
```

## Use Cases

- **Security teams**: Prevent secret leaks in CI/CD pipelines
- **Open source maintainers**: Ensure license compliance
- **DevOps engineers**: Automate branch cleanup
- **Engineering managers**: Generate CODEOWNERS automatically
- **Developers**: Keep dependencies up to date

## Comparison

| Feature | RepoHygiene | git-secrets | license-checker | codeowners |
|---------|-------------|-------------|-----------------|------------|
| Secret scanning | ✅ | ✅ | ❌ | ❌ |
| License audit | ✅ | ❌ | ✅ | ❌ |
| CODEOWNERS | ✅ | ❌ | ❌ | ✅ |
| Branch cleanup | ✅ | ❌ | ❌ | ❌ |
| Dependency analysis | ✅ | ❌ | ❌ | ❌ |
| Single CLI | ✅ | ❌ | ❌ | ❌ |

## Security

- **100% local** — no data leaves your machine
- **Zero network calls** — works offline
- **Open source** — fully auditable

## Contributing

```bash
git clone https://github.com/MohammedFazilKhasim/repohygiene.git
npm install && npm test
```

## License

MIT © [MohammedFazilKhasim](https://github.com/MohammedFazilKhasim)

---

**Keywords**: secret scanner, git secrets, codeowners generator, license checker, license audit, branch cleanup, stale branches, dependency analyzer, repository maintenance, npm security, devops tools, pre-commit hooks, CI/CD security, open source compliance, TypeScript CLI
