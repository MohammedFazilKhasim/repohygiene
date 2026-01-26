/**
 * RepoHygiene - License Auditor
 * Main scanner class for license auditing
 */

import { BaseScanner } from '../../core/scanner.js';
import type { GitContext } from '../../core/git.js';
import type {
    LicenseOptions,
    LicenseData,
    RepoHygieneConfig
} from '../../types/index.js';
import { scanLicenses } from './scanner.js';
import {
    generateLicenseSummary,
    shouldFail,
    DEFAULT_POLICY,
    type LicensePolicy,
} from './policy.js';

export class LicenseAuditor extends BaseScanner<LicenseOptions, LicenseData> {
    private readonly policy: LicensePolicy;

    constructor(
        gitContext: GitContext,
        config: RepoHygieneConfig,
        options: LicenseOptions = {}
    ) {
        const mergedOptions: LicenseOptions = {
            allow: config.licenses?.allow ?? DEFAULT_POLICY.allow,
            deny: config.licenses?.deny ?? DEFAULT_POLICY.deny,
            failOn: config.licenses?.failOn ?? 'restricted',
            production: config.licenses?.production ?? true,
            ...options,
        };

        super('licenses', gitContext, config, mergedOptions);

        this.policy = {
            allow: mergedOptions.allow ?? DEFAULT_POLICY.allow,
            deny: mergedOptions.deny ?? DEFAULT_POLICY.deny,
            failOn: mergedOptions.failOn ?? 'restricted',
        };
    }

    async scan(): Promise<LicenseData> {
        this.log('Starting license audit...');

        // Scan all dependencies
        const dependencies = await scanLicenses({
            cwd: this.gitContext.rootDir,
            allow: this.policy.allow,
            deny: this.policy.deny,
            production: this.options.production,
        });

        this.log(`Scanned ${dependencies.length} dependencies`);

        // Generate summary
        const summary = generateLicenseSummary(dependencies);

        // Report denied licenses
        for (const dep of dependencies) {
            if (dep.status === 'denied') {
                this.addIssue({
                    severity: 'error',
                    message: `Denied license: ${dep.name}@${dep.version} uses ${dep.license}`,
                    rule: 'denied-license',
                    suggestion: 'Remove this package or seek an exception',
                });
            } else if (dep.status === 'unknown') {
                this.addIssue({
                    severity: 'warning',
                    message: `Unknown license: ${dep.name}@${dep.version} (${dep.license})`,
                    rule: 'unknown-license',
                    suggestion: 'Review this license manually and add to allow/deny list',
                });
            }
        }

        // Check if should fail
        if (shouldFail(summary, this.policy)) {
            this.addIssue({
                severity: 'error',
                message: `License policy violation: ${summary.denied} denied, ${summary.unknown} unknown`,
                rule: 'policy-violation',
            });
        }

        return {
            dependencies,
            summary,
        };
    }
}

/**
 * Factory function for creating license auditor
 */
export function createLicenseAuditor(
    gitContext: GitContext,
    config: RepoHygieneConfig,
    options?: LicenseOptions
): LicenseAuditor {
    return new LicenseAuditor(gitContext, config, options);
}
