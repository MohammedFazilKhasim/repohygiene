/**
 * RepoHygiene - CODEOWNERS Analyzer
 * Analyzes git history to determine code ownership
 */

import { globby } from 'globby';
import { getContributionStats, type GitContext } from '../../core/git.js';
import type { FileOwnership, OwnerContribution } from '../../types/index.js';

export interface AnalyzerOptions {
  readonly threshold: number;
  readonly since?: string;
  readonly exclude?: readonly string[];
}

/**
 * Analyze a repository to determine file/directory ownership
 */
export async function analyzeOwnership(
  gitContext: GitContext,
  options: AnalyzerOptions
): Promise<FileOwnership[]> {
  const { threshold, since, exclude = [] } = options;

  // Get all directories that might need owners
  const directories = await getDirectories(gitContext.rootDir, exclude);
  const ownerships: FileOwnership[] = [];

  for (const dir of directories) {
    const stats = await getContributionStats(gitContext, dir, { since });
    const owners = mapToOwnerContributions(stats, threshold);

    if (owners.length > 0) {
      ownerships.push({
        path: normalizePathForCodeowners(dir),
        owners,
        suggestedOwner: owners[0]?.author ?? '',
      });
    }
  }

  return sortByPath(ownerships);
}

/**
 * Get top-level directories for analysis
 */
async function getDirectories(rootDir: string, exclude: readonly string[]): Promise<string[]> {
  const defaultExcludes = [
    'node_modules',
    'dist',
    'build',
    '.git',
    'coverage',
    '.next',
    '.nuxt',
    'vendor',
    '__pycache__',
  ];

  const allExcludes = [...new Set([...defaultExcludes, ...exclude])];
  const patterns = ['*/', '*/*/'];

  const dirs = await globby(patterns, {
    cwd: rootDir,
    onlyDirectories: true,
    ignore: allExcludes.map((e) => `**/${e}/**`),
    deep: 2,
  });

  // Also include root-level important files/patterns
  const importantPatterns = [
    'src/',
    'lib/',
    'app/',
    'pages/',
    'components/',
    'utils/',
    'services/',
    'api/',
    'tests/',
    'test/',
    '__tests__/',
    'docs/',
    'scripts/',
    '.github/',
  ];

  const result = new Set<string>();

  // Add found directories
  for (const dir of dirs) {
    result.add(dir.replace(/\/$/, ''));
  }

  // Add important patterns if they exist
  for (const pattern of importantPatterns) {
    const cleaned = pattern.replace(/\/$/, '');
    if (dirs.some((d) => d.startsWith(cleaned))) {
      result.add(cleaned);
    }
  }

  return Array.from(result);
}

/**
 * Convert contribution stats to sorted owner contributions
 */
function mapToOwnerContributions(
  stats: Map<string, { commits: number; email: string; lastCommit: Date }>,
  threshold: number
): OwnerContribution[] {
  const owners: OwnerContribution[] = [];

  for (const [author, data] of stats) {
    if (data.commits >= threshold) {
      owners.push({
        author,
        email: data.email,
        commits: data.commits,
        linesChanged: 0, // Would require more complex git analysis
        lastCommit: data.lastCommit,
      });
    }
  }

  // Sort by commits descending
  return owners.sort((a, b) => b.commits - a.commits);
}

/**
 * Normalize path for CODEOWNERS file format
 */
function normalizePathForCodeowners(path: string): string {
  // Ensure path starts with /
  const normalized = path.startsWith('/') ? path : `/${path}`;
  // Ensure directories end with /
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

/**
 * Sort ownerships by path for consistent output
 */
function sortByPath(ownerships: FileOwnership[]): FileOwnership[] {
  return ownerships.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Get email-to-username mapping from git config or team mappings
 */
export function emailToUsername(
  email: string,
  teamMappings?: Record<string, readonly string[]>
): string {
  // Try to extract username from email
  const match = email.match(/^([^@]+)@/);
  const username = match?.[1] ?? email;

  // Check if user belongs to a team
  if (teamMappings) {
    for (const [team, members] of Object.entries(teamMappings)) {
      if (members.includes(username) || members.includes(email)) {
        return `@${team}`;
      }
    }
  }

  // Return as GitHub username format
  return `@${username}`;
}
