// ─── Citation Formatter ────────────────────────────────────
// Extracts and formats tax authority citations from responses.
// Ensures all citations are clearly linked to their sources.

export interface Citation {
  type: 'irc' | 'irs_pub' | 'rev_rul' | 'court_case' | 'treas_reg' | 'notice' | 'other';
  reference: string;
  description?: string;
}

// ─── Citation extraction patterns ─────────────────────────

const CITATION_PATTERNS: Array<{ type: Citation['type']; regex: RegExp }> = [
  // IRC sections: IRC §1, IRC §61(a), IRC §162(a)(1)
  {
    type: 'irc',
    regex: /IRC\s*§\s*(\d+[A-Za-z]?)(?:\([a-zA-Z0-9]+\)(?:\([a-zA-Z0-9]+\))?)?/g,
  },
  // Also match "Section 179" style
  {
    type: 'irc',
    regex: /(?:Section|Sec\.?)\s+(\d{1,4}[A-Za-z]?)(?:\([a-zA-Z0-9]+\))?/g,
  },
  // IRS Publications: Pub. 17, Publication 502
  {
    type: 'irs_pub',
    regex: /(?:IRS\s+)?(?:Pub(?:lication)?\.?\s*)(\d{1,4})/gi,
  },
  // Revenue Rulings: Rev. Rul. 2019-24
  {
    type: 'rev_rul',
    regex: /Rev\.?\s*Rul\.?\s*([\d-]+)/gi,
  },
  // Treasury Regulations: Treas. Reg. § 1.162-5
  {
    type: 'treas_reg',
    regex: /Treas\.?\s*Reg\.?\s*§?\s*([\d.]+[-]?\d*)/gi,
  },
  // IRS Notices: Notice 2020-32
  {
    type: 'notice',
    regex: /(?:IRS\s+)?Notice\s+([\d-]+)/gi,
  },
  // Tax Court / Supreme Court cases
  {
    type: 'court_case',
    regex: /(\w+(?:\s+\w+)*)\s+v\.\s+(?:Commissioner|Comm'r|United States|IRS)/gi,
  },
];

/**
 * Extracts citations from a Claude response text.
 */
export function extractCitations(text: string): Citation[] {
  const citations: Citation[] = [];
  const seen = new Set<string>();

  for (const { type, regex } of CITATION_PATTERNS) {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const reference = match[0].trim();
      const key = `${type}:${reference.toLowerCase()}`;

      if (!seen.has(key)) {
        seen.add(key);
        citations.push({ type, reference });
      }
    }
  }

  return citations;
}

/**
 * Formats extracted citations as a Sources section.
 * Only appends if citations were found and not already present.
 */
export function formatCitationBlock(citations: Citation[]): string {
  if (citations.length === 0) return '';

  const grouped: Record<string, string[]> = {};

  for (const c of citations) {
    const label = CITATION_TYPE_LABELS[c.type] || 'Other';
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(c.reference);
  }

  const sections = Object.entries(grouped).map(([label, refs]) => {
    return `**${label}:** ${[...new Set(refs)].join(', ')}`;
  });

  return `\n\n---\n**Sources & Citations**\n${sections.join('\n')}`;
}

const CITATION_TYPE_LABELS: Record<Citation['type'], string> = {
  irc: 'Internal Revenue Code',
  irs_pub: 'IRS Publications',
  rev_rul: 'Revenue Rulings',
  court_case: 'Court Cases',
  treas_reg: 'Treasury Regulations',
  notice: 'IRS Notices',
  other: 'Other Sources',
};

/**
 * Checks if a response already has a citations/sources section.
 */
export function hasCitationSection(text: string): boolean {
  return /\*\*Sources?\s*(?:&|and)?\s*Citations?\*\*/i.test(text) ||
    /#{1,3}\s*Sources?\s*(?:&|and)?\s*Citations?/i.test(text);
}
