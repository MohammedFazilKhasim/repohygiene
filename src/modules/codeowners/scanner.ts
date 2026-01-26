/**
 * RepoHygiene - CODEOWNERS Scanner
 * Main scanner class for CODEOWNERS module
 */

import { writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { BaseScanner } from '../../core/scanner.js';
import type { GitContext } from '../../core/git.js';
import type {
    CodeownersOptions,
    CodeownersData,
    RepoHygieneConfig
} from '../../types/index.js';
import { analyzeOwnership } from './analyzer.js';
import { generateCodeowners, parseCodeowners, compareCodeowners } from './generator.js';
import { validateCodeowners, getCodeownersPath } from './validator.js';

export class CodeownersScanner extends BaseScanner<CodeownersOptions, CodeownersData> {
    constructor(
        gitContext: GitContext,
        config: RepoHygieneConfig,
        options: CodeownersOptions = {}
    ) {
        const mergedOptions: CodeownersOptions = {
            threshold: config.codeowners?.threshold ?? 10,
            output: config.codeowners?.output ?? '.github/CODEOWNERS',
            teamMappings: config.codeowners?.teamMappings,
            ...options,
        };

        super('codeowners', gitContext, config, mergedOptions);
    }

    async scan(): Promise<CodeownersData> {
        this.log('Starting CODEOWNERS analysis...');

        // Validate existing CODEOWNERS
        const validation = await validateCodeowners(this.gitContext);

        // Add validation issues
        for (const issue of validation.issues) {
            this.addIssue(issue);
        }

        // Analyze ownership
        const ownerships = await analyzeOwnership(this.gitContext, {
            threshold: this.options.threshold ?? 10,
            since: this.options.since,
            exclude: this.config.exclude,
        });

        this.log(`Found ${ownerships.length} paths with ownership data`);

        // Generate content
        const generatedContent = generateCodeowners(ownerships, {
            teamMappings: this.options.teamMappings,
            includeStats: true,
            maxOwnersPerPath: 3,
        });

        // Compare with existing
        let conflicts: string[] = [];
        if (validation.content) {
            const existing = parseCodeowners(validation.content);
            const diffs = compareCodeowners(ownerships, existing, this.options.teamMappings);

            for (const diff of diffs) {
                if (diff.type === 'new') {
                    this.addIssue({
                        severity: 'info',
                        message: `New path discovered: ${diff.path}`,
                        rule: 'new-path',
                    });
                } else if (diff.type === 'different') {
                    this.addIssue({
                        severity: 'warning',
                        message: `Owner mismatch for ${diff.path}: existing ${diff.existingOwners.join(', ')} vs suggested ${diff.suggestedOwners.slice(0, 2).join(', ')}`,
                        rule: 'owner-mismatch',
                    });
                    conflicts.push(diff.path);
                }
            }
        }

        return {
            files: ownerships,
            generatedContent,
            existingContent: validation.content ?? undefined,
            conflicts,
        };
    }

    /**
     * Write generated CODEOWNERS to file
     */
    async writeCodeowners(data: CodeownersData): Promise<void> {
        const outputPath = this.options.output ?? getCodeownersPath(this.gitContext);
        const fullPath = join(this.gitContext.rootDir, outputPath);

        // Ensure directory exists
        await mkdir(dirname(fullPath), { recursive: true });

        // Write file
        await writeFile(fullPath, data.generatedContent, 'utf-8');

        this.log(`Wrote CODEOWNERS to ${outputPath}`);
    }
}

/**
 * Factory function for creating scanner
 */
export function createCodeownersScanner(
    gitContext: GitContext,
    config: RepoHygieneConfig,
    options?: CodeownersOptions
): CodeownersScanner {
    return new CodeownersScanner(gitContext, config, options);
}
