/**
 * RepoHygiene - Modules Index
 * Export all scanner modules
 */

// CODEOWNERS module
export {
  CodeownersScanner,
  createCodeownersScanner,
  analyzeOwnership,
  generateCodeowners,
  validateCodeowners,
} from './codeowners/index.js';

// License module
export {
  LicenseAuditor,
  createLicenseAuditor,
  scanLicenses,
  generateLicenseSummary,
  generateMarkdownReport,
} from './licenses/index.js';

// Secrets module
export {
  SecretsAuditor,
  createSecretsAuditor,
  SECRET_PATTERNS,
  scanFilesForSecrets,
  calculateEntropy,
} from './secrets/index.js';

// Branches module
export {
  BranchesScanner,
  createBranchesScanner,
  analyzeBranches,
  deleteBranches,
} from './branches/index.js';
