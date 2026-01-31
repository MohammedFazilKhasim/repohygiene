/**
 * RepoHygiene - Git Hooks Integration
 * Install and manage pre-commit hooks for automated scanning
 */

import * as fs from 'fs';
import * as path from 'path';

const HOOK_TEMPLATE = `#!/bin/sh
# RepoHygiene pre-commit hook
# Automatically scans for secrets before commit

echo "🧹 RepoHygiene: Running pre-commit checks..."

# Run secret scan
npx repohygiene secrets --staged-only

# Check exit code
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ RepoHygiene found issues. Please fix them before committing."
  echo "   Run 'repohygiene secrets' for details."
  echo ""
  exit 1
fi

echo "✅ RepoHygiene: All checks passed!"
exit 0
`;

const PRE_PUSH_TEMPLATE = `#!/bin/sh
# RepoHygiene pre-push hook
# Runs full scan before pushing

echo "🧹 RepoHygiene: Running pre-push checks..."

# Run license scan
npx repohygiene licenses --fail-on-denied

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ RepoHygiene found license issues."
  exit 1
fi

echo "✅ RepoHygiene: All checks passed!"
exit 0
`;

export interface HookConfig {
  preCommit: boolean;
  prePush: boolean;
  secretScan: boolean;
  licenseScan: boolean;
}

/**
 * Get the git hooks directory path
 */
export function getHooksDir(repoPath: string): string {
  return path.join(repoPath, '.git', 'hooks');
}

/**
 * Check if a hook is installed
 */
export function isHookInstalled(repoPath: string, hookName: string): boolean {
  const hookPath = path.join(getHooksDir(repoPath), hookName);
  if (!fs.existsSync(hookPath)) {
    return false;
  }
  const content = fs.readFileSync(hookPath, 'utf-8');
  return content.includes('RepoHygiene');
}

/**
 * Install a git hook
 */
export function installHook(
  repoPath: string,
  hookName: string,
  content: string
): { success: boolean; message: string } {
  const hooksDir = getHooksDir(repoPath);
  const hookPath = path.join(hooksDir, hookName);

  // Check if .git directory exists
  if (!fs.existsSync(path.join(repoPath, '.git'))) {
    return { success: false, message: 'Not a git repository' };
  }

  // Create hooks directory if it doesn't exist
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  // Check if hook already exists
  if (fs.existsSync(hookPath)) {
    const existingContent = fs.readFileSync(hookPath, 'utf-8');
    if (existingContent.includes('RepoHygiene')) {
      return { success: true, message: `${hookName} hook already installed` };
    }
    // Backup existing hook
    const backupPath = `${hookPath}.backup`;
    fs.copyFileSync(hookPath, backupPath);
  }

  // Write hook
  fs.writeFileSync(hookPath, content, { mode: 0o755 });

  return { success: true, message: `${hookName} hook installed successfully` };
}

/**
 * Uninstall a git hook
 */
export function uninstallHook(
  repoPath: string,
  hookName: string
): { success: boolean; message: string } {
  const hookPath = path.join(getHooksDir(repoPath), hookName);

  if (!fs.existsSync(hookPath)) {
    return { success: true, message: `${hookName} hook not found` };
  }

  const content = fs.readFileSync(hookPath, 'utf-8');
  if (!content.includes('RepoHygiene')) {
    return { success: false, message: `${hookName} hook was not installed by RepoHygiene` };
  }

  // Check for backup
  const backupPath = `${hookPath}.backup`;
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, hookPath);
    fs.unlinkSync(backupPath);
    return { success: true, message: `${hookName} hook restored from backup` };
  }

  fs.unlinkSync(hookPath);
  return { success: true, message: `${hookName} hook uninstalled` };
}

/**
 * Install all recommended hooks
 */
export function installAllHooks(
  repoPath: string
): Array<{ hook: string; result: { success: boolean; message: string } }> {
  const results = [];

  results.push({
    hook: 'pre-commit',
    result: installHook(repoPath, 'pre-commit', HOOK_TEMPLATE),
  });

  results.push({
    hook: 'pre-push',
    result: installHook(repoPath, 'pre-push', PRE_PUSH_TEMPLATE),
  });

  return results;
}

/**
 * Uninstall all hooks
 */
export function uninstallAllHooks(
  repoPath: string
): Array<{ hook: string; result: { success: boolean; message: string } }> {
  const results = [];

  results.push({
    hook: 'pre-commit',
    result: uninstallHook(repoPath, 'pre-commit'),
  });

  results.push({
    hook: 'pre-push',
    result: uninstallHook(repoPath, 'pre-push'),
  });

  return results;
}

/**
 * Get status of all hooks
 */
export function getHooksStatus(repoPath: string): Array<{ hook: string; installed: boolean }> {
  return [
    { hook: 'pre-commit', installed: isHookInstalled(repoPath, 'pre-commit') },
    { hook: 'pre-push', installed: isHookInstalled(repoPath, 'pre-push') },
  ];
}

/**
 * Generate custom hook content
 */
export function generateCustomHook(config: HookConfig): string {
  const lines: string[] = ['#!/bin/sh', '# RepoHygiene custom hook', ''];

  lines.push('echo "🧹 RepoHygiene: Running checks..."');
  lines.push('');

  if (config.secretScan) {
    lines.push('# Secret scan');
    lines.push('npx repohygiene secrets');
    lines.push('if [ $? -ne 0 ]; then exit 1; fi');
    lines.push('');
  }

  if (config.licenseScan) {
    lines.push('# License scan');
    lines.push('npx repohygiene licenses');
    lines.push('if [ $? -ne 0 ]; then exit 1; fi');
    lines.push('');
  }

  lines.push('echo "✅ RepoHygiene: All checks passed!"');
  lines.push('exit 0');

  return lines.join('\n');
}
