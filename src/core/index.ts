/**
 * RepoHygiene - Core Module Exports
 */

export { loadConfig, DEFAULT_CONFIG, type LoadConfigResult } from './config.js';
export {
  initGitContext,
  getCommitLog,
  getBranches,
  getMergedBranches,
  getBranchLastCommit,
  getContributionStats,
  isTracked,
  getCurrentBranch,
  getDefaultBranch,
  type GitContext,
  type CommitInfo,
  type BlameInfo,
} from './git.js';
export { BaseScanner, createIssue } from './scanner.js';
