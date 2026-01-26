/**
 * RepoHygiene - Dependency Analyzer
 * Analyze project dependencies for issues
 */

import { exec } from 'child_process';

// package.json dependencies: simple-git, commander, chalk, ora, cli-table3, boxen, figures, cosmiconfig, globby, ignore.
// No zod.
// I'll use built-in util.promisify.

import { promisify } from 'util';
import type { DependencyInfo, DuplicateDependency, DepsData } from '../../types/index.js';

const execAsync = promisify(exec);

interface NpmOutdatedResult {
    [key: string]: {
        current?: string;
        wanted?: string;
        latest?: string;
        dependent?: string;
        location?: string;
    };
}

interface NpmLsResult {
    name: string;
    version: string;
    dependencies?: Record<string, NpmLsDependency>;
}

interface NpmLsDependency {
    version: string;
    resolved?: string;
    dependencies?: Record<string, NpmLsDependency>;
}

/**
 * Check for outdated packages using npm outdated
 */
export async function checkOutdated(cwd: string): Promise<DependencyInfo[]> {
    try {
        // npm outdated exits with 1 if there are outdated packages
        const { stdout } = await execAsync('npm outdated --json', { cwd });
        return parseOutdated(stdout);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        // If exit code is 1, it means outdated packages found (and stdout has json)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (error.code === 1 && typeof error.stdout === 'string') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            return parseOutdated(error.stdout as string);
        }
        // If other error (e.g. npm not found), throw
        throw error;
    }
}

function parseOutdated(json: string): DependencyInfo[] {
    if (!json.trim()) return [];

    try {
        const result = JSON.parse(json) as NpmOutdatedResult;
        return Object.entries(result).map(([name, info]) => ({
            name,
            version: info.current ?? 'unknown',
            latestVersion: info.latest,
            isOutdated: true,
            isProduction: true, // npm outdated doesn't easily distinguish without more flags, assume true for now or refine
            dependencies: [], // Not provided by outdated
        }));
    } catch {
        return [];
    }
}

/**
 * Check for duplicate dependencies using npm ls
 */
export async function checkDuplicates(cwd: string): Promise<DuplicateDependency[]> {
    try {
        const { stdout } = await execAsync('npm ls --json --all', { cwd, maxBuffer: 10 * 1024 * 1024 });
        const tree = JSON.parse(stdout) as NpmLsResult;

        const versionMap = new Map<string, Set<string>>();
        traverseDependencies(tree, versionMap);

        const duplicates: DuplicateDependency[] = [];
        for (const [name, versions] of versionMap.entries()) {
            if (versions.size > 1) {
                duplicates.push({
                    name,
                    versions: Array.from(versions).sort(),
                });
            }
        }

        return duplicates;
    } catch {
        // If npm ls fails (e.g. invalid peer deps), it might still output json in stdout or separate stderr
        // We'll return empty if failed for now to avoid breaking the scan
        return [];
    }
}

function traverseDependencies(node: NpmLsResult | NpmLsDependency, map: Map<string, Set<string>>): void {
    if (node.dependencies) {
        for (const [name, dep] of Object.entries(node.dependencies)) {
            if (!map.has(name)) {
                map.set(name, new Set());
            }
            if (dep.version) {
                map.get(name)?.add(dep.version);
            }
            traverseDependencies(dep, map);
        }
    }
}

/**
 * Core analysis function
 */
export async function analyzeDependencies(cwd: string): Promise<DepsData> {
    const [outdated, duplicates] = await Promise.all([
        checkOutdated(cwd).catch(() => []),
        checkDuplicates(cwd).catch(() => []),
    ]);

    return {
        dependencies: outdated, // Only tracking outdated ones as "dependencies" of interest for now
        duplicates,
        circularDeps: [], // Not implemented
        outdatedCount: outdated.length,
    };
}
