/**
 * Git Hooks Tests
 * Comprehensive tests for git hooks management functionality
 */

import { describe, it, expect } from 'vitest';
import {
    getHooksDir,
    isHookInstalled,
    getHooksStatus,
    generateCustomHook,
} from '../../src/cli/hooks.js';

describe('Git Hooks Management', () => {
    // ============================================================================
    // getHooksDir Tests
    // ============================================================================
    describe('getHooksDir', () => {
        it('returns correct path for repo', () => {
            const path = getHooksDir('/path/to/repo');
            // Use toContain for cross-platform compatibility
            expect(path).toContain('.git');
            expect(path).toContain('hooks');
        });

        it('handles Windows paths', () => {
            const path = getHooksDir('C:\\Users\\test\\repo');
            expect(path).toContain('.git');
            expect(path).toContain('hooks');
        });

        it('handles paths with trailing slash', () => {
            const path = getHooksDir('/path/to/repo/');
            expect(path).toContain('.git');
            expect(path).toContain('hooks');
        });
    });

    // ============================================================================
    // isHookInstalled Tests
    // ============================================================================
    describe('isHookInstalled', () => {
        it('returns false for non-existent hook', () => {
            const result = isHookInstalled('/nonexistent/path', 'pre-commit');
            expect(result).toBe(false);
        });

        it('accepts valid hook names', () => {
            // Just testing the function doesn't throw
            expect(() => isHookInstalled('/tmp', 'pre-commit')).not.toThrow();
            expect(() => isHookInstalled('/tmp', 'pre-push')).not.toThrow();
            expect(() => isHookInstalled('/tmp', 'commit-msg')).not.toThrow();
        });
    });

    // ============================================================================
    // getHooksStatus Tests
    // ============================================================================
    describe('getHooksStatus', () => {
        it('returns status for pre-commit and pre-push', () => {
            const status = getHooksStatus('/tmp/nonexistent');

            expect(status).toHaveLength(2);
            expect(status[0].hook).toBe('pre-commit');
            expect(status[1].hook).toBe('pre-push');
        });

        it('returns installed: false for non-existent repo', () => {
            const status = getHooksStatus('/nonexistent/repo');

            for (const { installed } of status) {
                expect(installed).toBe(false);
            }
        });

        it('has consistent structure', () => {
            const status = getHooksStatus('/any/path');

            for (const item of status) {
                expect(item).toHaveProperty('hook');
                expect(item).toHaveProperty('installed');
                expect(typeof item.hook).toBe('string');
                expect(typeof item.installed).toBe('boolean');
            }
        });
    });

    // ============================================================================
    // generateCustomHook Tests
    // ============================================================================
    describe('generateCustomHook', () => {
        it('generates valid shell script header', () => {
            const config = { preCommit: true, prePush: false, secretScan: false, licenseScan: false };
            const hook = generateCustomHook(config);

            expect(hook).toMatch(/^#!/);
            expect(hook).toContain('#!/bin/sh');
        });

        it('includes RepoHygiene marker', () => {
            const config = { preCommit: true, prePush: false, secretScan: false, licenseScan: false };
            const hook = generateCustomHook(config);

            expect(hook).toContain('RepoHygiene');
        });

        it('includes secret scan when enabled', () => {
            const config = { preCommit: true, prePush: false, secretScan: true, licenseScan: false };
            const hook = generateCustomHook(config);

            expect(hook).toContain('repohygiene secrets');
        });

        it('excludes secret scan when disabled', () => {
            const config = { preCommit: true, prePush: false, secretScan: false, licenseScan: false };
            const hook = generateCustomHook(config);

            expect(hook).not.toContain('repohygiene secrets');
        });

        it('includes license scan when enabled', () => {
            const config = { preCommit: true, prePush: false, secretScan: false, licenseScan: true };
            const hook = generateCustomHook(config);

            expect(hook).toContain('repohygiene licenses');
        });

        it('excludes license scan when disabled', () => {
            const config = { preCommit: true, prePush: false, secretScan: false, licenseScan: false };
            const hook = generateCustomHook(config);

            expect(hook).not.toContain('repohygiene licenses');
        });

        it('includes both scans when both enabled', () => {
            const config = { preCommit: true, prePush: false, secretScan: true, licenseScan: true };
            const hook = generateCustomHook(config);

            expect(hook).toContain('repohygiene secrets');
            expect(hook).toContain('repohygiene licenses');
        });

        it('generates exit code checks', () => {
            const config = { preCommit: true, prePush: false, secretScan: true, licenseScan: false };
            const hook = generateCustomHook(config);

            expect(hook).toContain('exit 1');
            expect(hook).toContain('exit 0');
        });

        it('includes success message', () => {
            const config = { preCommit: true, prePush: false, secretScan: false, licenseScan: false };
            const hook = generateCustomHook(config);

            expect(hook).toContain('All checks passed');
        });

        it('includes progress message', () => {
            const config = { preCommit: true, prePush: false, secretScan: true, licenseScan: true };
            const hook = generateCustomHook(config);

            expect(hook).toContain('Running checks');
        });
    });

    // ============================================================================
    // Hook Content Tests
    // ============================================================================
    describe('Hook Content Format', () => {
        it('generates Unix-compatible line endings', () => {
            const config = { preCommit: true, prePush: false, secretScan: true, licenseScan: true };
            const hook = generateCustomHook(config);

            // Should use \n not \r\n
            expect(hook).not.toContain('\r\n');
        });

        it('uses npx for running commands', () => {
            const config = { preCommit: true, prePush: false, secretScan: true, licenseScan: true };
            const hook = generateCustomHook(config);

            expect(hook).toContain('npx repohygiene');
        });

        it('handles empty config gracefully', () => {
            const config = { preCommit: false, prePush: false, secretScan: false, licenseScan: false };
            const hook = generateCustomHook(config);

            // Should still generate a valid script
            expect(hook).toContain('#!/bin/sh');
            expect(hook).toContain('exit 0');
        });
    });
});
