# Changelog

All notable changes to RepoHygiene will be documented in this file.

## [0.1.0] - 2026-01-30

### Added
- **SARIF Output Support** - Generate SARIF reports for GitHub Security tab integration
  - `--output sarif` flag for scan command
  - Full support for all scan types (secrets, licenses, branches, codeowners, deps)

- **Git Hooks Integration** - Auto-install pre-commit and pre-push hooks
  - `repohygiene hooks --install` to add hooks
  - `repohygiene hooks --uninstall` to remove hooks
  - `repohygiene hooks --status` to check status

- **Markdown Report Generator** - Export scan results to markdown
  - `repohygiene report` command
  - Beautiful formatted output with emojis and tables

- **Core Scanners**
  - 🔐 CODEOWNERS - Generate and validate CODEOWNERS files from git history
  - 📜 License Audit - Scan dependencies for license compliance
  - 🔑 Secret Scanner - Detect leaked secrets with 40+ patterns + entropy analysis
  - 🌿 Branch Cleanup - Find and remove stale branches safely
  - 📦 Dependency Analysis - Check for outdated, duplicate packages

- **CLI Features**
  - Beautiful terminal output with spinners and colors
  - JSON output mode (`--json`)
  - Config file support (`.repohygienerc.json`, `repohygiene.config.js`)
  - `repohygiene init` to generate config files

### Test Coverage
- 829 comprehensive unit tests
- Coverage across all modules

### Initial Release
- First public release
- MIT License
