import { RetrievedEntry } from '../types';

// ─── Template matching for MODE-CRD ────────────────────────
// Finds the best matching template from retrieved content
// and builds a template-first drafting instruction for Claude.

interface MatchedTemplate {
  entry: RetrievedEntry;
  score: number;
  placeholders: string[];
}

// Common template placeholder patterns
const PLACEHOLDER_REGEX = /\{([A-Za-z_]+)\}|\[([A-Z_]+(?::[A-Z_]+)*)\]/g;

function extractPlaceholders(content: string): string[] {
  const placeholders: string[] = [];
  let match: RegExpExecArray | null;
  PLACEHOLDER_REGEX.lastIndex = 0;

  while ((match = PLACEHOLDER_REGEX.exec(content)) !== null) {
    placeholders.push(match[0]);
  }

  return [...new Set(placeholders)];
}

// Keyword signals for template types
const TEMPLATE_SIGNALS: Record<string, string[]> = {
  'refund': ['refund', 'return ready', 'filing complete', 'e-file', 'direct deposit'],
  'missing-docs': ['missing', 'documents', 'need', 'still need', 'upload', 'provide'],
  'notice': ['notice', 'irs notice', 'cp2000', 'letter from irs', 'assessment'],
  'engagement': ['engagement', 'scope', 'services', 'agreement', 'terms'],
  'payment': ['payment', 'invoice', 'balance', 'due', 'fee', 'billing'],
  'extension': ['extension', 'form 4868', 'additional time', 'deadline'],
  'followup': ['follow up', 'followup', 'check in', 'reminder', 'status'],
};

function scoreTemplateMatch(templateName: string, templateContent: string, userMessage: string): number {
  const lower = userMessage.toLowerCase();
  const tplLower = (templateName + ' ' + templateContent).toLowerCase();
  let score = 0;

  for (const [category, keywords] of Object.entries(TEMPLATE_SIGNALS)) {
    const userHits = keywords.filter((kw) => lower.includes(kw)).length;
    const tplHits = keywords.filter((kw) => tplLower.includes(kw)).length;

    if (userHits > 0 && tplHits > 0) {
      score += userHits * tplHits;
    }
  }

  return score;
}

/**
 * Finds the best matching template from retrieved content entries.
 * Returns null if no templates are in the retrieved content.
 */
export function findBestTemplate(
  retrievedContent: RetrievedEntry[],
  userMessage: string
): MatchedTemplate | null {
  const templates = retrievedContent.filter((e) => e.database === 'templates');

  if (templates.length === 0) return null;

  const scored: MatchedTemplate[] = templates.map((entry) => ({
    entry,
    score: scoreTemplateMatch(entry.entryName, entry.content, userMessage),
    placeholders: extractPlaceholders(entry.content),
  }));

  scored.sort((a, b) => b.score - a.score);

  // Return best match (even if score is 0 — it's the only template available)
  return scored[0];
}

/**
 * Builds template-first drafting instructions for the system prompt.
 */
export function buildTemplateDraftingBlock(
  matched: MatchedTemplate,
  userMessage: string
): string {
  const placeholderList = matched.placeholders.length > 0
    ? `\nPlaceholders found: ${matched.placeholders.join(', ')}`
    : '';

  return `
═══════════════════════════════════════
  TEMPLATE-FIRST DRAFTING
═══════════════════════════════════════

A matching template has been identified: "${matched.entry.entryName}" (${matched.entry.entryId})

Instructions:
1. Use this template as your starting point.
2. Fill in all placeholders with data from the preparer's message.
3. If the preparer provided specific figures, credits, or amounts, include them exactly.
4. You may restructure, enhance, or adapt the template as the preparer requests.
5. If placeholders cannot be filled from the available data, leave them as placeholders and note what's needed.
${placeholderList}

Template content:
---
${matched.entry.content}
---

The preparer's request: "${userMessage}"

Draft the response using this template as the foundation, incorporating all preparer-provided details.`;
}
