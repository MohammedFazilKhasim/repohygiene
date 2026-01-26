/**
 * RepoHygiene - Example Configuration File
 * Copy this to your project root as repohygiene.config.js
 */

export default {
    // ============================================================================
    // GLOBAL SETTINGS
    // ============================================================================

    // Directories/files to exclude from all scans
    exclude: [
        'node_modules',
        'dist',
        'build',
        '.git',
        'coverage',
        'vendor',
    ],

    // ============================================================================
    // CODEOWNERS SETTINGS
    // ============================================================================

    codeowners: {
        // Minimum commits to be considered an owner
        threshold: 10,

        // Output path for generated CODEOWNERS file
        output: '.github/CODEOWNERS',

        // Map email domains or usernames to team names
        teamMappings: {
            // 'frontend-team': ['@alice', '@bob', '@charlie'],
            // 'backend-team': ['@dave', '@eve'],
            // 'devops-team': ['@frank'],
        },
    },

    // ============================================================================
    // LICENSE AUDIT SETTINGS
    // ============================================================================

    licenses: {
        // Explicitly allowed licenses
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

        // Explicitly denied licenses (copyleft licenses by default)
        deny: [
            'GPL-2.0',
            'GPL-3.0',
            'AGPL-3.0',
            'LGPL-2.1',
            'LGPL-3.0',
        ],

        // When to fail: 'unknown' | 'restricted' | 'any'
        failOn: 'restricted',

        // Only check production dependencies
        production: true,
    },

    // ============================================================================
    // SECRET SCANNING SETTINGS
    // ============================================================================

    secrets: {
        // Scan git history for secrets (slower but more thorough)
        scanHistory: false,

        // Minimum Shannon entropy to flag as potential secret
        entropyThreshold: 4.5,

        // Additional patterns to exclude
        exclude: [
            '*.lock',
            '*.min.js',
            '*.min.css',
            '*.map',
        ],

        // Custom patterns to detect (in addition to built-in patterns)
        // customPatterns: [
        //   { name: 'Internal API Key', pattern: /INTERNAL_[A-Z0-9]{32}/ },
        // ],
    },

    // ============================================================================
    // BRANCH CLEANUP SETTINGS
    // ============================================================================

    branches: {
        // Days since last commit to consider a branch stale
        staleDays: 90,

        // Branch patterns to never delete (protected)
        exclude: [
            'main',
            'master',
            'develop',
            'development',
            'staging',
            'production',
            'release/*',
            'hotfix/*',
        ],

        // Include remote branches in analysis
        remote: true,

        // Only target merged branches
        mergedOnly: false,
    },

    // ============================================================================
    // DEPENDENCY ANALYSIS SETTINGS
    // ============================================================================

    deps: {
        // Generate dependency graph
        graph: false,

        // Check for outdated packages
        outdated: true,

        // Find duplicate dependencies
        duplicates: true,

        // Detect circular dependencies
        circular: false,
    },
};
