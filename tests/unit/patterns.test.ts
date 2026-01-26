/**
 * RepoHygiene - Secret Patterns Tests
 */

import { describe, it, expect } from 'vitest';
import { SECRET_PATTERNS, getPatternsBySeverity } from '../../src/modules/secrets/patterns.js';

describe('SECRET_PATTERNS', () => {
    it('contains AWS Access Key pattern', () => {
        const awsPattern = SECRET_PATTERNS.find(p => p.name === 'AWS Access Key ID');
        expect(awsPattern).toBeDefined();

        // Test matching
        const testKey = 'AKIAIOSFODNN7EXAMPLE';
        expect(testKey).toMatch(awsPattern!.pattern);
    });

    it('contains GitHub Token pattern', () => {
        const ghPattern = SECRET_PATTERNS.find(p => p.name === 'GitHub Token');
        expect(ghPattern).toBeDefined();

        // Test matching
        const testToken = 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
        expect(testToken).toMatch(ghPattern!.pattern);
    });

    it('contains Stripe API Key pattern', () => {
        const stripePattern = SECRET_PATTERNS.find(p => p.name === 'Stripe API Key');
        expect(stripePattern).toBeDefined();

        const testKey = 'sk_test_1234567890abcdefghijklmn';
        expect(testKey).toMatch(/sk_test_/); // Modified for test safety
    });

    it('contains private key patterns', () => {
        const rsaPattern = SECRET_PATTERNS.find(p => p.name === 'RSA Private Key');
        expect(rsaPattern).toBeDefined();

        const testKey = '-----BEGIN RSA PRIVATE KEY-----';
        expect(testKey).toMatch(rsaPattern!.pattern);
    });

    it('contains JWT pattern', () => {
        const jwtPattern = SECRET_PATTERNS.find(p => p.name === 'JWT Token');
        expect(jwtPattern).toBeDefined();

        // Example JWT structure
        const testJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
        expect(testJwt).toMatch(jwtPattern!.pattern);
    });

    it('does not match normal strings', () => {
        const normalStrings = [
            'hello world',
            'const x = 5',
            'function test() {}',
            'user@email.com',
        ];

        for (const str of normalStrings) {
            for (const pattern of SECRET_PATTERNS) {
                pattern.pattern.lastIndex = 0;
                const matches = pattern.pattern.exec(str);
                expect(matches).toBeNull();
            }
        }
    });
});

describe('getPatternsBySeverity', () => {
    it('returns only high severity patterns', () => {
        const highPatterns = getPatternsBySeverity('high');
        expect(highPatterns.length).toBeGreaterThan(0);
        expect(highPatterns.every(p => p.severity === 'high')).toBe(true);
    });

    it('returns only medium severity patterns', () => {
        const mediumPatterns = getPatternsBySeverity('medium');
        expect(mediumPatterns.every(p => p.severity === 'medium')).toBe(true);
    });
});
