/**
 * RepoHygiene - Main CLI Entry Point
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../core/config.js';
import { initGitContext } from '../core/git.js';
import {
    printHeader,
    printHelpfulError,
    printSuccess,
    printError,
} from './ui/index.js';

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
    .hook('preAction', async (thisCommand) => {
        const options = thisCommand.opts();

        // Don't print header for JSON output
        if (!options['json']) {
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
        const globalOpts = command.parent?.opts() ?? {};
        const cwd = globalOpts['cwd'] ?? process.cwd();

        try {
            // Initialize
            const [config, gitContext] = await Promise.all([
                loadConfig(cwd),
                initGitContext(cwd),
            ]);

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

            if (config.filepath && !globalOpts['json']) {
                // eslint-disable-next-line no-console
                console.log(chalk.dim(`Using config: ${config.filepath}\n`));
            }

            // TODO: Run all scanners and collect results
            printSuccess('Repository scan complete!');

        } catch (error) {
            printError(error instanceof Error ? error.message : 'Unknown error');
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
        const globalOpts = command.parent?.opts() ?? {};
        const cwd = globalOpts['cwd'] ?? process.cwd();

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

            // TODO: Implement CODEOWNERS scanner
            printSuccess('CODEOWNERS analysis complete!');

        } catch (error) {
            printError(error instanceof Error ? error.message : 'Unknown error');
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
        const globalOpts = command.parent?.opts() ?? {};
        const _cwd = globalOpts['cwd'] ?? process.cwd();

        try {
            // TODO: Implement license scanner
            printSuccess('License audit complete!');

        } catch (error) {
            printError(error instanceof Error ? error.message : 'Unknown error');
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
        const globalOpts = command.parent?.opts() ?? {};
        const _cwd = globalOpts['cwd'] ?? process.cwd();

        try {
            // TODO: Implement secrets scanner
            printSuccess('Secret scan complete!');

        } catch (error) {
            printError(error instanceof Error ? error.message : 'Unknown error');
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
        const globalOpts = command.parent?.opts() ?? {};
        const cwd = globalOpts['cwd'] ?? process.cwd();

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

            // TODO: Implement branches scanner
            printSuccess('Branch analysis complete!');

        } catch (error) {
            printError(error instanceof Error ? error.message : 'Unknown error');
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
        const globalOpts = command.parent?.opts() ?? {};
        const _cwd = globalOpts['cwd'] ?? process.cwd();

        try {
            // TODO: Implement deps scanner
            printSuccess('Dependency analysis complete!');

        } catch (error) {
            printError(error instanceof Error ? error.message : 'Unknown error');
            process.exit(1);
        }
    });

// ============================================================================
// INIT Command - Generate config file
// ============================================================================
program
    .command('init')
    .description('Generate a repohygiene.config.js file')
    .option('--format <type>', 'Config format: js, json, yaml', 'js')
    .action(async (_options) => {
        // TODO: Implement config generation
        printSuccess('Created repohygiene.config.js');
    });

// Parse and run
program.parse();
