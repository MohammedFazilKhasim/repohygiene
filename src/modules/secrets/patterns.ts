/**
 * RepoHygiene - Secret Patterns
 * Regex patterns for detecting secrets in code
 */

export interface SecretPattern {
  readonly name: string;
  readonly pattern: RegExp;
  readonly severity: 'high' | 'medium' | 'low';
  readonly description: string;
}

/**
 * Common secret patterns
 */
export const SECRET_PATTERNS: readonly SecretPattern[] = [
  // Cloud Providers
  {
    name: 'AWS Access Key ID',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'high',
    description: 'Amazon Web Services access key',
  },
  {
    name: 'AWS Secret Access Key',
    pattern: /(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])/g,
    severity: 'high',
    description: 'Potential AWS secret key (40 char base64)',
  },
  {
    name: 'Google Cloud API Key',
    pattern: /AIza[0-9A-Za-z_-]{35}/g,
    severity: 'high',
    description: 'Google Cloud Platform API key',
  },
  {
    name: 'Azure Storage Key',
    pattern: /(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{86}==(?![A-Za-z0-9/+=])/g,
    severity: 'high',
    description: 'Azure Storage account key',
  },

  // Version Control
  {
    name: 'GitHub Token',
    pattern: /gh[ps]_[A-Za-z0-9_]{36,}/g,
    severity: 'high',
    description: 'GitHub personal access token',
  },
  {
    name: 'GitHub OAuth Token',
    pattern: /gho_[A-Za-z0-9_]{36,}/g,
    severity: 'high',
    description: 'GitHub OAuth token',
  },
  {
    name: 'GitLab Token',
    pattern: /glpat-[A-Za-z0-9_-]{20,}/g,
    severity: 'high',
    description: 'GitLab personal access token',
  },

  // API Keys
  {
    name: 'Stripe API Key',
    pattern: new RegExp('sk_live_' + '[0-9a-zA-Z]{24,}', 'g'),
    severity: 'high',
    description: 'Stripe secret API key',
  },
  {
    name: 'Stripe Publishable Key',
    pattern: /pk_live_[0-9a-zA-Z]{24,}/g,
    severity: 'medium',
    description: 'Stripe publishable key',
  },
  {
    name: 'Slack Token',
    pattern: /xox[baprs]-[0-9a-zA-Z-]{10,}/g,
    severity: 'high',
    description: 'Slack API token',
  },
  {
    name: 'Slack Webhook',
    pattern:
      /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]{8,}\/B[A-Z0-9]{8,}\/[a-zA-Z0-9]{24,}/g,
    severity: 'high',
    description: 'Slack webhook URL',
  },
  {
    name: 'Twilio API Key',
    pattern: /SK[0-9a-fA-F]{32}/g,
    severity: 'high',
    description: 'Twilio API key',
  },
  {
    name: 'SendGrid API Key',
    pattern: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g,
    severity: 'high',
    description: 'SendGrid API key',
  },
  {
    name: 'Mailchimp API Key',
    pattern: /[a-f0-9]{32}-us[0-9]{1,2}/g,
    severity: 'high',
    description: 'Mailchimp API key',
  },

  // Database
  {
    name: 'MongoDB Connection String',
    pattern: /mongodb(\+srv)?:\/\/[^\s'"]+/g,
    severity: 'high',
    description: 'MongoDB connection string with credentials',
  },
  {
    name: 'PostgreSQL Connection String',
    pattern: /postgres(ql)?:\/\/[^\s'"]+/g,
    severity: 'high',
    description: 'PostgreSQL connection string',
  },
  {
    name: 'MySQL Connection String',
    pattern: /mysql:\/\/[^\s'"]+/g,
    severity: 'high',
    description: 'MySQL connection string',
  },

  // Authentication
  {
    name: 'JWT Token',
    pattern: /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g,
    severity: 'medium',
    description: 'JSON Web Token',
  },
  {
    name: 'Bearer Token',
    pattern: /Bearer\s+[A-Za-z0-9_-]{20,}/g,
    severity: 'high',
    description: 'Bearer authentication token',
  },

  // Private Keys
  {
    name: 'RSA Private Key',
    pattern: /-----BEGIN RSA PRIVATE KEY-----/g,
    severity: 'high',
    description: 'RSA private key header',
  },
  {
    name: 'SSH Private Key',
    pattern: /-----BEGIN OPENSSH PRIVATE KEY-----/g,
    severity: 'high',
    description: 'SSH private key header',
  },
  {
    name: 'PGP Private Key',
    pattern: /-----BEGIN PGP PRIVATE KEY BLOCK-----/g,
    severity: 'high',
    description: 'PGP private key header',
  },

  // Environment Variables Patterns
  {
    name: 'Generic API Key',
    pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
    severity: 'medium',
    description: 'Generic API key pattern',
  },
  {
    name: 'Generic Secret',
    pattern: /(?:secret|password|passwd|pwd)\s*[:=]\s*['"]?([^\s'"]{8,})['"]?/gi,
    severity: 'medium',
    description: 'Generic secret/password pattern',
  },

  // NPM
  {
    name: 'NPM Token',
    pattern: /npm_[A-Za-z0-9]{36}/g,
    severity: 'high',
    description: 'NPM access token',
  },

  // Discord
  {
    name: 'Discord Token',
    pattern: /[MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27}/g,
    severity: 'high',
    description: 'Discord bot token',
  },
  {
    name: 'Discord Webhook',
    pattern: /https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+/g,
    severity: 'high',
    description: 'Discord webhook URL',
  },

  // Firebase
  {
    name: 'Firebase API Key',
    pattern: /AIza[0-9A-Za-z_-]{35}/g,
    severity: 'medium',
    description: 'Firebase API key',
  },

  // Heroku
  {
    name: 'Heroku API Key',
    pattern: /[h|H]eroku.*[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/g,
    severity: 'high',
    description: 'Heroku API key',
  },
];

/**
 * Get patterns filtered by severity
 */
export function getPatternsBySeverity(severity: 'high' | 'medium' | 'low'): SecretPattern[] {
  return SECRET_PATTERNS.filter((p) => p.severity === severity);
}

/**
 * Create a combined regex for quick scanning
 */
export function createCombinedPattern(): RegExp {
  const patterns = SECRET_PATTERNS.map((p) => `(${p.pattern.source})`);
  return new RegExp(patterns.join('|'), 'g');
}
