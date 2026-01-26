/**
 * RepoHygiene - Branch Analyzer Tests
 */

import { describe, it, expect } from 'vitest';
import { getBranchSummary } from '../../src/modules/branches/analyzer.js';
import type { BranchInfo } from '../../src/types/index.js';

describe('getBranchSummary', () => {
    const mockBranches: BranchInfo[] = [
        {
            name: 'feature/old',
            isRemote: false,
            isMerged: true,
            lastCommitDate: new Date('2023-01-01'),
            lastCommitAuthor: 'John',
            lastCommitMessage: 'old commit',
            daysSinceLastCommit: 365,
            isStale: true,
            isProtected: false,
        },
        {
            name: 'main',
            isRemote: false,
            isMerged: false,
            lastCommitDate: new Date(),
            lastCommitAuthor: 'Jane',
            lastCommitMessage: 'recent commit',
            daysSinceLastCommit: 1,
            isStale: false,
            isProtected: true,
        },
        {
            name: 'feature/new',
            isRemote: false,
            isMerged: false,
            lastCommitDate: new Date(),
            lastCommitAuthor: 'Bob',
            lastCommitMessage: 'new feature',
            daysSinceLastCommit: 5,
            isStale: false,
            isProtected: false,
        },
    ];

    it('counts total branches', () => {
        const summary = getBranchSummary(mockBranches);
        expect(summary.total).toBe(3);
    });

    it('counts stale branches', () => {
        const summary = getBranchSummary(mockBranches);
        expect(summary.stale).toBe(1);
    });

    it('counts merged branches', () => {
        const summary = getBranchSummary(mockBranches);
        expect(summary.merged).toBe(1);
    });

    it('counts protected branches', () => {
        const summary = getBranchSummary(mockBranches);
        expect(summary.protected).toBe(1);
    });

    it('handles empty array', () => {
        const summary = getBranchSummary([]);
        expect(summary.total).toBe(0);
        expect(summary.stale).toBe(0);
        expect(summary.merged).toBe(0);
        expect(summary.protected).toBe(0);
    });
});
