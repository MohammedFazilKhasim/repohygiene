/**
 * RepoHygiene - Dependency Scanner
 * Scanner for project dependencies
 */

import { BaseScanner } from '../../core/scanner.js';
import type { GitContext } from '../../core/git.js';
import type {
    DepsOptions,
    DepsData,
    RepoHygieneConfig
} from '../../types/index.js';
import { analyzeDependencies } from './analyzer.js';

export class DepsScanner extends BaseScanner<DepsOptions, DepsData> {
    constructor(
        gitContext: GitContext,
        config: RepoHygieneConfig,
        options: DepsOptions = {}
    ) {
        const mergedOptions: DepsOptions = {
            outdated: config.deps?.outdated ?? true,
            duplicates: config.deps?.duplicates ?? true,
            ...options,
        };

        super('deps', gitContext, config, mergedOptions);
    }

    async scan(): Promise<DepsData> {
        this.log('Starting dependency analysis...');

        const data = await analyzeDependencies(this.gitContext.rootDir);

        this.log(`Found ${data.outdatedCount} outdated packages`);

        // Add issues for outdated packages
        for (const dep of data.dependencies) {
            if (dep.isOutdated) {
                this.addIssue({
                    severity: 'warning',
                    message: `Outdated package: ${dep.name} (${dep.version} -> ${dep.latestVersion ?? 'unknown'})`,
                    rule: 'no-outdated',
                    suggestion: `Run 'npm update ${dep.name}' to upgrade`,
                });
            }
        }

        // Add issues for duplicates
        for (const dup of data.duplicates) {
            this.addIssue({
                severity: 'warning',
                message: `Duplicate dependency found: ${dup.name} partitions versions: ${dup.versions.join(', ')}`,
                rule: 'no-duplicates',
                suggestion: `Run 'npm dedupe' or check lockfile`,
            });
        }

        return data;
    }
}

/**
 * Factory function for creating dependency scanner
 */
export function createDepsScanner(
    gitContext: GitContext,
    config: RepoHygieneConfig,
    options?: DepsOptions
): DepsScanner {
    return new DepsScanner(gitContext, config, options);
}
