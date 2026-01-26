/**
 * RepoHygiene - Core Types
 * Shared type definitions used across all modules
 */

// ============================================================================
// Result Types
// ============================================================================

export type SeverityLevel = 'error' | 'warning' | 'info' | 'success';

export interface Issue {
    readonly id: string;
    readonly severity: SeverityLevel;
    readonly message: string;
    readonly file?: string;
    readonly line?: number;
    readonly column?: number;
    readonly rule?: string;
    readonly suggestion?: string;
}

export interface ScanResult<T = unknown> {
    readonly module: ModuleName;
    readonly status: 'passed' | 'warning' | 'failed' | 'skipped';
    readonly issues: readonly Issue[];
    readonly data?: T;
    readonly duration: number;
    readonly timestamp: Date;
}

// ============================================================================
// Module Types
// ============================================================================

export type ModuleName =
    | 'codeowners'
    | 'licenses'
    | 'secrets'
    | 'branches'
    | 'deps';

export interface ModuleConfig {
    readonly enabled: boolean;
    readonly options: Record<string, unknown>;
}

export interface BaseModuleOptions {
    readonly verbose?: boolean;
    readonly json?: boolean;
}

// ============================================================================
// CODEOWNERS Module
// ============================================================================

export interface CodeownersOptions extends BaseModuleOptions {
    readonly threshold?: number;
    readonly since?: string;
    readonly output?: string;
    readonly teamMappings?: Record<string, readonly string[]>;
}

export interface FileOwnership {
    readonly path: string;
    readonly owners: readonly OwnerContribution[];
    readonly suggestedOwner: string;
}

export interface OwnerContribution {
    readonly author: string;
    readonly email: string;
    readonly commits: number;
    readonly linesChanged: number;
    readonly lastCommit: Date;
}

export interface CodeownersData {
    readonly files: readonly FileOwnership[];
    readonly generatedContent: string;
    readonly existingContent?: string;
    readonly conflicts: readonly string[];
}

// ============================================================================
// License Module
// ============================================================================

export interface LicenseOptions extends BaseModuleOptions {
    readonly allow?: readonly string[];
    readonly deny?: readonly string[];
    readonly failOn?: 'unknown' | 'restricted' | 'any';
    readonly production?: boolean;
}

export interface DependencyLicense {
    readonly name: string;
    readonly version: string;
    readonly license: string;
    readonly licenseFile?: string;
    readonly repository?: string;
    readonly isProduction: boolean;
    readonly status: 'allowed' | 'denied' | 'unknown';
}

export interface LicenseData {
    readonly dependencies: readonly DependencyLicense[];
    readonly summary: LicenseSummary;
}

export interface LicenseSummary {
    readonly total: number;
    readonly allowed: number;
    readonly denied: number;
    readonly unknown: number;
}

// ============================================================================
// Secrets Module
// ============================================================================

export interface SecretsOptions extends BaseModuleOptions {
    readonly scanHistory?: boolean;
    readonly entropyThreshold?: number;
    readonly include?: readonly string[];
    readonly exclude?: readonly string[];
}

export interface SecretFinding {
    readonly type: string;
    readonly file: string;
    readonly line: number;
    readonly column: number;
    readonly match: string;
    readonly masked: string;
    readonly entropy?: number;
    readonly commit?: string;
}

export interface SecretsData {
    readonly findings: readonly SecretFinding[];
    readonly scannedFiles: number;
    readonly scannedCommits?: number;
}

// ============================================================================
// Branches Module
// ============================================================================

export interface BranchesOptions extends BaseModuleOptions {
    readonly staleDays?: number;
    readonly exclude?: readonly string[];
    readonly remote?: boolean;
    readonly mergedOnly?: boolean;
    readonly dryRun?: boolean;
}

export interface BranchInfo {
    readonly name: string;
    readonly isRemote: boolean;
    readonly isMerged: boolean;
    readonly lastCommitDate: Date;
    readonly lastCommitAuthor: string;
    readonly lastCommitMessage: string;
    readonly daysSinceLastCommit: number;
    readonly isStale: boolean;
    readonly isProtected: boolean;
}

export interface BranchesData {
    readonly branches: readonly BranchInfo[];
    readonly staleCount: number;
    readonly mergedCount: number;
    readonly protectedCount: number;
}

// ============================================================================
// Dependencies Module
// ============================================================================

export interface DepsOptions extends BaseModuleOptions {
    readonly graph?: boolean;
    readonly outdated?: boolean;
    readonly duplicates?: boolean;
    readonly circular?: boolean;
}

export interface DependencyInfo {
    readonly name: string;
    readonly version: string;
    readonly latestVersion?: string;
    readonly isOutdated: boolean;
    readonly isProduction: boolean;
    readonly dependencies: readonly string[];
}

export interface DepsData {
    readonly dependencies: readonly DependencyInfo[];
    readonly duplicates: readonly DuplicateDependency[];
    readonly circularDeps: readonly string[][];
    readonly outdatedCount: number;
}

export interface DuplicateDependency {
    readonly name: string;
    readonly versions: readonly string[];
}

// ============================================================================
// Configuration
// ============================================================================

export interface RepoHygieneConfig {
    exclude?: string[];
    codeowners?: {
        threshold?: number;
        output?: string;
        teamMappings?: Record<string, string[]>;
    };
    licenses?: {
        allow?: string[];
        deny?: string[];
        failOn?: 'unknown' | 'restricted' | 'any';
        production?: boolean;
    };
    secrets?: {
        scanHistory?: boolean;
        entropyThreshold?: number;
        exclude?: string[];
    };
    branches?: {
        staleDays?: number;
        exclude?: string[];
        remote?: boolean;
        mergedOnly?: boolean;
    };
    deps?: {
        graph?: boolean;
        outdated?: boolean;
        duplicates?: boolean;
        circular?: boolean;
    };
}

// ============================================================================
// CLI Types
// ============================================================================

export type OutputFormat = 'text' | 'json' | 'sarif';

export interface GlobalOptions {
    readonly verbose: boolean;
    readonly json: boolean;
    readonly config?: string;
    readonly cwd?: string;
}
