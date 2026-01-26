/**
 * RepoHygiene - CODEOWNERS Validator
 * Validates existing CODEOWNERS file
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Issue } from '../../types/index.js';
import type { GitContext } from '../../core/git.js';

const CODEOWNERS_PATHS = ['.github/CODEOWNERS', 'CODEOWNERS', 'docs/CODEOWNERS'];

export interface ValidationResult {
  readonly isValid: boolean;
  readonly filePath: string | null;
  readonly content: string | null;
  readonly issues: Issue[];
}

/**
 * Find and validate CODEOWNERS file
 */
export async function validateCodeowners(gitContext: GitContext): Promise<ValidationResult> {
  const issues: Issue[] = [];
  let filePath: string | null = null;
  let content: string | null = null;

  // Find CODEOWNERS file
  for (const path of CODEOWNERS_PATHS) {
    const fullPath = join(gitContext.rootDir, path);
    if (existsSync(fullPath)) {
      filePath = path;
      try {
        content = await readFile(fullPath, 'utf-8');
      } catch (error) {
        issues.push({
          id: 'codeowners-read-error',
          severity: 'error',
          message: `Could not read CODEOWNERS file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          file: path,
          rule: 'file-readable',
        });
      }
      break;
    }
  }

  if (filePath === null) {
    issues.push({
      id: 'codeowners-missing',
      severity: 'warning',
      message: 'No CODEOWNERS file found',
      suggestion: 'Run `repohygiene codeowners --generate` to create one',
      rule: 'file-exists',
    });

    return { isValid: false, filePath: null, content: null, issues };
  }

  if (content !== null && filePath !== null) {
    // Validate content
    const contentIssues = validateContent(content, filePath);
    issues.push(...contentIssues);
  }

  return {
    isValid: issues.every((i) => i.severity !== 'error'),
    filePath,
    content,
    issues,
  };
}

/**
 * Validate CODEOWNERS file content
 */
function validateContent(content: string, filePath: string): Issue[] {
  const issues: Issue[] = [];
  const lines = content.split('\n');
  const seenPaths = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i]?.trim() ?? '';

    // Skip empty lines and comments
    if (line === '' || line.startsWith('#')) {
      continue;
    }

    // Parse line
    const parts = line.split(/\s+/);
    const path = parts[0];
    const owners = parts.slice(1);

    if (path === undefined || path === '') {
      continue;
    }

    // Check for duplicate paths
    if (seenPaths.has(path)) {
      issues.push({
        id: `codeowners-duplicate-${lineNum}`,
        severity: 'warning',
        message: `Duplicate path: ${path}`,
        file: filePath,
        line: lineNum,
        rule: 'no-duplicates',
      });
    }
    seenPaths.add(path);

    // Check for missing owners
    if (owners.length === 0) {
      issues.push({
        id: `codeowners-no-owners-${lineNum}`,
        severity: 'error',
        message: `Path has no owners: ${path}`,
        file: filePath,
        line: lineNum,
        rule: 'has-owners',
      });
      continue;
    }

    // Validate owner format
    for (const owner of owners) {
      if (!isValidOwner(owner)) {
        issues.push({
          id: `codeowners-invalid-owner-${lineNum}`,
          severity: 'error',
          message: `Invalid owner format: ${owner} (expected @username, @org/team, or email)`,
          file: filePath,
          line: lineNum,
          rule: 'valid-owner',
        });
      }
    }

    // Check for overly broad patterns
    if (path === '*' || path === '/*') {
      issues.push({
        id: `codeowners-broad-pattern-${lineNum}`,
        severity: 'info',
        message: 'Catch-all pattern found - ensure this is intentional',
        file: filePath,
        line: lineNum,
        rule: 'specific-patterns',
      });
    }
  }

  return issues;
}

/**
 * Check if owner string is valid
 */
function isValidOwner(owner: string): boolean {
  // @username
  if (/^@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(owner)) {
    return true;
  }

  // @org/team
  if (/^@[a-zA-Z0-9-]+\/[a-zA-Z0-9_-]+$/.test(owner)) {
    return true;
  }

  // email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner)) {
    return true;
  }

  return false;
}

/**
 * Get the default CODEOWNERS path
 */
export function getCodeownersPath(gitContext: GitContext): string {
  // Check if .github directory exists
  const githubDir = join(gitContext.rootDir, '.github');
  if (existsSync(githubDir)) {
    return '.github/CODEOWNERS';
  }

  return 'CODEOWNERS';
}
