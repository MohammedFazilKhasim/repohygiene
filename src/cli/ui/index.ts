/**
 * RepoHygiene - UI Module Exports
 */

export {
  createSpinner,
  withSpinner,
  STATUS_ICONS,
  moduleSpinner,
  ProgressSpinner,
  type SpinnerOptions,
} from './spinner.js';

export {
  createIssueTable,
  createSummaryTable,
  createKeyValueTable,
  createLicenseTable,
  createBranchTable,
} from './table.js';

export {
  printHeader,
  printSection,
  printSummary,
  printModuleIssues,
  printSuccess,
  printError,
  printWarning,
  printInfo,
  printHelpfulError,
  formatJson,
  formatSarif,
} from './report.js';
