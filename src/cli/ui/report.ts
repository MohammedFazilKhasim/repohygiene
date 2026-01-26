/**
 * RepoHygiene - CLI Report Formatter
 * Formats scan results into beautiful terminal output
 */

import boxen from 'boxen';
import chalk from 'chalk';
import type { ScanResult } from '../../types/index.js';
import { createSummaryTable, createIssueTable } from './table.js';
import { STATUS_ICONS } from './spinner.js';

/**
 * Application header with version
 */
export function printHeader(version: string): void {
    const header = boxen(
        `${chalk.bold.cyan('🧹 RepoHygiene')} ${chalk.dim(`v${version}`)}\n${chalk.dim('One CLI to rule all your repo maintenance')}`,
        {
            padding: 1,
            margin: { top: 1, bottom: 1, left: 0, right: 0 },
            borderStyle: 'round',
            borderColor: 'cyan',
        }
    );

    // eslint-disable-next-line no-console
    console.log(header);
}

/**
 * Print a section header
 */
export function printSection(title: string): void {
    // eslint-disable-next-line no-console
    console.log(`\n${chalk.bold.underline(title)}\n`);
}

/**
 * Print scan summary
 */
export function printSummary(results: readonly ScanResult[]): void {
    const passed = results.filter((r) => r.status === 'passed').length;
    const warnings = results.filter((r) => r.status === 'warning').length;
    const failed = results.filter((r) => r.status === 'failed').length;
    const skipped = results.filter((r) => r.status === 'skipped').length;

    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    // eslint-disable-next-line no-console
    console.log(createSummaryTable(results));

    const summaryBox = boxen(
        [
            `${STATUS_ICONS.passed} ${chalk.green(`${passed} passed`)}`,
            warnings > 0 ? `${STATUS_ICONS.warning} ${chalk.yellow(`${warnings} warnings`)}` : null,
            failed > 0 ? `${STATUS_ICONS.failed} ${chalk.red(`${failed} failed`)}` : null,
            skipped > 0 ? `${STATUS_ICONS.skipped} ${chalk.gray(`${skipped} skipped`)}` : null,
            '',
            chalk.dim(`Total issues: ${totalIssues}`),
            chalk.dim(`Total time: ${totalDuration}ms`),
        ]
            .filter(Boolean)
            .join('\n'),
        {
            padding: 1,
            margin: { top: 1, bottom: 0, left: 0, right: 0 },
            borderStyle: 'round',
            title: 'Summary',
            titleAlignment: 'center',
        }
    );

    // eslint-disable-next-line no-console
    console.log(summaryBox);
}

/**
 * Print detailed issues for a module
 */
export function printModuleIssues(result: ScanResult): void {
    if (result.issues.length === 0) {
        return;
    }

    printSection(`${result.module.toUpperCase()} Issues`);
    // eslint-disable-next-line no-console
    console.log(createIssueTable(result.issues));
}

/**
 * Print success message
 */
export function printSuccess(message: string): void {
    // eslint-disable-next-line no-console
    console.log(`\n${chalk.green('✓')} ${message}`);
}

/**
 * Print error message
 */
export function printError(message: string): void {
    // eslint-disable-next-line no-console
    console.error(`\n${chalk.red('✗')} ${message}`);
}

/**
 * Print warning message
 */
export function printWarning(message: string): void {
    // eslint-disable-next-line no-console
    console.log(`\n${chalk.yellow('⚠')} ${message}`);
}

/**
 * Print info message
 */
export function printInfo(message: string): void {
    // eslint-disable-next-line no-console
    console.log(`\n${chalk.blue('ℹ')} ${message}`);
}

/**
 * Print a helpful error with suggestions
 */
export function printHelpfulError(error: {
    title: string;
    message: string;
    suggestions?: string[];
    helpUrl?: string;
}): void {
    const content = [
        chalk.red(`✗ ${error.title}`),
        '',
        error.message,
    ];

    if (error.suggestions && error.suggestions.length > 0) {
        content.push('');
        content.push(chalk.bold('Try:'));
        for (const suggestion of error.suggestions) {
            content.push(`  → ${suggestion}`);
        }
    }

    if (error.helpUrl) {
        content.push('');
        content.push(chalk.dim(`Help: ${error.helpUrl}`));
    }

    const box = boxen(content.join('\n'), {
        padding: 1,
        borderColor: 'red',
        borderStyle: 'round',
    });

    // eslint-disable-next-line no-console
    console.error(box);
}

/**
 * Format results as JSON
 */
export function formatJson(results: readonly ScanResult[]): string {
    return JSON.stringify(results, null, 2);
}

/**
 * Format results as SARIF (Static Analysis Results Interchange Format)
 */
export function formatSarif(
    results: readonly ScanResult[],
    toolVersion: string
): string {
    const sarifOutput = {
        $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
        version: '2.1.0',
        runs: [
            {
                tool: {
                    driver: {
                        name: 'repohygiene',
                        version: toolVersion,
                        informationUri: 'https://github.com/your-username/repohygiene',
                        rules: [],
                    },
                },
                results: results.flatMap((result) =>
                    result.issues.map((issue) => ({
                        ruleId: issue.rule ?? `${result.module}-issue`,
                        level: issue.severity === 'error' ? 'error' : issue.severity === 'warning' ? 'warning' : 'note',
                        message: {
                            text: issue.message,
                        },
                        locations: issue.file
                            ? [
                                {
                                    physicalLocation: {
                                        artifactLocation: {
                                            uri: issue.file,
                                        },
                                        region: issue.line
                                            ? {
                                                startLine: issue.line,
                                                startColumn: issue.column ?? 1,
                                            }
                                            : undefined,
                                    },
                                },
                            ]
                            : [],
                    }))
                ),
            },
        ],
    };

    return JSON.stringify(sarifOutput, null, 2);
}
