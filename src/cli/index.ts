/**
 * RepoHygiene - Main CLI Entry Point
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../core/config.js';
import { initGitContext } from '../core/git.js';
import type { GlobalOptions } from '../types/index.js';
import {
  printHeader,
  printHelpfulError,
  printSuccess,
  printError,
  printSummary,
  printModuleIssues,
} from './ui/index.js';
import {
  createCodeownersScanner,
  createLicenseAuditor,
  createSecretsAuditor,
  createBranchesScanner,
  createDepsScanner,
} from '../modules/index.js';

// Get version from package.json
const VERSION = '0.1.0';

const program = new Command();

program
  .name('repohygiene')
  .description('One CLI to rule all your repo maintenance')
  .version(VERSION, '-v, --version', 'Output the current version')
  .option('-c, --config <path>', 'Path to config file')
  .option('--cwd <path>', 'Working directory', process.cwd())
  .option('--json', 'Output as JSON')
  .option('--verbose', 'Verbose output')
  .hook('preAction', (thisCommand) => {
    const options = thisCommand.opts<GlobalOptions>();

    // Don't print header for JSON output
    if (options.json !== true) {
      printHeader(VERSION);
    }
  });

// ============================================================================
// SCAN Command - Full repository scan
// ============================================================================
program
  .command('scan')
  .description('Run all maintenance checks on the repository')
  .option('--fail-on <level>', 'Exit with error on: error, warning, any', 'error')
  .action(async (_options, command) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const globalOpts = (command.parent?.opts() ?? {}) as GlobalOptions;
    const cwd = globalOpts.cwd ?? process.cwd();

    try {
      // Initialize
      const [configResult, gitContext] = await Promise.all([loadConfig(cwd), initGitContext(cwd)]);
      const config = configResult.config;

      if (!gitContext.isGitRepo) {
        printHelpfulError({
          title: 'Not a Git Repository',
          message: 'This command must be run from within a git repository.',
          suggestions: [
            'Navigate to your project root',
            'Run `git init` to initialize a new repository',
          ],
        });
        process.exit(1);
      }

      if (configResult.filepath !== null && globalOpts.json !== true) {
        // eslint-disable-next-line no-console
        console.log(chalk.dim(`Using config: ${configResult.filepath}\n`));
      }

      // Run all scanners
      if (!globalOpts.json) {
        printSuccess('Starting repository scan...');
      }

      const scanners = [
        createCodeownersScanner(gitContext, config, globalOpts),
        createLicenseAuditor(gitContext, config, globalOpts),
        createSecretsAuditor(gitContext, config, globalOpts),
        createBranchesScanner(gitContext, config, globalOpts),
        createDepsScanner(gitContext, config, globalOpts),
      ];

      const results = await Promise.all(scanners.map((s) => s.execute()));

      if (globalOpts.json) {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(results, null, 2));
      } else {
        printSummary(results);
      }

      const hasErrors = results.some((r) => r.status === 'failed');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (hasErrors && _options.failOn !== 'none') {
        process.exit(1);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      printError(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ============================================================================
// CODEOWNERS Command
// ============================================================================
program
  .command('codeowners')
  .description('Generate or validate CODEOWNERS file')
  .option('--analyze', 'Analyze git history to determine owners')
  .option('--generate', 'Generate CODEOWNERS file')
  .option('--validate', 'Validate existing CODEOWNERS file')
  .option('--threshold <n>', 'Minimum commits to be considered owner', '10')
  .option('--since <date>', 'Only consider commits since date')
  .option('--output <path>', 'Output path for CODEOWNERS file')
  .action(async (_options, command) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const globalOpts = (command.parent?.opts() ?? {}) as GlobalOptions;
    const cwd = globalOpts.cwd ?? process.cwd();

    try {
      const gitContext = await initGitContext(cwd);

      if (!gitContext.isGitRepo) {
        printHelpfulError({
          title: 'Not a Git Repository',
          message: 'CODEOWNERS generation requires a git repository.',
          suggestions: ['Navigate to your project root'],
        });
        process.exit(1);
      }

      const configResult = await loadConfig(cwd);
      const scanner = createCodeownersScanner(gitContext, configResult.config, globalOpts);
      const result = await scanner.execute();

      if (globalOpts.json) {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(result, null, 2));
      } else {
        printModuleIssues(result);
        printSummary([result]);
      }

      if (result.status === 'failed') {
        process.exit(1);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      printError(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ============================================================================
// LICENSES Command
// ============================================================================
program
  .command('licenses')
  .description('Audit dependency licenses')
  .option('--allow <licenses>', 'Comma-separated allowed licenses')
  .option('--deny <licenses>', 'Comma-separated denied licenses')
  .option('--fail-on <type>', 'Fail on: unknown, restricted, any', 'restricted')
  .option('--production', 'Only check production dependencies', true)
  .action(async (_options, command) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const globalOpts = (command.parent?.opts() ?? {}) as GlobalOptions;
    const cwd = globalOpts.cwd ?? process.cwd();

    try {
      const [configResult, gitContext] = await Promise.all([loadConfig(cwd), initGitContext(cwd)]);

      const scanner = createLicenseAuditor(gitContext, configResult.config, globalOpts);
      const result = await scanner.execute();

      if (globalOpts.json) {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(result, null, 2));
      } else {
        printModuleIssues(result);
        printSummary([result]);
      }

      if (result.status === 'failed') {
        process.exit(1);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      printError(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ============================================================================
// SECRETS Command
// ============================================================================
program
  .command('secrets')
  .description('Scan for leaked secrets')
  .option('--scan-git-history', 'Scan git history for secrets')
  .option('--entropy-threshold <n>', 'Minimum entropy for detection', '4.5')
  .option('--exclude <patterns>', 'Glob patterns to exclude')
  .option('--include <patterns>', 'Glob patterns to include')
  .action(async (_options, command) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const globalOpts = (command.parent?.opts() ?? {}) as GlobalOptions;
    const cwd = globalOpts.cwd ?? process.cwd();

    try {
      const [configResult, gitContext] = await Promise.all([loadConfig(cwd), initGitContext(cwd)]);

      const scanner = createSecretsAuditor(gitContext, configResult.config, globalOpts);
      const result = await scanner.execute();

      if (globalOpts.json) {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(result, null, 2));
      } else {
        printModuleIssues(result);
        printSummary([result]);
      }

      if (result.status === 'failed') {
        process.exit(1);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      printError(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ============================================================================
// BRANCHES Command
// ============================================================================
program
  .command('branches')
  .description('Find and clean stale branches')
  .option('--stale-days <n>', 'Days since last commit to consider stale', '90')
  .option('--exclude <patterns>', 'Branch patterns to exclude')
  .option('--dry-run', 'Show what would be deleted without deleting')
  .option('--delete', 'Actually delete stale branches')
  .option('--remote', 'Include remote branches')
  .option('--merged-only', 'Only show/delete merged branches')
  .action(async (_options, command) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const globalOpts = (command.parent?.opts() ?? {}) as GlobalOptions;
    const cwd = globalOpts.cwd ?? process.cwd();

    try {
      const gitContext = await initGitContext(cwd);

      if (!gitContext.isGitRepo) {
        printHelpfulError({
          title: 'Not a Git Repository',
          message: 'Branch cleanup requires a git repository.',
          suggestions: ['Navigate to your project root'],
        });
        process.exit(1);
      }

      const configResult = await loadConfig(cwd);
      const scanner = createBranchesScanner(gitContext, configResult.config, globalOpts);
      const result = await scanner.execute();

      if (globalOpts.json) {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(result, null, 2));
      } else {
        printModuleIssues(result);
        printSummary([result]);
      }

      if (result.status === 'failed') {
        process.exit(1);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      printError(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ============================================================================
// DEPS Command
// ============================================================================
program
  .command('deps')
  .description('Analyze project dependencies')
  .option('--graph', 'Generate dependency graph')
  .option('--outdated', 'Check for outdated packages')
  .option('--duplicates', 'Find duplicate dependencies')
  .option('--circular', 'Detect circular dependencies')
  .action(async (_options, command) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const globalOpts = (command.parent?.opts() ?? {}) as GlobalOptions;
    const cwd = globalOpts.cwd ?? process.cwd();

    try {
      const [configResult, gitContext] = await Promise.all([loadConfig(cwd), initGitContext(cwd)]);

      const scanner = createDepsScanner(gitContext, configResult.config, globalOpts);
      const result = await scanner.execute();

      if (globalOpts.json) {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(result, null, 2));
      } else {
        printModuleIssues(result);
        printSummary([result]);
      }

      if (result.status === 'failed') {
        process.exit(1);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      printError(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ============================================================================
// INIT Command - Generate config file
// ============================================================================
program
  .command('init')
  .description('Generate a repohygiene.config.js file')
  .option('--format <type>', 'Config format: js, json', 'js')
  .option('--force', 'Overwrite existing config file')
  .action(async (options) => {
    const { promises: fs } = await import('fs');
    const path = await import('path');
    const cwd = process.cwd();

    const configContent = `/**
 * RepoHygiene Configuration
 * Customize your repository hygiene checks
 */
