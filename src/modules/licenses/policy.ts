/**
 * RepoHygiene - License Policy
 * Define and check license policies
 */

import type { DependencyLicense, LicenseSummary } from '../../types/index.js';

export interface LicensePolicy {
  readonly allow: readonly string[];
  readonly deny: readonly string[];
  readonly failOn: 'unknown' | 'restricted' | 'any';
}

export const DEFAULT_POLICY: LicensePolicy = {
  allow: [
    'MIT',
    'Apache-2.0',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'ISC',
    '0BSD',
    'Unlicense',
    'CC0-1.0',
  ],
  deny: ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0'],
  failOn: 'restricted',
};

/**
 * Check if a license is allowed by policy
 */
export function isLicenseAllowed(license: string, policy: LicensePolicy): boolean {
  const normalized = license.toUpperCase();

  return policy.allow.some((allowed) => normalized.includes(allowed.toUpperCase()));
}

/**
 * Check if a license is denied by policy
 */
export function isLicenseDenied(license: string, policy: LicensePolicy): boolean {
  const normalized = license.toUpperCase();

  return policy.deny.some((denied) => normalized.includes(denied.toUpperCase()));
}

/**
 * Generate license summary from scan results
 */
export function generateLicenseSummary(licenses: readonly DependencyLicense[]): LicenseSummary {
  return {
    total: licenses.length,
    allowed: licenses.filter((l) => l.status === 'allowed').length,
    denied: licenses.filter((l) => l.status === 'denied').length,
    unknown: licenses.filter((l) => l.status === 'unknown').length,
  };
}

/**
 * Check if scan should fail based on policy
 */
export function shouldFail(summary: LicenseSummary, policy: LicensePolicy): boolean {
  switch (policy.failOn) {
    case 'any':
      return summary.denied > 0 || summary.unknown > 0;
    case 'restricted':
      return summary.denied > 0;
    case 'unknown':
      return summary.unknown > 0;
    default:
      return false;
  }
}

/**
 * Group licenses by license type
 */
export function groupByLicense(
  licenses: readonly DependencyLicense[]
): Map<string, DependencyLicense[]> {
  const groups = new Map<string, DependencyLicense[]>();

  for (const dep of licenses) {
    const existing = groups.get(dep.license);
    if (existing) {
      existing.push(dep);
    } else {
      groups.set(dep.license, [dep]);
    }
  }

  return groups;
}
