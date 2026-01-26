/**
 * RepoHygiene - Secrets File Scanner
 * Scans files for secrets using patterns and entropy
 */

import { readFile } from 'fs/promises';
import { globby } from 'globby';
import type { SecretFinding } from '../../types/index.js';
import { SECRET_PATTERNS, type SecretPattern } from './patterns.js';
import { findHighEntropyStrings, maskSecret } from './entropy.js';

export interface FileScanOptions {
    readonly cwd: string;
    readonly include?: readonly string[];
    readonly exclude?: readonly string[];
    readonly entropyThreshold?: number;
    readonly patterns?: readonly SecretPattern[];
}

const DEFAULT_EXCLUDES = [
    'node_modules/**',
    'dist/**',
    'build/**',
    '.git/**',
    'coverage/**',
    '*.min.js',
    '*.min.css',
    '*.map',
    '*.lock',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '*.png',
    '*.jpg',
    '*.jpeg',
    '*.gif',
    '*.svg',
    '*.ico',
    '*.woff',
    '*.woff2',
    '*.ttf',
    '*.eot',
];

const DEFAULT_INCLUDES = [
    '**/*.js',
    '**/*.ts',
    '**/*.jsx',
    '**/*.tsx',
    '**/*.json',
    '**/*.yaml',
    '**/*.yml',
    '**/*.env*',
    '**/*.config.*',
    '**/*.toml',
    '**/*.ini',
    '**/*.conf',
    '**/*.sh',
    '**/*.bash',
    '**/*.py',
    '**/*.rb',
    '**/*.go',
    '**/*.java',
    '**/*.properties',
    '**/*.xml',
];

/**
 * Scan files for secrets
 */
export async function scanFilesForSecrets(
    options: FileScanOptions
): Promise<{ findings: SecretFinding[]; scannedFiles: number }> {
    const {
        cwd,
        include = DEFAULT_INCLUDES,
        exclude = DEFAULT_EXCLUDES,
        entropyThreshold = 4.5,
        patterns = SECRET_PATTERNS,
    } = options;

    // Find files to scan
    const files = await globby(include as string[], {
        cwd,
        ignore: exclude as string[],
        absolute: true,
    });

    const findings: SecretFinding[] = [];

    for (const filePath of files) {
        try {
            const content = await readFile(filePath, 'utf-8');
            const fileFindings = scanContent(content, filePath, patterns, entropyThreshold);
            findings.push(...fileFindings);
        } catch {
            // Skip unreadable files (binary, permissions, etc.)
        }
    }

    return { findings, scannedFiles: files.length };
}

/**
 * Scan content for secrets
 */
function scanContent(
    content: string,
    filePath: string,
    patterns: readonly SecretPattern[],
    entropyThreshold: number
): SecretFinding[] {
    const findings: SecretFinding[] = [];
    const lines = content.split('\n');

    // Pattern-based detection
    for (const pattern of patterns) {
        // Reset regex state
        pattern.pattern.lastIndex = 0;

        let match;
        while ((match = pattern.pattern.exec(content)) !== null) {
            const { line, column } = getLineAndColumn(content, match.index);

            // Skip if it looks like a test/example
            const lineContent = lines[line - 1] ?? '';
            if (isLikelyFalsePositive(lineContent, match[0])) {
                continue;
            }

            findings.push({
                type: pattern.name,
                file: filePath,
                line,
                column,
                match: match[0],
                masked: maskSecret(match[0]),
            });
        }
    }

    // Entropy-based detection
    const highEntropyStrings = findHighEntropyStrings(content, entropyThreshold);
    for (const { value, entropy, position } of highEntropyStrings) {
        const { line, column } = getLineAndColumn(content, position);

        const lineContent = lines[line - 1] ?? '';
        if (isLikelyFalsePositive(lineContent, value)) {
            continue;
        }

        // Avoid duplicates with pattern matches
        const isDuplicate = findings.some(
            (f) => f.line === line && f.match.includes(value)
        );
        if (isDuplicate) continue;

        findings.push({
            type: 'High Entropy String',
            file: filePath,
            line,
            column,
            match: value,
            masked: maskSecret(value),
            entropy,
        });
    }

    return findings;
}

/**
 * Get line and column from string position
 */
function getLineAndColumn(
    content: string,
    position: number
): { line: number; column: number } {
    const lines = content.slice(0, position).split('\n');
    const line = lines.length;
    const column = (lines[lines.length - 1]?.length ?? 0) + 1;
    return { line, column };
}

/**
 * Check if a match is likely a false positive
 */
function isLikelyFalsePositive(lineContent: string, match: string): boolean {
    const lowerLine = lineContent.toLowerCase();

    // Skip comments
    if (lowerLine.trim().startsWith('//') || lowerLine.trim().startsWith('#')) {
        // But not if it looks like a real secret in a comment
        if (!lowerLine.includes('key') && !lowerLine.includes('secret')) {
            return true;
        }
    }

    // Skip test/example patterns
    const testPatterns = [
        'example',
        'sample',
        'test',
        'mock',
        'fake',
        'dummy',
        'placeholder',
        'your_',
        'xxx',
        '<your',
        'INSERT',
        'REPLACE',
        'TODO',
        'FIXME',
    ];

    for (const pattern of testPatterns) {
        if (lowerLine.includes(pattern)) {
            return true;
        }
    }

    // Skip if match is all same character
    if (new Set(match).size < 3) {
        return true;
    }

    return false;
}
