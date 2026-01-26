/**
 * RepoHygiene - CLI Table Utilities
 * Beautiful table output using cli-table3
 */

import Table from 'cli-table3';
import chalk from 'chalk';
import type { SeverityLevel, Issue, ScanResult } from '../../types/index.js';

/**
 * Color mapping for severity levels
 */
const SEVERITY_COLORS: Record<SeverityLevel, (text: string) => string> = {
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  success: chalk.green,
};

const SEVERITY_ICONS: Record<SeverityLevel, string> = {
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
  success: '✓',
};

/**
 * Create a styled table for issues
 */
export function createIssueTable(issues: readonly Issue[]): string {
  if (issues.length === 0) {
    return chalk.green('  No issues found ✓');
  }

  const table = new Table({
    head: [
      chalk.bold(''),
      chalk.bold('Issue'),
      chalk.bold('Location'),
      chalk.bold('Rule'),
    ],
    style: {
      head: [],
      border: ['gray'],
    },
    chars: {
      'top': '─',
      'top-mid': '┬',
      'top-left': '┌',
      'top-right': '┐',
      'bottom': '─',
      'bottom-mid': '┴',
      'bottom-left': '└',
      'bottom-right': '┘',
      'left': '│',
      'left-mid': '├',
      'mid': '─',
      'mid-mid': '┼',
      'right': '│',
      'right-mid': '┤',
      'middle': '│',
    },
  });

  for (const issue of issues) {
    const color = SEVERITY_COLORS[issue.severity];
    const icon = SEVERITY_ICONS[issue.severity];
    const location = issue.file !== undefined
      ? `${issue.file}${issue.line !== undefined ? `:${issue.line}` : ''}`
      : '-';

    table.push([
      color(icon),
      color(issue.message),
      chalk.dim(location),
      chalk.dim(issue.rule ?? '-'),
    ]);
  }

  return table.toString();
}

/**
 * Create a summary table for scan results
 */
export function createSummaryTable(results: readonly ScanResult[]): string {
  const table = new Table({
    head: [
      chalk.bold('Module'),
      chalk.bold('Status'),
      chalk.bold('Issues'),
      chalk.bold('Time'),
    ],
    style: {
      head: [],
      border: ['gray'],
    },
    colWidths: [20, 12, 10, 10],
  });

  for (const result of results) {
    const statusColor = result.status === 'passed'
      ? chalk.green
      : result.status === 'warning'
        ? chalk.yellow
        : result.status === 'failed'
          ? chalk.red
          : chalk.gray;

    const statusIcon = result.status === 'passed'
      ? '✓'
      : result.status === 'warning'
        ? '⚠'
        : result.status === 'failed'
          ? '✗'
          : '○';

    table.push([
      chalk.cyan(result.module),
      statusColor(`${statusIcon} ${result.status}`),
      result.issues.length.toString(),
      `${result.duration}ms`,
    ]);
  }

  return table.toString();
}

/**
 * Simple key-value table
 */
export function createKeyValueTable(
  data: Record<string, string | number>,
  title?: string
): string {
  const table = new Table({
    style: {
      head: [],
      border: ['gray'],
    },
  });

  if (title !== undefined) {
    table.push([{ colSpan: 2, content: chalk.bold(title) }]);
  }

  for (const [key, value] of Object.entries(data)) {
    table.push([chalk.dim(key), chalk.white(String(value))]);
  }

  return table.toString();
}

/**
 * License table with color coding
 */
export function createLicenseTable(
  licenses: readonly { name: string; version: string; license: string; status: string }[]
): string {
  const table = new Table({
    head: [
      chalk.bold('Package'),
      chalk.bold('Version'),
      chalk.bold('License'),
      chalk.bold('Status'),
    ],
    style: {
      head: [],
      border: ['gray'],
    },
  });

  for (const pkg of licenses) {
    const statusColor = pkg.status === 'allowed'
      ? chalk.green
      : pkg.status === 'denied'
        ? chalk.red
        : chalk.yellow;

    table.push([
      pkg.name,
      chalk.dim(pkg.version),
      pkg.license,
      statusColor(pkg.status),
    ]);
  }

  return table.toString();
}

/**
 * Branch table for stale branches display
 */
export function createBranchTable(
  branches: readonly {
    name: string;
    daysSinceLastCommit: number;
    lastCommitAuthor: string;
    isMerged: boolean;
  }[]
): string {
  const table = new Table({
    head: [
      chalk.bold('Branch'),
      chalk.bold('Last Activity'),
      chalk.bold('Author'),
      chalk.bold('Merged'),
    ],
    style: {
      head: [],
      border: ['gray'],
    },
  });

  for (const branch of branches) {
    const daysColor = branch.daysSinceLastCommit > 180
      ? chalk.red
      : branch.daysSinceLastCommit > 90
        ? chalk.yellow
        : chalk.white;

    table.push([
      chalk.cyan(branch.name),
      daysColor(`${branch.daysSinceLastCommit} days ago`),
      chalk.dim(branch.lastCommitAuthor),
      branch.isMerged ? chalk.green('✓') : chalk.dim('-'),
    ]);
  }

  return table.toString();
}
