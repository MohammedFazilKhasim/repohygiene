/**
 * RepoHygiene - License Policy Tests
 */

import { describe, it, expect } from 'vitest';
import {
    isLicenseAllowed,
    isLicenseDenied,
    generateLicenseSummary,
    shouldFail,
    DEFAULT_POLICY,
    type LicensePolicy,
} from '../../src/modules/licenses/policy.js';
import type { DependencyLicense } from '../../src/types/index.js';

describe('isLicenseAllowed', () => {
    it('returns true for MIT license', () => {
        expect(isLicenseAllowed('MIT', DEFAULT_POLICY)).toBe(true);
    });

    it('returns true for Apache-2.0 license', () => {
        expect(isLicenseAllowed('Apache-2.0', DEFAULT_POLICY)).toBe(true);
    });

    it('returns true for BSD licenses', () => {
        expect(isLicenseAllowed('BSD-3-Clause', DEFAULT_POLICY)).toBe(true);
        expect(isLicenseAllowed('BSD-2-Clause', DEFAULT_POLICY)).toBe(true);
    });

    it('returns false for GPL licenses', () => {
        expect(isLicenseAllowed('GPL-3.0', DEFAULT_POLICY)).toBe(false);
    });

    it('is case insensitive', () => {
        expect(isLicenseAllowed('mit', DEFAULT_POLICY)).toBe(true);
        expect(isLicenseAllowed('MIT', DEFAULT_POLICY)).toBe(true);
        expect(isLicenseAllowed('Mit', DEFAULT_POLICY)).toBe(true);
    });
});

describe('isLicenseDenied', () => {
    it('returns true for GPL-3.0', () => {
        expect(isLicenseDenied('GPL-3.0', DEFAULT_POLICY)).toBe(true);
    });

    it('returns true for AGPL-3.0', () => {
        expect(isLicenseDenied('AGPL-3.0', DEFAULT_POLICY)).toBe(true);
    });

    it('returns false for MIT', () => {
        expect(isLicenseDenied('MIT', DEFAULT_POLICY)).toBe(false);
    });

    it('is case insensitive', () => {
        expect(isLicenseDenied('gpl-3.0', DEFAULT_POLICY)).toBe(true);
    });
});

describe('generateLicenseSummary', () => {
    const mockLicenses: DependencyLicense[] = [
        { name: 'pkg1', version: '1.0.0', license: 'MIT', isProduction: true, status: 'allowed' },
        { name: 'pkg2', version: '1.0.0', license: 'GPL-3.0', isProduction: true, status: 'denied' },
        { name: 'pkg3', version: '1.0.0', license: 'UNKNOWN', isProduction: true, status: 'unknown' },
        { name: 'pkg4', version: '1.0.0', license: 'Apache-2.0', isProduction: true, status: 'allowed' },
    ];

    it('counts total correctly', () => {
        const summary = generateLicenseSummary(mockLicenses);
        expect(summary.total).toBe(4);
    });

    it('counts allowed correctly', () => {
        const summary = generateLicenseSummary(mockLicenses);
        expect(summary.allowed).toBe(2);
    });

    it('counts denied correctly', () => {
        const summary = generateLicenseSummary(mockLicenses);
        expect(summary.denied).toBe(1);
    });

    it('counts unknown correctly', () => {
        const summary = generateLicenseSummary(mockLicenses);
        expect(summary.unknown).toBe(1);
    });
});

describe('shouldFail', () => {
    it('returns true when denied > 0 and failOn is restricted', () => {
        const policy: LicensePolicy = { ...DEFAULT_POLICY, failOn: 'restricted' };
        expect(shouldFail({ total: 10, allowed: 8, denied: 1, unknown: 1 }, policy)).toBe(true);
    });

    it('returns false when denied = 0 and failOn is restricted', () => {
        const policy: LicensePolicy = { ...DEFAULT_POLICY, failOn: 'restricted' };
        expect(shouldFail({ total: 10, allowed: 9, denied: 0, unknown: 1 }, policy)).toBe(false);
    });

    it('returns true when unknown > 0 and failOn is any', () => {
        const policy: LicensePolicy = { ...DEFAULT_POLICY, failOn: 'any' };
        expect(shouldFail({ total: 10, allowed: 9, denied: 0, unknown: 1 }, policy)).toBe(true);
    });
});
