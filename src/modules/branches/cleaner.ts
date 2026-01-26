/**
 * RepoHygiene - Branch Cleaner
 * Safe deletion of stale branches
 */

import type { BranchInfo } from '../../types/index.js';
import type { GitContext } from '../../core/git.js';

export interface CleanupResult {
    readonly branch: string;
    readonly success: boolean;
    readonly error?: string;
}

/**
 * Delete branches (with safety checks)
 */
export async function deleteBranches(
    gitContext: GitContext,
    branches: readonly BranchInfo[],
    options: { remote?: boolean; force?: boolean } = {}
): Promise<CleanupResult[]> {
    const results: CleanupResult[] = [];
    const { remote = false, force = false } = options;

    for (const branch of branches) {
        // Safety check - never delete protected branches
        if (branch.isProtected) {
            results.push({
                branch: branch.name,
                success: false,
                error: 'Branch is protected',
            });
            continue;
        }

        try {
            if (branch.isRemote && remote) {
                // Delete remote branch
                await gitContext.git.push(['origin', '--delete', branch.name]);
            } else if (!branch.isRemote) {
                // Delete local branch
                const deleteFlag = force || branch.isMerged ? '-D' : '-d';
                await gitContext.git.branch([deleteFlag, branch.name]);
            }

            results.push({
                branch: branch.name,
                success: true,
            });
        } catch (error) {
            results.push({
                branch: branch.name,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    return results;
}

/**
 * Generate cleanup preview (dry run)
 */
export function generateCleanupPreview(
    branches: readonly BranchInfo[]
): string {
    const lines: string[] = [
        '# Branch Cleanup Preview',
        '',
        'The following branches would be deleted:',
        '',
    ];

    const staleBranches = branches.filter((b) => b.isStale && !b.isProtected);
    const mergedBranches = branches.filter((b) => b.isMerged && !b.isStale && !b.isProtected);

    if (staleBranches.length > 0) {
        lines.push('## Stale Branches');
        lines.push('');
        for (const branch of staleBranches) {
            lines.push(`- ${branch.name} (${branch.daysSinceLastCommit} days old)`);
        }
        lines.push('');
    }

    if (mergedBranches.length > 0) {
        lines.push('## Merged Branches');
        lines.push('');
        for (const branch of mergedBranches) {
            lines.push(`- ${branch.name}`);
        }
        lines.push('');
    }

    if (staleBranches.length === 0 && mergedBranches.length === 0) {
        lines.push('No branches to clean up.');
    } else {
        lines.push('---');
        lines.push('');
        lines.push(`Total: ${staleBranches.length + mergedBranches.length} branches`);
        lines.push('');
        lines.push('Run with `--delete` to actually delete these branches.');
    }

    return lines.join('\n');
}

/**
 * Generate cleanup report
 */
export function generateCleanupReport(results: readonly CleanupResult[]): string {
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    const lines: string[] = [
        '# Branch Cleanup Report',
        '',
        `Successfully deleted: ${successful.length}`,
        `Failed: ${failed.length}`,
        '',
    ];

    if (successful.length > 0) {
        lines.push('## Deleted Branches');
        lines.push('');
        for (const result of successful) {
            lines.push(`- ✓ ${result.branch}`);
        }
        lines.push('');
    }

    if (failed.length > 0) {
        lines.push('## Failed Deletions');
        lines.push('');
        for (const result of failed) {
            lines.push(`- ✗ ${result.branch}: ${result.error}`);
        }
    }

    return lines.join('\n');
}
