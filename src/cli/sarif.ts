/**
 * RepoHygiene - SARIF Reporter
 * Generates SARIF (Static Analysis Results Interchange Format) output
 * for GitHub Security tab integration
 */

import * as fs from 'fs';
import * as path from 'path';

export interface SarifLocation {
    uri: string;
    startLine?: number;
    startColumn?: number;
    endLine?: number;
    endColumn?: number;
}

export interface SarifResult {
    ruleId: string;
    level: 'error' | 'warning' | 'note' | 'none';
    message: string;
    locations?: SarifLocation[];
}

export interface SarifRule {
    id: string;
    name: string;
    shortDescription: string;
    fullDescription?: string;
    helpUri?: string;
    defaultConfiguration?: {
        level: 'error' | 'warning' | 'note' | 'none';
    };
}

export interface SarifOutput {
    version: '2.1.0';
    $schema: string;
    runs: Array<{
        tool: {
            driver: {
                name: string;
                version: string;
                informationUri: string;
                rules: SarifRule[];
            };
        };
        results: Array<{
            ruleId: string;
            level: string;
            message: { text: string };
            locations?: Array<{
                physicalLocation: {
                    artifactLocation: { uri: string };
                    region?: {
                        startLine?: number;
                        startColumn?: number;
                        endLine?: number;
                        endColumn?: number;
                    };
                };
            }>;
        }>;
    }>;
}

const SARIF_SCHEMA = 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json';
const TOOL_NAME = 'RepoHygiene';
const TOOL_VERSION = '0.1.0';
const TOOL_INFO_URI = 'https://github.com/MohammedFazilKhasim/repohygiene';

/**
 * Built-in SARIF rules for different scan types
 */
export const SARIF_RULES: Record<string, SarifRule> = {
    // Secret scanning rules
    'secret/aws-key': {
        id: 'secret/aws-key',
        name: 'AWS Access Key Detected',
        shortDescription: 'AWS access key found in source code',
        fullDescription: 'An AWS access key ID was detected in the source code. This could lead to unauthorized access to AWS resources.',
        helpUri: 'https://docs.aws.amazon.com/general/latest/gr/aws-access-keys-best-practices.html',
        defaultConfiguration: { level: 'error' },
    },
    'secret/github-token': {
        id: 'secret/github-token',
        name: 'GitHub Token Detected',
        shortDescription: 'GitHub personal access token found in source code',
        fullDescription: 'A GitHub personal access token was detected. This could allow unauthorized access to repositories.',
        helpUri: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens',
        defaultConfiguration: { level: 'error' },
    },
    'secret/private-key': {
        id: 'secret/private-key',
        name: 'Private Key Detected',
        shortDescription: 'Private key found in source code',
        fullDescription: 'A private key was detected in the source code. Private keys should never be committed to version control.',
        helpUri: 'https://owasp.org/www-project-web-security-testing-guide/',
        defaultConfiguration: { level: 'error' },
    },
    'secret/generic': {
        id: 'secret/generic',
        name: 'Potential Secret Detected',
        shortDescription: 'High-entropy string that may be a secret',
        fullDescription: 'A high-entropy string was detected that may be a secret, password, or API key.',
        defaultConfiguration: { level: 'warning' },
    },

    // License scanning rules
    'license/copyleft': {
        id: 'license/copyleft',
        name: 'Copyleft License',
        shortDescription: 'Dependency uses a copyleft license',
        fullDescription: 'A dependency uses a copyleft license (GPL, AGPL) which may require you to open-source your code.',
        helpUri: 'https://choosealicense.com/licenses/',
        defaultConfiguration: { level: 'warning' },
    },
    'license/unknown': {
        id: 'license/unknown',
        name: 'Unknown License',
        shortDescription: 'Dependency has an unknown or unrecognized license',
        fullDescription: 'A dependency license could not be identified. Manual review is recommended.',
        defaultConfiguration: { level: 'warning' },
    },
    'license/denied': {
        id: 'license/denied',
        name: 'Denied License',
        shortDescription: 'Dependency uses a denied license',
        fullDescription: 'A dependency uses a license that is on the deny list.',
        defaultConfiguration: { level: 'error' },
    },

    // Branch scanning rules
    'branch/stale': {
        id: 'branch/stale',
        name: 'Stale Branch',
        shortDescription: 'Branch has not been updated recently',
        fullDescription: 'This branch has not received commits for an extended period and may be abandoned.',
        defaultConfiguration: { level: 'note' },
    },
    'branch/unmerged': {
        id: 'branch/unmerged',
        name: 'Unmerged Branch',
        shortDescription: 'Branch contains unmerged changes',
        fullDescription: 'This branch contains changes that have not been merged into the main branch.',
        defaultConfiguration: { level: 'note' },
    },

    // CODEOWNERS rules
    'codeowners/missing': {
        id: 'codeowners/missing',
        name: 'Missing CODEOWNERS',
        shortDescription: 'No CODEOWNERS file found',
        fullDescription: 'A CODEOWNERS file is recommended for repositories to define code ownership.',
        defaultConfiguration: { level: 'warning' },
    },
    'codeowners/invalid': {
        id: 'codeowners/invalid',
        name: 'Invalid CODEOWNERS Entry',
        shortDescription: 'CODEOWNERS file contains invalid entries',
        fullDescription: 'The CODEOWNERS file contains syntax errors or references non-existent paths.',
        defaultConfiguration: { level: 'error' },
    },
    'codeowners/uncovered': {
        id: 'codeowners/uncovered',
        name: 'Uncovered Path',
        shortDescription: 'Path not covered by CODEOWNERS',
        fullDescription: 'Some paths in the repository are not covered by any CODEOWNERS rule.',
        defaultConfiguration: { level: 'note' },
    },

    // Dependency rules
    'deps/outdated': {
        id: 'deps/outdated',
        name: 'Outdated Dependency',
        shortDescription: 'Dependency is outdated',
        fullDescription: 'A newer version of this dependency is available.',
        defaultConfiguration: { level: 'note' },
    },
    'deps/vulnerable': {
        id: 'deps/vulnerable',
        name: 'Vulnerable Dependency',
        shortDescription: 'Dependency has known vulnerabilities',
        fullDescription: 'This dependency has known security vulnerabilities. Update to a patched version.',
        helpUri: 'https://nvd.nist.gov/',
        defaultConfiguration: { level: 'error' },
    },
    'deps/deprecated': {
        id: 'deps/deprecated',
        name: 'Deprecated Dependency',
        shortDescription: 'Dependency is deprecated',
        fullDescription: 'This dependency is deprecated and should be replaced.',
        defaultConfiguration: { level: 'warning' },
    },
};

