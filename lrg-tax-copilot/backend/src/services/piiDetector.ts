// ─── PII Detection ──────────────────────────────────────────
// Scans user messages for potential PII before sending to Claude.
// Returns warnings — does NOT block the request.

export interface PIIWarning {
  type: string;
  pattern: string;
  redacted: string;
}

const PII_PATTERNS: Array<{ type: string; regex: RegExp; label: string }> = [
  {
    type: 'SSN',
    regex: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    label: 'Social Security Number',
  },
  {
    type: 'EIN',
    regex: /\b\d{2}[-\s]?\d{7}\b/g,
    label: 'Employer Identification Number',
  },
  {
    type: 'BANK_ACCOUNT',
    regex: /\b\d{8,17}\b/g, // 8-17 digit sequences (common account numbers)
    label: 'Possible bank account number',
  },
  {
    type: 'ROUTING',
    regex: /\b[0-3]\d{8}\b/g, // ABA routing numbers start with 0-3
    label: 'Possible routing number',
  },
  {
    type: 'CREDIT_CARD',
    regex: /\b(?:4\d{3}|5[1-5]\d{2}|3[47]\d{2}|6(?:011|5\d{2}))\d{8,12}\b/g,
    label: 'Credit card number',
  },
  {
    type: 'DOB',
    regex: /\b(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12]\d|3[01])\/(?:19|20)\d{2}\b/g,
    label: 'Date of birth',
  },
  {
    type: 'EMAIL',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    label: 'Email address',
  },
  {
    type: 'PHONE',
    regex: /\b(?:\+?1[-\s.]?)?\(?\d{3}\)?[-\s.]?\d{3}[-\s.]?\d{4}\b/g,
    label: 'Phone number',
  },
];

// Known safe patterns to exclude (dollar amounts, years, zip codes, etc.)
const SAFE_PATTERNS = [
  /^\$[\d,.]+$/,          // Dollar amounts
  /^20[12]\d$/,           // Years 2010-2029
  /^19\d{2}$/,            // Years 1900-1999
  /^\d{5}(-\d{4})?$/,    // ZIP codes
];

function isSafeNumber(match: string): boolean {
  const trimmed = match.replace(/[-\s]/g, '');
  return SAFE_PATTERNS.some((p) => p.test(trimmed)) || trimmed.length < 8;
}

/**
 * Scans text for potential PII and returns warnings.
 * Does NOT modify or block — just warns.
 */
export function detectPII(text: string): PIIWarning[] {
  const warnings: PIIWarning[] = [];
  const seen = new Set<string>();

  for (const { type, regex, label } of PII_PATTERNS) {
    // Reset regex state
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const value = match[0];

      // Skip safe patterns (dollar amounts, years, etc.)
      if (type === 'BANK_ACCOUNT' && isSafeNumber(value)) continue;
      if (type === 'ROUTING' && isSafeNumber(value)) continue;

      // SSN-specific: must have separators or be exactly 9 digits
      if (type === 'SSN') {
        const digits = value.replace(/[-\s]/g, '');
        if (digits.length !== 9) continue;
        // Skip if all same digit or sequential
        if (/^(\d)\1+$/.test(digits)) continue;
        if (digits === '123456789') continue;
      }

      const key = `${type}:${value}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // Redact: show first 2 and last 2 chars
      const cleaned = value.replace(/[-\s]/g, '');
      const redacted = cleaned.length > 4
        ? `${cleaned.slice(0, 2)}${'*'.repeat(cleaned.length - 4)}${cleaned.slice(-2)}`
        : '****';

      warnings.push({
        type: label,
        pattern: value,
        redacted,
      });
    }
  }

  return warnings;
}
