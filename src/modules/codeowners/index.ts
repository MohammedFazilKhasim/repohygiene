/**
 * RepoHygiene - CODEOWNERS Module Exports
 */

export { analyzeOwnership, emailToUsername } from './analyzer.js';
export {
  generateCodeowners,
  parseCodeowners,
  compareCodeowners,
  type GeneratorOptions,
  type CodeownersConflict,
} from './generator.js';
export { validateCodeowners, getCodeownersPath, type ValidationResult } from './validator.js';
export { CodeownersScanner, createCodeownersScanner } from './scanner.js';