/**
 * Create a SARIF result from scan findings
 */
export function createSarifResult(
    ruleId: string,
    message: string,
    location?: SarifLocation
): SarifResult {
    const rule = SARIF_RULES[ruleId];
    return {
        ruleId,
        level: rule?.defaultConfiguration?.level ?? 'warning',
        message,
        locations: location ? [location] : undefined,
    };
}

/**
 * Generate SARIF output from scan results
 */
export function generateSarif(results: SarifResult[]): SarifOutput {
    // Collect unique rules used in results
    const usedRuleIds = new Set(results.map((r) => r.ruleId));
    const rules = Array.from(usedRuleIds)
        .map((id) => SARIF_RULES[id])
        .filter((rule): rule is SarifRule => rule !== undefined);

    return {
        version: '2.1.0',
        $schema: SARIF_SCHEMA,
        runs: [
            {
                tool: {
                    driver: {
                        name: TOOL_NAME,
                        version: TOOL_VERSION,
                        informationUri: TOOL_INFO_URI,
                        rules,
                    },
                },
                results: results.map((result) => ({
                    ruleId: result.ruleId,
                    level: result.level,
                    message: { text: result.message },
                    locations: result.locations?.map((loc) => ({
                        physicalLocation: {
                            artifactLocation: { uri: loc.uri },
                            region:
                                loc.startLine !== undefined
                                    ? {
                                        startLine: loc.startLine,
                                        startColumn: loc.startColumn,
                                        endLine: loc.endLine,
                                        endColumn: loc.endColumn,
                                    }
                                    : undefined,
                        },
                    })),
                })),
            },
        ],
    };
}

/**
 * Write SARIF output to file
 */
export function writeSarifFile(sarif: SarifOutput, outputPath: string): void {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(sarif, null, 2), 'utf-8');
}

/**
 * Generate SARIF from secret scan results
 */
export function secretsToSarif(
    secrets: Array<{
        type: string;
        file: string;
        line?: number;
        column?: number;
        message?: string;
    }>
): SarifResult[] {
    return secrets.map((secret) => {
        let ruleId = 'secret/generic';
        if (secret.type.toLowerCase().includes('aws')) {
            ruleId = 'secret/aws-key';
        } else if (secret.type.toLowerCase().includes('github')) {
            ruleId = 'secret/github-token';
        } else if (secret.type.toLowerCase().includes('private key')) {
            ruleId = 'secret/private-key';
        }

        return createSarifResult(ruleId, secret.message ?? `${secret.type} detected`, {
            uri: secret.file,
            startLine: secret.line,
            startColumn: secret.column,
        });
    });
}

/**
 * Generate SARIF from license audit results
 */
export function licensesToSarif(
    issues: Array<{
        package: string;
        license: string;
        type: 'copyleft' | 'unknown' | 'denied';
        message?: string;
    }>
): SarifResult[] {
    return issues.map((issue) => {
        const ruleId = `license/${issue.type}`;
        return createSarifResult(
            ruleId,
            issue.message ?? `${issue.package}: ${issue.license} license`,
            { uri: 'package.json' }
        );
    });
}

/**
 * Generate SARIF from branch analysis results
 */
export function branchesToSarif(
    branches: Array<{
        name: string;
        type: 'stale' | 'unmerged';
        lastCommit?: string;
        message?: string;
    }>
): SarifResult[] {
    return branches.map((branch) => {
        const ruleId = `branch/${branch.type}`;
        return createSarifResult(
            ruleId,
            branch.message ?? `Branch ${branch.name} is ${branch.type}`,
            { uri: `.git/refs/heads/${branch.name}` }
        );
    });
}

/**
 * Generate SARIF from CODEOWNERS validation results
 */
export function codeownersToSarif(
    issues: Array<{
        type: 'missing' | 'invalid' | 'uncovered';
        path?: string;
        line?: number;
        message?: string;
    }>
): SarifResult[] {
    return issues.map((issue) => {
        const ruleId = `codeowners/${issue.type}`;
        return createSarifResult(ruleId, issue.message ?? `CODEOWNERS ${issue.type}`, {
            uri: issue.path ?? 'CODEOWNERS',
            startLine: issue.line,
        });
    });
}

/**
 * Generate SARIF from dependency analysis results
 */
export function depsToSarif(
    deps: Array<{
        package: string;
        type: 'outdated' | 'vulnerable' | 'deprecated';
        currentVersion?: string;
        latestVersion?: string;
        message?: string;
    }>
): SarifResult[] {
    return deps.map((dep) => {
        const ruleId = `deps/${dep.type}`;
        return createSarifResult(
            ruleId,
            dep.message ??
            `${dep.package}@${dep.currentVersion} is ${dep.type}${dep.latestVersion ? ` (latest: ${dep.latestVersion})` : ''}`,
            { uri: 'package.json' }
        );
    });
}
