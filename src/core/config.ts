/**
 * RepoHygiene - Configuration Loader
 * Uses cosmiconfig to load configuration from multiple sources
 */

import { cosmiconfig } from 'cosmiconfig';
import type { RepoHygieneConfig } from '../types/index.js';

const MODULE_NAME = 'repohygiene';

const DEFAULT_CONFIG: RepoHygieneConfig = {
  exclude: ['node_modules', 'dist', '.git', 'coverage', 'vendor'],
  codeowners: {
    threshold: 10,
    output: '.github/CODEOWNERS',
  },
  licenses: {
    allow: ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', '0BSD', 'Unlicense'],
    deny: ['GPL-3.0', 'AGPL-3.0', 'GPL-2.0'],
    failOn: 'restricted',
    production: true,
  },
  secrets: {
    scanHistory: false,
    entropyThreshold: 4.5,
    exclude: [
      '*.lock',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      '*.min.js',
      '*.min.css',
      '*.map',
      'dist/**',
      'coverage/**',
      '.git/**',
      'node_modules/**',
      'src/modules/secrets/patterns.ts',
      '**/src/modules/secrets/patterns.ts',
      'tests/**',
      '**/tests/**',
      '__tests__/**',
      '**/__tests__/**',
      '*.test.ts',
      '**/*.test.ts',
      '*.spec.ts',
      '**/*.spec.ts',
    ],
  },
  branches: {
    staleDays: 90,
    exclude: ['main', 'master', 'develop', 'release/*', 'hotfix/*'],
    remote: true,
    mergedOnly: false,
  },
  deps: {
    graph: false,
    outdated: true,
    duplicates: true,
    circular: false,
  },
};

export interface LoadConfigResult {
  config: RepoHygieneConfig;
  filepath: string | null;
  isEmpty: boolean;
}

/**
 * Loads configuration from various sources
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<LoadConfigResult> {
  const explorer = cosmiconfig(MODULE_NAME, {
    searchPlaces: [
      'package.json',
      `.${MODULE_NAME}rc`,
      `.${MODULE_NAME}rc.json`,
      `.${MODULE_NAME}rc.yaml`,
      `.${MODULE_NAME}rc.yml`,
      `${MODULE_NAME}.config.js`,
      `${MODULE_NAME}.config.mjs`,
      `${MODULE_NAME}.config.cjs`,
    ],
  });

  const result = await explorer.search(cwd);

  if (result === null) {
    return {
      config: DEFAULT_CONFIG,
      filepath: null,
      isEmpty: true,
    };
  }

  // Simple shallow merge for config
  const userConfig = result.config as Partial<RepoHygieneConfig>;
  const mergedConfig: RepoHygieneConfig = {
    exclude: userConfig.exclude ?? DEFAULT_CONFIG.exclude,
    codeowners: { ...DEFAULT_CONFIG.codeowners, ...userConfig.codeowners },
    licenses: { ...DEFAULT_CONFIG.licenses, ...userConfig.licenses },
    secrets: { ...DEFAULT_CONFIG.secrets, ...userConfig.secrets },
    branches: { ...DEFAULT_CONFIG.branches, ...userConfig.branches },
    deps: { ...DEFAULT_CONFIG.deps, ...userConfig.deps },
  };

  return {
    config: mergedConfig,
    filepath: result.filepath,
    isEmpty: result.isEmpty ?? false,
  };
}

export { DEFAULT_CONFIG };
