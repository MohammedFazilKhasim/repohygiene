/**
 * RepoHygiene - Secrets Module Exports
 */

export { SECRET_PATTERNS, getPatternsBySeverity, type SecretPattern } from './patterns.js';
export { calculateEntropy, isHighEntropy, findHighEntropyStrings, maskSecret } from './entropy.js';
export { scanFilesForSecrets, type FileScanOptions } from './scanner.js';
export { SecretsAuditor, createSecretsAuditor } from './auditor.js';
