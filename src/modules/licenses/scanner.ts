/**
 * RepoHygiene - License Scanner
 * Scans dependencies for license information
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { DependencyLicense } from '../../types/index.js';

const DEFAULT_ALLOWED = [
    'MIT',
    'Apache-2.0',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'ISC',
    '0BSD',
    'Unlicense',
    'CC0-1.0',
    'WTFPL',
];

const DEFAULT_DENIED = [
    'GPL-2.0',
    'GPL-3.0',
    'AGPL-3.0',
    'LGPL-2.1',
    'LGPL-3.0',
];

export interface LicenseScanOptions {
    readonly cwd: string;
    readonly allow?: readonly string[];
    readonly deny?: readonly string[];
    readonly production?: boolean;
}

/**
 * Scan all dependencies for license information
 */
export async function scanLicenses(
    options: LicenseScanOptions
): Promise<DependencyLicense[]> {
    const { cwd, production = false } = options;
    const allowList = new Set(options.allow ?? DEFAULT_ALLOWED);
    const denyList = new Set(options.deny ?? DEFAULT_DENIED);

    // Read package.json
    const packageJsonPath = join(cwd, 'package.json');
    if (!existsSync(packageJsonPath)) {
        throw new Error('package.json not found');
    }

    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8')) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
    };

    const dependencies = packageJson.dependencies ?? {};
    const devDependencies = production ? {} : (packageJson.devDependencies ?? {});

    const results: DependencyLicense[] = [];

    // Scan production dependencies
    for (const [name, version] of Object.entries(dependencies)) {
        const license = await getLicenseForPackage(cwd, name);
        results.push({
            name,
            version,
            license: license.license,
            licenseFile: license.licenseFile,
            repository: license.repository,
            isProduction: true,
            status: getLicenseStatus(license.license, allowList, denyList),
        });
    }

    // Scan dev dependencies
    for (const [name, version] of Object.entries(devDependencies)) {
        const license = await getLicenseForPackage(cwd, name);
        results.push({
            name,
            version,
            license: license.license,
            licenseFile: license.licenseFile,
            repository: license.repository,
            isProduction: false,
            status: getLicenseStatus(license.license, allowList, denyList),
        });
    }

    return results;
}

interface PackageLicenseInfo {
    license: string;
    licenseFile?: string;
    repository?: string;
}

/**
 * Get license info for a specific package
 */
async function getLicenseForPackage(
    cwd: string,
    packageName: string
): Promise<PackageLicenseInfo> {
    const packagePath = join(cwd, 'node_modules', packageName, 'package.json');

    if (!existsSync(packagePath)) {
        return { license: 'UNKNOWN' };
    }

    try {
        const packageJson = JSON.parse(await readFile(packagePath, 'utf-8')) as {
            license?: string | { type?: string };
            licenses?: Array<{ type?: string }>;
            repository?: string | { url?: string };
        };

        // Get license from package.json
        let license = 'UNKNOWN';
        if (typeof packageJson.license === 'string') {
            license = packageJson.license;
        } else if (typeof packageJson.license === 'object' && packageJson.license?.type) {
            license = packageJson.license.type;
        } else if (Array.isArray(packageJson.licenses) && packageJson.licenses[0]?.type) {
            license = packageJson.licenses[0].type;
        }

        // Get repository
        let repository: string | undefined;
        if (typeof packageJson.repository === 'string') {
            repository = packageJson.repository;
        } else if (packageJson.repository?.url) {
            repository = packageJson.repository.url;
        }

        // Check for LICENSE file
        const licenseFiles = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'license'];
        let licenseFile: string | undefined;
        for (const file of licenseFiles) {
            const licensePath = join(cwd, 'node_modules', packageName, file);
            if (existsSync(licensePath)) {
                licenseFile = file;
                break;
            }
        }

        return { license, licenseFile, repository };
    } catch {
        return { license: 'UNKNOWN' };
    }
}

/**
 * Determine license status based on allow/deny lists
 */
function getLicenseStatus(
    license: string,
    allowList: Set<string>,
    denyList: Set<string>
): 'allowed' | 'denied' | 'unknown' {
    // Normalize license for comparison
    const normalized = license.toUpperCase();

    // Check deny list first
    for (const denied of denyList) {
        if (normalized.includes(denied.toUpperCase())) {
            return 'denied';
        }
    }

    // Check allow list
    for (const allowed of allowList) {
        if (normalized.includes(allowed.toUpperCase())) {
            return 'allowed';
        }
    }

    // Special case: UNKNOWN always returns unknown
    if (license === 'UNKNOWN') {
        return 'unknown';
    }

    return 'unknown';
}

/**
 * Parse SPDX license expression
 */
export function parseSpdxExpression(expression: string): string[] {
    // Simple SPDX parsing - handles AND, OR, WITH
    return expression
        .replace(/\(|\)/g, '')
        .split(/\s+(?:AND|OR|WITH)\s+/i)
        .map((s) => s.trim())
        .filter(Boolean);
}