export default {
  // Directories to exclude from all scans
  exclude: ['node_modules', 'dist', '.git', 'coverage'],

  // CODEOWNERS settings
  codeowners: {
    threshold: 10,           // Min commits to be considered owner
    output: '.github/CODEOWNERS',
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
    exclude: ['main', 'master', 'develop', 'release/*'],
  },

  // Dependency analysis
  deps: {
    outdated: true,
    duplicates: true,
  },
};
`;

    const jsonContent = JSON.stringify(
      {
        exclude: ['node_modules', 'dist', '.git', 'coverage'],
        codeowners: { threshold: 10, output: '.github/CODEOWNERS' },
        licenses: {
          allow: ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'ISC'],
          deny: ['GPL-3.0', 'AGPL-3.0'],
          failOn: 'restricted',
        },
        secrets: { scanHistory: false, entropyThreshold: 4.5 },
        branches: { staleDays: 90, exclude: ['main', 'master', 'develop'] },
        deps: { outdated: true, duplicates: true },
      },
      null,
      2
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const isJson = options.format === 'json';
    const filename = isJson ? '.repohygienerc.json' : 'repohygiene.config.js';
    const filepath = path.join(cwd, filename);

    try {
      // Check if file exists
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (options.force !== true) {
        try {
          await fs.access(filepath);
          printError(`Config file already exists: ${filename}. Use --force to overwrite.`);
          process.exit(1);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) {
          // File doesn't exist, continue
        }
      }

      await fs.writeFile(filepath, isJson ? jsonContent : configContent, 'utf-8');
      printSuccess(`Created ${filename}`);
      // eslint-disable-next-line no-console
      console.log(chalk.dim('\nNext steps:'));
      // eslint-disable-next-line no-console
      console.log(chalk.dim('  1. Edit the config file to match your project'));
      // eslint-disable-next-line no-console
      console.log(chalk.dim('  2. Run: repohygiene scan'));
    } catch (error) {
      printError(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Parse and run
program.parse();
