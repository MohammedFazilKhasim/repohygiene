/**
 * RepoHygiene - Entropy Detection
 * Detect high-entropy strings that might be secrets
 */

/**
 * Calculate Shannon entropy of a string
 */
export function calculateEntropy(str: string): number {
  if (str.length === 0) return 0;

  const charCounts = new Map<string, number>();
  for (const char of str) {
    charCounts.set(char, (charCounts.get(char) ?? 0) + 1);
  }

  let entropy = 0;
  const len = str.length;

  for (const count of charCounts.values()) {
    const probability = count / len;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}

/**
 * Check if string is likely a secret based on entropy
 */
export function isHighEntropy(str: string, threshold: number = 4.5): boolean {
  // Skip strings that are too short or too long
  if (str.length < 20 || str.length > 200) {
    return false;
  }

  // Skip if too many repeated characters
  const uniqueChars = new Set(str).size;
  if (uniqueChars < str.length * 0.3) {
    return false;
  }

  // Check if string matches expected character sets
  const isBase64Like = /^[A-Za-z0-9+/=_-]+$/.test(str);
  const isHexLike = /^[0-9a-fA-F]+$/.test(str);

  if (!isBase64Like && !isHexLike) {
    return false;
  }

  const entropy = calculateEntropy(str);
  return entropy >= threshold;
}

/**
 * Find high-entropy strings in content
 */
export function findHighEntropyStrings(
  content: string,
  threshold: number = 4.5
): Array<{ value: string; entropy: number; position: number }> {
  const results: Array<{ value: string; entropy: number; position: number }> = [];

  // Find quoted strings and assignment values
  const patterns = [
    // Quoted strings
    /['"]([A-Za-z0-9+/=_-]{20,})['"]/g,
    // Assignment values (without quotes)
    /[=:]\s*([A-Za-z0-9+/=_-]{20,})(?:\s|$|;)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const value = match[1];
      if (value !== undefined && value !== '' && isHighEntropy(value, threshold)) {
        const entropy = calculateEntropy(value);
        results.push({
          value,
          entropy,
          position: match.index,
        });
      }
    }
  }

  return results;
}

/**
 * Mask a secret for safe display
 */
export function maskSecret(secret: string, visibleChars: number = 4): string {
  if (secret.length <= visibleChars * 2) {
    return '*'.repeat(secret.length);
  }

  const start = secret.slice(0, visibleChars);
  const end = secret.slice(-visibleChars);
  const masked = '*'.repeat(Math.min(secret.length - visibleChars * 2, 10));

  return `${start}${masked}${end}`;
}
