/**
 * RepoHygiene - CLI Spinner Utilities
 * Beautiful loading states using ora
 */

import ora, { type Ora } from 'ora';
import chalk from 'chalk';

export interface SpinnerOptions {
    readonly text: string;
    readonly color?: 'cyan' | 'green' | 'yellow' | 'red' | 'magenta' | 'blue';
}

/**
 * Create a spinner with consistent styling
 */
export function createSpinner(options: SpinnerOptions): Ora {
    return ora({
        text: options.text,
        color: options.color ?? 'cyan',
        spinner: 'dots',
    });
}

/**
 * Run an async operation with a spinner
 */
export async function withSpinner<T>(
    text: string,
    operation: () => Promise<T>,
    options?: {
        successText?: string;
        failText?: string;
    }
): Promise<T> {
    const spinner = createSpinner({ text });
    spinner.start();

    try {
        const result = await operation();
        spinner.succeed(options?.successText ?? chalk.green('Done'));
        return result;
    } catch (error) {
        spinner.fail(options?.failText ?? chalk.red('Failed'));
        throw error;
    }
}

/**
 * Status indicators for scan results
 */
export const STATUS_ICONS = {
    passed: chalk.green('✓'),
    warning: chalk.yellow('⚠'),
    failed: chalk.red('✗'),
    skipped: chalk.gray('○'),
    running: chalk.cyan('◌'),
} as const;

/**
 * Module loading indicator
 */
export function moduleSpinner(moduleName: string): Ora {
    return createSpinner({
        text: chalk.dim(`Scanning ${moduleName}...`),
        color: 'cyan',
    });
}

/**
 * Progress indicator for multi-step operations
 */
export class ProgressSpinner {
    private readonly spinner: Ora;
    private currentStep: number = 0;
    private readonly totalSteps: number;

    constructor(totalSteps: number, initialText: string) {
        this.totalSteps = totalSteps;
        this.spinner = createSpinner({ text: this.formatText(initialText) });
    }

    private formatText(text: string): string {
        return `[${this.currentStep}/${this.totalSteps}] ${text}`;
    }

    start(): void {
        this.spinner.start();
    }

    nextStep(text: string): void {
        this.currentStep++;
        this.spinner.text = this.formatText(text);
    }

    succeed(text?: string): void {
        this.spinner.succeed(text);
    }

    fail(text?: string): void {
        this.spinner.fail(text);
    }
}
