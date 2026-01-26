/**
 * RepoHygiene - Main Library Entry Point
 * Export public API for programmatic usage
 */

// Types
export type * from './types/index.js';

// Core utilities
export {
    loadConfig,
    DEFAULT_CONFIG,
    type LoadConfigResult,
} from './core/config.js';

export {
    initGitContext,
    getCommitLog,
    getBranches,
    getMergedBranches,
    getBranchLastCommit,
    getContributionStats,
    getCurrentBranch,
    getDefaultBranch,
    type GitContext,
    type CommitInfo,
} from './core/git.js';

export { BaseScanner, createIssue } from './core/scanner.js';
