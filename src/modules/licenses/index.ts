/**
 * RepoHygiene - License Module Exports
 */

export { scanLicenses, parseSpdxExpression } from './scanner.js';
export {
  DEFAULT_POLICY,
  isLicenseAllowed,
  isLicenseDenied,
  generateLicenseSummary,
  shouldFail,
  groupByLicense,
  type LicensePolicy,
} from './policy.js';
export { generateMarkdownReport, generateCsvReport, generateNoticeFile } from './reporter.js';
export { LicenseAuditor, createLicenseAuditor } from './auditor.js';
