/**
 * RepoHygiene - Secrets Auditor
 * Main scanner class for secret detection
 */

import { BaseScanner } from '../../core/scanner.js';
import type { GitContext } from '../../core/git.js';
import type {
    SecretsOptions,
    SecretsData,
    RepoHygieneConfig
} from '../../types/index.js';
import { scanFilesForSecrets } from './scanner.js';

export class SecretsAuditor extends BaseScanner<SecretsOptions, SecretsData> {
    constructor(
        gitContext: GitContext,
        config: RepoHygieneConfig,
        options: SecretsOptions = {}
    ) {
        const mergedOptions: SecretsOptions = {
            scanHistory: config.secrets?.scanHistory ?? false,
            entropyThreshold: config.secrets?.entropyThreshold ?? 4.5,
            exclude: config.secrets?.exclude ?? [],
            ...options,
        };

        super('secrets', gitContext, config, mergedOptions);
    }

    async scan(): Promise<SecretsData> {
        this.log('Starting secret scan...');

        // Scan files
        const { findings, scannedFiles } = await scanFilesForSecrets({
            cwd: this.gitContext.rootDir,
            exclude: [...(this.config.exclude ?? []), ...(this.options.exclude ?? [])],
            include: this.options.include,
            entropyThreshold: this.options.entropyThreshold,
        });

        this.log(`Scanned ${scannedFiles} files, found ${findings.length} potential secrets`);

        // Report findings as issues
        for (const finding of findings) {
            const severity = finding.entropy !== undefined && finding.entropy > 0 ? 'warning' : 'error';

            this.addIssue({
                severity,
                message: `${finding.type}: ${finding.masked}`,
                file: finding.file,
                line: finding.line,
                column: finding.column,
                rule: 'no-secrets',
                suggestion: 'Remove this secret and rotate it immediately',
            });
        }

        // Summary warning if secrets found
        if (findings.length > 0) {
            this.addIssue({
                severity: 'error',
                message: `Found ${findings.length} potential secrets in ${scannedFiles} files`,
                rule: 'secrets-summary',
                suggestion: 'Review findings and rotate any exposed credentials',
            });
        }

        return {
            findings,
            scannedFiles,
        };
    }
}

/**
 * Factory function for creating secrets auditor
 */
export function createSecretsAuditor(
    gitContext: GitContext,
    config: RepoHygieneConfig,
    options?: SecretsOptions
): SecretsAuditor {
    return new SecretsAuditor(gitContext, config, options);
}
