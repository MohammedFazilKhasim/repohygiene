/**
 * RepoHygiene - Base Scanner
 * Abstract base class for all scanning modules
 */

import type {
  ScanResult,
  Issue,
  ModuleName,
  SeverityLevel,
  RepoHygieneConfig,
  BaseModuleOptions,
} from '../types/index.js';
import type { GitContext } from './git.js';

export abstract class BaseScanner<TOptions extends BaseModuleOptions, TData> {
  protected readonly name: ModuleName;
  protected readonly gitContext: GitContext;
  protected readonly config: RepoHygieneConfig;
  protected readonly options: TOptions;
  protected issues: Issue[] = [];

  constructor(
    name: ModuleName,
    gitContext: GitContext,
    config: RepoHygieneConfig,
    options: TOptions
  ) {
    this.name = name;
    this.gitContext = gitContext;
    this.config = config;
    this.options = options;
  }

  /**
   * Main scan method - to be implemented by each module
   */
  abstract scan(): Promise<TData>;

  /**
   * Execute the scan and return structured result
   */
  async execute(): Promise<ScanResult<TData>> {
    const startTime = Date.now();
    this.issues = [];

    try {
      const data = await this.scan();
      const duration = Date.now() - startTime;

      return {
        module: this.name,
        status: this.determineStatus(),
        issues: this.issues,
        data,
        duration,
        timestamp: new Date(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      this.addIssue({
        severity: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        rule: 'scanner-error',
      });

      return {
        module: this.name,
        status: 'failed',
        issues: this.issues,
        duration,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Add an issue to the results
   */
  protected addIssue(issue: Omit<Issue, 'id'>): void {
    this.issues.push({
      id: `${this.name}-${this.issues.length + 1}`,
      ...issue,
    });
  }

  /**
   * Determine overall status based on issues
   */
  protected determineStatus(): 'passed' | 'warning' | 'failed' {
    const hasErrors = this.issues.some((i) => i.severity === 'error');
    const hasWarnings = this.issues.some((i) => i.severity === 'warning');

    if (hasErrors) return 'failed';
    if (hasWarnings) return 'warning';
    return 'passed';
  }

  /**
   * Log verbose message if verbose mode is enabled
   */
  protected log(message: string): void {
    if (this.options.verbose === true) {
      // Will be replaced with proper logger
      // eslint-disable-next-line no-console
      console.log(`[${this.name}] ${message}`);
    }
  }
}

/**
 * Create a simple issue helper
 */
export function createIssue(
  severity: SeverityLevel,
  message: string,
  options?: Partial<Omit<Issue, 'id' | 'severity' | 'message'>>
): Omit<Issue, 'id'> {
  return {
    severity,
    message,
    ...options,
  };
}
