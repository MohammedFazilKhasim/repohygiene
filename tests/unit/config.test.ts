/**
 * RepoHygiene - Configuration Tests
 */

import { describe, it, expect } from 'vitest';
import { DEFAULT_CONFIG } from '../../src/core/config.js';

describe('DEFAULT_CONFIG', () => {
    it('has exclude array', () => {
        expect(DEFAULT_CONFIG.exclude).toBeDefined();
        expect(Array.isArray(DEFAULT_CONFIG.exclude)).toBe(true);
        expect(DEFAULT_CONFIG.exclude).toContain('node_modules');
    });

    it('has codeowners config', () => {
        expect(DEFAULT_CONFIG.codeowners).toBeDefined();
        expect(DEFAULT_CONFIG.codeowners?.threshold).toBe(10);
        expect(DEFAULT_CONFIG.codeowners?.output).toBe('.github/CODEOWNERS');
    });

    it('has licenses config with sensible defaults', () => {
        expect(DEFAULT_CONFIG.licenses).toBeDefined();
        expect(DEFAULT_CONFIG.licenses?.allow).toContain('MIT');
        expect(DEFAULT_CONFIG.licenses?.deny).toContain('GPL-3.0');
        expect(DEFAULT_CONFIG.licenses?.failOn).toBe('restricted');
    });

    it('has secrets config', () => {
        expect(DEFAULT_CONFIG.secrets).toBeDefined();
        expect(DEFAULT_CONFIG.secrets?.scanHistory).toBe(false);
        expect(DEFAULT_CONFIG.secrets?.entropyThreshold).toBe(4.5);
    });

    it('has branches config', () => {
        expect(DEFAULT_CONFIG.branches).toBeDefined();
        expect(DEFAULT_CONFIG.branches?.staleDays).toBe(90);
        expect(DEFAULT_CONFIG.branches?.exclude).toContain('main');
        expect(DEFAULT_CONFIG.branches?.exclude).toContain('master');
    });

    it('has deps config', () => {
        expect(DEFAULT_CONFIG.deps).toBeDefined();
        expect(DEFAULT_CONFIG.deps?.outdated).toBe(true);
        expect(DEFAULT_CONFIG.deps?.duplicates).toBe(true);
    });
});
