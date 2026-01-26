/**
 * RepoHygiene - Git Utilities
 * Wrapper around simple-git for common git operations
 */

import { simpleGit, type SimpleGit, type LogResult, type DefaultLogFields } from 'simple-git';

export interface GitContext {
    readonly git: SimpleGit;
    readonly rootDir: string;
    readonly isGitRepo: boolean;
}

export interface CommitInfo {
    readonly hash: string;
    readonly author: string;
    readonly email: string;
    readonly date: Date;
    readonly message: string;
}

export interface BlameInfo {
    readonly line: number;
    readonly hash: string;
    readonly author: string;
    readonly email: string;
    readonly date: Date;
}

/**
 * Initialize git context for the given directory
 */
export async function initGitContext(cwd: string = process.cwd()): Promise<GitContext> {
    const git = simpleGit(cwd);

    let isGitRepo = false;
    let rootDir = cwd;

    try {
        isGitRepo = await git.checkIsRepo();
        if (isGitRepo) {
            rootDir = await git.revparse(['--show-toplevel']);
            rootDir = rootDir.trim();
        }
    } catch {
        isGitRepo = false;
    }

    return {
        git: simpleGit(rootDir),
        rootDir,
        isGitRepo,
    };
}

/**
 * Get commit log for a specific file or directory
 */
export async function getCommitLog(
    ctx: GitContext,
    path?: string,
    options?: { since?: string; maxCount?: number }
): Promise<CommitInfo[]> {
    const logOptions: string[] = [];

    if (options?.since !== undefined) {
        logOptions.push(`--since=${options.since}`);
    }

    if (options?.maxCount !== undefined) {
        logOptions.push(`-n ${options.maxCount}`);
    }

    if (path !== undefined) {
        logOptions.push('--', path);
    }

    const log: LogResult<DefaultLogFields> = await ctx.git.log(logOptions);

    return log.all.map((entry) => ({
        hash: entry.hash,
        author: entry.author_name,
        email: entry.author_email,
        date: new Date(entry.date),
        message: entry.message,
    }));
}

/**
 * Get all branches (local and/or remote)
 */
export async function getBranches(
    ctx: GitContext,
    options?: { remote?: boolean }
): Promise<string[]> {
    const branchSummary = await ctx.git.branch([
        options?.remote === true ? '-a' : '-l',
        '--no-color',
    ]);

    return branchSummary.all;
}

/**
 * Get merged branches relative to a target branch
 */
export async function getMergedBranches(
    ctx: GitContext,
    targetBranch: string = 'main'
): Promise<string[]> {
    try {
        const result = await ctx.git.branch(['--merged', targetBranch]);
        return result.all.filter((b) => b !== targetBranch && !b.includes('HEAD'));
    } catch {
        // Try with 'master' if 'main' doesn't exist
        if (targetBranch === 'main') {
            return getMergedBranches(ctx, 'master');
        }
        return [];
    }
}

/**
 * Get the last commit date for a branch
 */
export async function getBranchLastCommit(
    ctx: GitContext,
    branchName: string
): Promise<CommitInfo | null> {
    try {
        const log = await ctx.git.log(['-1', branchName]);
        const entry = log.latest;

        if (!entry) {
            return null;
        }

        return {
            hash: entry.hash,
            author: entry.author_name,
            email: entry.author_email,
            date: new Date(entry.date),
            message: entry.message,
        };
    } catch {
        return null;
    }
}

/**
 * Get contribution stats per author for a path
 */
export async function getContributionStats(
    ctx: GitContext,
    path?: string,
    options?: { since?: string }
): Promise<Map<string, { commits: number; email: string; lastCommit: Date }>> {
    const commits = await getCommitLog(ctx, path, { since: options?.since });
    const stats = new Map<string, { commits: number; email: string; lastCommit: Date }>();

    for (const commit of commits) {
        const existing = stats.get(commit.author);
        if (existing) {
            existing.commits++;
            if (commit.date > existing.lastCommit) {
                existing.lastCommit = commit.date;
            }
        } else {
            stats.set(commit.author, {
                commits: 1,
                email: commit.email,
                lastCommit: commit.date,
            });
        }
    }

    return stats;
}

/**
 * Check if a path is tracked by git
 */
export async function isTracked(ctx: GitContext, path: string): Promise<boolean> {
    try {
        await ctx.git.raw(['ls-files', '--error-unmatch', path]);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get current branch name
 */
export async function getCurrentBranch(ctx: GitContext): Promise<string | null> {
    try {
        const branch = await ctx.git.revparse(['--abbrev-ref', 'HEAD']);
        return branch.trim();
    } catch {
        return null;
    }
}

/**
 * Get default branch (main or master)
 */
export async function getDefaultBranch(ctx: GitContext): Promise<string> {
    try {
        // Try to get from remote
        const remote = await ctx.git.remote(['show', 'origin']);
        const match = remote?.match(/HEAD branch: (.+)/);
        if (match?.[1] !== undefined) {
            return match[1].trim();
        }
    } catch {
        // Ignore and try fallback
    }

    // Fallback: check if main or master exists
    const branches = await getBranches(ctx);
    if (branches.includes('main')) return 'main';
    if (branches.includes('master')) return 'master';

    return 'main';
}
