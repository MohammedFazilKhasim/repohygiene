/**
 * RepoHygiene - Branch Analyzer
 * Analyzes branches for staleness and merge status
 */

import type { BranchInfo, BranchesOptions } from '../../types/index.js';
import {
  getBranches,
  getMergedBranches,
  getBranchLastCommit,
  getDefaultBranch,
  type GitContext,
} from '../../core/git.js';

const DEFAULT_PROTECTED_PATTERNS = [
  'main',
  'master',
  'develop',
  'development',
  'staging',
  'production',
  'release/*',
  'releases/*',
  'hotfix/*',
  'hotfixes/*',
];

/**
 * Analyze all branches in the repository
 */
export async function analyzeBranches(
  gitContext: GitContext,
  options: BranchesOptions
): Promise<BranchInfo[]> {
  const { staleDays = 90, exclude = DEFAULT_PROTECTED_PATTERNS, remote = true } = options;

  // Get all branches
  const allBranches = await getBranches(gitContext, { remote });
  const defaultBranch = await getDefaultBranch(gitContext);

  // Get merged branches
  const mergedBranches = new Set(await getMergedBranches(gitContext, defaultBranch));

  // Build protected pattern matchers
  const protectedPatterns = [...DEFAULT_PROTECTED_PATTERNS, ...exclude];
  const now = new Date();

  const branchInfos: BranchInfo[] = [];

  for (const branchName of allBranches) {
    // Skip HEAD and origin/HEAD
    if (branchName.includes('HEAD')) {
      continue;
    }

    // Determine if remote
    const isRemote = branchName.startsWith('remotes/') || branchName.startsWith('origin/');
    const cleanName = branchName
      .replace(/^remotes\/origin\//, '')
      .replace(/^origin\//, '')
      .replace(/^\*\s*/, '')
      .trim();

    // Skip if protected
    const isProtected = isProtectedBranch(cleanName, protectedPatterns);

    // Get last commit info
    const lastCommit = await getBranchLastCommit(gitContext, branchName);

    if (!lastCommit) {
      continue;
    }

    // Calculate days since last commit
    const daysSinceLastCommit = Math.floor(
      (now.getTime() - lastCommit.date.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine if stale
    const isStale = daysSinceLastCommit >= staleDays && !isProtected;

    // Check if merged
    const isMerged = mergedBranches.has(cleanName) || mergedBranches.has(branchName);

    branchInfos.push({
      name: cleanName,
      isRemote,
      isMerged,
      lastCommitDate: lastCommit.date,
      lastCommitAuthor: lastCommit.author,
      lastCommitMessage: lastCommit.message,
      daysSinceLastCommit,
      isStale,
      isProtected,
    });
  }

  // Remove duplicates (local + remote versions of same branch)
  const uniqueBranches = deduplicateBranches(branchInfos);

  // Sort by days since last commit (stalest first)
  return uniqueBranches.sort((a, b) => b.daysSinceLastCommit - a.daysSinceLastCommit);
}

/**
 * Check if a branch name matches protected patterns
 */
function isProtectedBranch(branchName: string, patterns: readonly string[]): boolean {
  for (const pattern of patterns) {
    if (pattern.includes('*')) {
      // Glob pattern
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(branchName)) {
        return true;
      }
    } else {
      // Exact match
      if (branchName === pattern) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Remove duplicate branches (prefer local over remote info)
 */
function deduplicateBranches(branches: BranchInfo[]): BranchInfo[] {
  const seen = new Map<string, BranchInfo>();

  for (const branch of branches) {
    const existing = seen.get(branch.name);
    if (!existing || !branch.isRemote) {
      seen.set(branch.name, branch);
    }
  }

  return Array.from(seen.values());
}

/**
 * Get summary statistics
 */
export function getBranchSummary(branches: readonly BranchInfo[]): {
  total: number;
  stale: number;
  merged: number;
  protected: number;
} {
  return {
    total: branches.length,
    stale: branches.filter((b) => b.isStale).length,
    merged: branches.filter((b) => b.isMerged).length,
    protected: branches.filter((b) => b.isProtected).length,
  };
}
