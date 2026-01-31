/**
 * SARIF Output Tests
 * Comprehensive tests for SARIF generation functionality
 */

import { describe, it, expect } from 'vitest';
import {
    createSarifResult,
    generateSarif,
    SARIF_RULES,
    secretsToSarif,
    licensesToSarif,
    branchesToSarif,
    codeownersToSarif,
    depsToSarif,
} from '../../src/cli/sarif.js';

describe('SARIF Output Generation', () => {
    // ============================================================================
    // createSarifResult Tests
    // ============================================================================
    describe('createSarifResult', () => {
        it('creates result with known rule ID', () => {
            const result = createSarifResult('secret/aws-key', 'AWS key detected');
            expect(result.ruleId).toBe('secret/aws-key');
            expect(result.level).toBe('error');
            expect(result.message).toBe('AWS key detected');
        });

        it('creates result with unknown rule ID (fallback to warning)', () => {
            const result = createSarifResult('unknown/rule', 'Unknown issue');
            expect(result.ruleId).toBe('unknown/rule');
            expect(result.level).toBe('warning');
        });

        it('includes location when provided', () => {
            const result = createSarifResult('secret/github-token', 'Token found', {
                uri: 'src/config.ts',
                startLine: 10,
                startColumn: 5,
            });
            expect(result.locations).toHaveLength(1);
            expect(result.locations![0].uri).toBe('src/config.ts');
            expect(result.locations![0].startLine).toBe(10);
        });

        it('handles missing location gracefully', () => {
            const result = createSarifResult('license/denied', 'License issue');
            expect(result.locations).toBeUndefined();
        });

        it('creates results for all severity levels', () => {
            const errorResult = createSarifResult('secret/private-key', 'Key found');
            const warningResult = createSarifResult('license/copyleft', 'Copyleft');
            const noteResult = createSarifResult('branch/stale', 'Stale branch');

            expect(errorResult.level).toBe('error');
            expect(warningResult.level).toBe('warning');
            expect(noteResult.level).toBe('note');
        });
    });

    // ============================================================================
    // generateSarif Tests
    // ============================================================================
    describe('generateSarif', () => {
        it('generates valid SARIF structure', () => {
            const results = [
                createSarifResult('secret/aws-key', 'Test issue'),
            ];
            const sarif = generateSarif(results);

            expect(sarif.version).toBe('2.1.0');
            expect(sarif.$schema).toContain('sarif-schema');
            expect(sarif.runs).toHaveLength(1);
        });

        it('includes tool driver information', () => {
            const sarif = generateSarif([]);

            expect(sarif.runs[0].tool.driver.name).toBe('RepoHygiene');
            expect(sarif.runs[0].tool.driver.version).toBe('0.1.0');
            expect(sarif.runs[0].tool.driver.informationUri).toContain('github.com');
        });

        it('deduplicates rules in output', () => {
            const results = [
                createSarifResult('secret/aws-key', 'Issue 1'),
                createSarifResult('secret/aws-key', 'Issue 2'),
                createSarifResult('secret/aws-key', 'Issue 3'),
            ];
            const sarif = generateSarif(results);

            expect(sarif.runs[0].tool.driver.rules).toHaveLength(1);
            expect(sarif.runs[0].results).toHaveLength(3);
        });

        it('handles empty results array', () => {
            const sarif = generateSarif([]);

            expect(sarif.runs[0].results).toHaveLength(0);
            expect(sarif.runs[0].tool.driver.rules).toHaveLength(0);
        });

        it('maps multiple rule types correctly', () => {
            const results = [
                createSarifResult('secret/aws-key', 'Secret'),
                createSarifResult('license/denied', 'License'),
                createSarifResult('branch/stale', 'Branch'),
            ];
            const sarif = generateSarif(results);

            expect(sarif.runs[0].tool.driver.rules).toHaveLength(3);
        });
    });

    // ============================================================================
    // SARIF_RULES Tests
    // ============================================================================
    describe('SARIF_RULES', () => {
        it('contains all secret rules', () => {
            expect(SARIF_RULES['secret/aws-key']).toBeDefined();
            expect(SARIF_RULES['secret/github-token']).toBeDefined();
            expect(SARIF_RULES['secret/private-key']).toBeDefined();
            expect(SARIF_RULES['secret/generic']).toBeDefined();
        });

        it('contains all license rules', () => {
            expect(SARIF_RULES['license/copyleft']).toBeDefined();
            expect(SARIF_RULES['license/unknown']).toBeDefined();
            expect(SARIF_RULES['license/denied']).toBeDefined();
        });

        it('contains all branch rules', () => {
            expect(SARIF_RULES['branch/stale']).toBeDefined();
            expect(SARIF_RULES['branch/unmerged']).toBeDefined();
        });

        it('contains all codeowners rules', () => {
            expect(SARIF_RULES['codeowners/missing']).toBeDefined();
            expect(SARIF_RULES['codeowners/invalid']).toBeDefined();
            expect(SARIF_RULES['codeowners/uncovered']).toBeDefined();
        });

        it('contains all deps rules', () => {
            expect(SARIF_RULES['deps/outdated']).toBeDefined();
            expect(SARIF_RULES['deps/vulnerable']).toBeDefined();
            expect(SARIF_RULES['deps/deprecated']).toBeDefined();
        });

        it('all rules have required properties', () => {
            for (const [id, rule] of Object.entries(SARIF_RULES)) {
                expect(rule.id).toBe(id);
                expect(rule.name).toBeTruthy();
                expect(rule.shortDescription).toBeTruthy();
            }
        });

        it('all rules have default configuration', () => {
            for (const rule of Object.values(SARIF_RULES)) {
                expect(rule.defaultConfiguration).toBeDefined();
                expect(['error', 'warning', 'note', 'none']).toContain(
                    rule.defaultConfiguration!.level
                );
            }
        });
    });

    // ============================================================================
    // secretsToSarif Tests
    // ============================================================================
    describe('secretsToSarif', () => {
        it('maps AWS secrets correctly', () => {
            const secrets = [{ type: 'AWS Access Key', file: 'config.ts', line: 10 }];
            const results = secretsToSarif(secrets);

            expect(results[0].ruleId).toBe('secret/aws-key');
        });

        it('maps GitHub tokens correctly', () => {
            const secrets = [{ type: 'GitHub Token', file: 'config.ts' }];
            const results = secretsToSarif(secrets);

            expect(results[0].ruleId).toBe('secret/github-token');
        });

        it('maps private keys correctly', () => {
            const secrets = [{ type: 'Private Key', file: 'id_rsa' }];
            const results = secretsToSarif(secrets);

            expect(results[0].ruleId).toBe('secret/private-key');
        });

        it('maps unknown secrets to generic', () => {
            const secrets = [{ type: 'Unknown Secret', file: 'data.txt' }];
            const results = secretsToSarif(secrets);

            expect(results[0].ruleId).toBe('secret/generic');
        });

        it('includes optional message', () => {
            const secrets = [{ type: 'AWS', file: 'f.ts', message: 'Custom message' }];
            const results = secretsToSarif(secrets);

            expect(results[0].message).toBe('Custom message');
        });

        it('handles empty array', () => {
            const results = secretsToSarif([]);
            expect(results).toHaveLength(0);
        });
    });

    // ============================================================================
    // licensesToSarif Tests
    // ============================================================================
    describe('licensesToSarif', () => {
        it('maps copyleft licenses', () => {
            const issues = [{ package: 'pkg', license: 'GPL-3.0', type: 'copyleft' as const }];
            const results = licensesToSarif(issues);

            expect(results[0].ruleId).toBe('license/copyleft');
        });

        it('maps unknown licenses', () => {
            const issues = [{ package: 'pkg', license: 'Unknown', type: 'unknown' as const }];
            const results = licensesToSarif(issues);

            expect(results[0].ruleId).toBe('license/unknown');
        });

        it('maps denied licenses', () => {
            const issues = [{ package: 'pkg', license: 'AGPL', type: 'denied' as const }];
            const results = licensesToSarif(issues);

            expect(results[0].ruleId).toBe('license/denied');
        });

        it('includes package info in message', () => {
            const issues = [{ package: 'lodash', license: 'GPL', type: 'copyleft' as const }];
            const results = licensesToSarif(issues);

            expect(results[0].message).toContain('lodash');
        });
    });

    // ============================================================================
    // branchesToSarif Tests
    // ============================================================================
    describe('branchesToSarif', () => {
        it('maps stale branches', () => {
            const branches = [{ name: 'feature/old', type: 'stale' as const }];
            const results = branchesToSarif(branches);

            expect(results[0].ruleId).toBe('branch/stale');
        });

        it('maps unmerged branches', () => {
            const branches = [{ name: 'feature/wip', type: 'unmerged' as const }];
            const results = branchesToSarif(branches);

            expect(results[0].ruleId).toBe('branch/unmerged');
        });

        it('includes branch name in message', () => {
            const branches = [{ name: 'my-branch', type: 'stale' as const }];
            const results = branchesToSarif(branches);

            expect(results[0].message).toContain('my-branch');
        });
    });

    // ============================================================================
    // codeownersToSarif Tests
    // ============================================================================
    describe('codeownersToSarif', () => {
        it('maps missing codeowners', () => {
            const issues = [{ type: 'missing' as const }];
            const results = codeownersToSarif(issues);

            expect(results[0].ruleId).toBe('codeowners/missing');
        });

        it('maps invalid entries', () => {
            const issues = [{ type: 'invalid' as const, line: 5 }];
            const results = codeownersToSarif(issues);

            expect(results[0].ruleId).toBe('codeowners/invalid');
            expect(results[0].locations![0].startLine).toBe(5);
        });

        it('maps uncovered paths', () => {
            const issues = [{ type: 'uncovered' as const, path: 'src/utils' }];
            const results = codeownersToSarif(issues);

            expect(results[0].ruleId).toBe('codeowners/uncovered');
        });
    });

    // ============================================================================
    // depsToSarif Tests
    // ============================================================================
    describe('depsToSarif', () => {
        it('maps outdated deps', () => {
            const deps = [{ package: 'lodash', type: 'outdated' as const, currentVersion: '4.0.0', latestVersion: '4.17.21' }];
            const results = depsToSarif(deps);

            expect(results[0].ruleId).toBe('deps/outdated');
            expect(results[0].message).toContain('latest: 4.17.21');
        });

        it('maps vulnerable deps', () => {
            const deps = [{ package: 'pkg', type: 'vulnerable' as const }];
            const results = depsToSarif(deps);

            expect(results[0].ruleId).toBe('deps/vulnerable');
        });

        it('maps deprecated deps', () => {
            const deps = [{ package: 'old-pkg', type: 'deprecated' as const }];
            const results = depsToSarif(deps);

            expect(results[0].ruleId).toBe('deps/deprecated');
        });
    });
});
