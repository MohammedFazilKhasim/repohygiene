/**
 * RepoHygiene - Branches Scanner
 * Main scanner class for branch analysis
 */

import { BaseScanner } from '../../core/scanner.js';
import type { GitContext } from '../../core/git.js';
import type {
    BranchesOptions,
    BranchesData,
    RepoHygieneConfig
} from '../../types/index.js';
import { analyzeBranches, getBranchSummary } from './analyzer.js';
import { deleteBranches, generateCleanupPreview } from './cleaner.js';

export class BranchesScanner extends BaseScanner<BranchesOptions, BranchesData> {
    constructor(
        gitContext: GitContext,
        config: RepoHygieneConfig,
        options: BranchesOptions = {}
    ) {
        const mergedOptions: BranchesOptions = {
            staleDays: config.branches?.staleDays ?? 90,
            exclude: config.branches?.exclude ?? [],
            remote: config.branches?.remote ?? true,
            mergedOnly: config.branches?.mergedOnly ?? false,
            dryRun: true,
            ...options,
        };

        super('branches', gitContext, config, mergedOptions);
    }

    async scan(): Promise<BranchesData> {
        this.log('Starting branch analysis...');

        // Analyze all branches
        const branches = await analyzeBranches(this.gitContext, this.options);
        const summary = getBranchSummary(branches);

        this.log(`Found ${branches.length} branches, ${summary.stale} stale`);

        // Report stale branches
        const staleBranches = branches.filter((b) => b.isStale);
        for (const branch of staleBranches) {
            this.addIssue({
                severity: 'warning',
                message: `Stale branch: ${branch.name} (${branch.daysSinceLastCommit} days since last commit)`,
                rule: 'stale-branch',
                suggestion: branch.isMerged
                    ? 'This branch is merged and can be safely deleted'
                    : 'Consider deleting or updating this branch',
            });
        }

        // Report merged branches that aren't stale
        const mergedNotStale = branches.filter((b) => b.isMerged && !b.isStale && !b.isProtected);
        for (const branch of mergedNotStale) {
            this.addIssue({
                severity: 'info',
                message: `Merged branch: ${branch.name}`,
                rule: 'merged-branch',
                suggestion: 'This branch can be safely deleted',
            });
        }

        // Summary issue if stale branches found
        if (summary.stale > 0) {
            this.addIssue({
                severity: 'warning',
                message: `Found ${summary.stale} stale branches (>${this.options.staleDays ?? 90} days old)`,
                rule: 'stale-branches-summary',
                suggestion: 'Run `repohygiene branches --delete` to clean up',
            });
        }

        return {
            branches,
            staleCount: summary.stale,
            mergedCount: summary.merged,
            protectedCount: summary.protected,
        };
    }

    /**
     * Delete stale branches
     */
    async cleanup(dryRun: boolean = true): Promise<string> {
        const data = await this.scan();

        if (dryRun) {
            return generateCleanupPreview(data.branches);
        }

        const toDelete = data.branches.filter((b) => b.isStale && !b.isProtected);
        const results = await deleteBranches(this.gitContext, toDelete, {
            remote: this.options.remote,
        });

        const successful = results.filter((r) => r.success).length;
        return `Deleted ${successful}/${toDelete.length} branches`;
    }
}

/**
 * Factory function for creating branches scanner
 */
export function createBranchesScanner(
    gitContext: GitContext,
    config: RepoHygieneConfig,
    options?: BranchesOptions
): BranchesScanner {
    return new BranchesScanner(gitContext, config, options);
}
