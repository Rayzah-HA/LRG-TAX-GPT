import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import config from '../config';
import { PageClassification, DOC_TYPES } from '../types/documents';

// ─── Classification prompt ──────────────────────────────────

const CLASSIFICATION_SYSTEM_PROMPT = `You are a document classification assistant for a tax preparation firm. You analyze scanned PDF pages and classify each page.

Your job:
1. Identify the document type from this list: ${DOC_TYPES.join(', ')}
2. Guess the entity name (person or business) if visible
3. Guess the tax year if visible
4. Rate your confidence (0.0 to 1.0)
5. Judge relevance: "relevant" (tax document), "irrelevant" (junk, blank, cover page), or "uncertain"

Rules:
- Be conservative with confidence scores
- If the page is mostly blank or illegible, classify as "Irrelevant" with low confidence
- If you see a form number (W-2, 1099, K-1, etc.), use it directly
- Mortgage statements, loan payoff statements, escrow summaries, and 1098 forms are ALL tax-relevant documents — classify them as "Mortgage Statement" with relevance "relevant"
- Bank statements, brokerage statements, and financial summaries are tax-relevant
- For entity names, use exact text as shown (don't correct spelling)
- For tax year, look for "Tax Year", year in headers, or date ranges
- When in doubt, lean toward "relevant" or "uncertain" — never classify a real financial document as "irrelevant"
- Do NOT fabricate information — if you can't determine something, return null

Respond ONLY with valid JSON. No explanation text.`;

function buildClassificationPrompt(
  pageNumber: number,
  textContent: string
): string {
  // Truncate text to avoid sending excessive content
  const truncated =
    textContent.length > 3000
      ? textContent.substring(0, 3000) + '\n[...truncated]'
      : textContent;

  return `Classify this page (page ${pageNumber}):

---
${truncated}
---

Respond with JSON:
{
  "docType": "one of the allowed types",
  "entityGuess": "name or null",
  "taxYearGuess": "YYYY or null",
  "confidence": 0.0-1.0,
  "relevance": "relevant|irrelevant|uncertain"
}`;
}

// ─── Classify a single page ────────────────────────────────

export async function classifyPage(
  pageNumber: number,
  textContent: string,
  thumbnailPath?: string
): Promise<PageClassification> {
  const hasText = textContent && textContent.trim().length >= 20;
  const hasThumbnail = thumbnailPath && fs.existsSync(thumbnailPath) && fs.statSync(thumbnailPath).size > 0;

  // Try Claude API classification (with vision for sparse/missing text)
  if (config.anthropicApiKey) {
    try {
      if (hasText) {
        return await classifyWithClaude(pageNumber, textContent);
      } else if (hasThumbnail) {
        // Text extraction failed but we have a thumbnail — use vision
        console.log(
          `[documentClassifier] Sparse text for page ${pageNumber}, using vision classification`
        );
        return await classifyWithVision(pageNumber, thumbnailPath, textContent || '');
      }
    } catch (error) {
      // Fallback to pattern matching on API failure
      console.log(
        `[documentClassifier] Claude API failed for page ${pageNumber}, using pattern matching`
      );
    }
  }

  // If no text and no thumbnail, mark as irrelevant
  if (!hasText && !hasThumbnail) {
    return {
      docType: 'Irrelevant',
      entityGuess: null,
      taxYearGuess: null,
      confidence: 0.5,
      relevance: 'uncertain',
    };
  }

  // Fallback: pattern-based classification
  return classifyWithPatterns(textContent);
}

// ─── Batch classify ─────────────────────────────────────────

export async function classifyPages(
  pages: Array<{ pageNumber: number; textContent: string; thumbnailPath?: string }>
): Promise<Map<number, PageClassification>> {
  const results = new Map<number, PageClassification>();

  // Process pages sequentially to avoid rate limits
  // (Under 30 pages, sequential is fine)
  for (const page of pages) {
    const classification = await classifyPage(
      page.pageNumber,
      page.textContent,
      page.thumbnailPath
    );
    results.set(page.pageNumber, classification);
  }

  return results;
}

// ─── Claude API classification ──────────────────────────────

async function classifyWithClaude(
  pageNumber: number,
  textContent: string
): Promise<PageClassification> {
  const client = new Anthropic({ apiKey: config.anthropicApiKey });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 256,
    system: CLASSIFICATION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildClassificationPrompt(pageNumber, textContent),
      },
    ],
  });

  // Extract text response
  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text in Claude response');
  }

  // Parse JSON response
  const rawText = textBlock.text.trim();
  // Handle potential markdown code blocks
  const jsonStr = rawText.startsWith('{')
    ? rawText
    : rawText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();

  const parsed = JSON.parse(jsonStr);

  return {
    docType: parsed.docType || 'Other',
    entityGuess: parsed.entityGuess || null,
    taxYearGuess: parsed.taxYearGuess || null,
    confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
    relevance: ['relevant', 'irrelevant', 'uncertain'].includes(
      parsed.relevance
    )
      ? parsed.relevance
      : 'uncertain',
  };
}

// ─── Vision-based classification (for scanned / image-heavy PDFs) ──

async function classifyWithVision(
  pageNumber: number,
  thumbnailPath: string,
  textContent: string
): Promise<PageClassification> {
  const client = new Anthropic({ apiKey: config.anthropicApiKey });

  const imageData = fs.readFileSync(thumbnailPath);
  const base64Image = imageData.toString('base64');

  const userContent: Anthropic.Messages.ContentBlockParam[] = [
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: base64Image,
      },
    },
    {
      type: 'text',
      text: `Classify this scanned document page (page ${pageNumber}).

${textContent.trim().length > 0 ? `Extracted text (may be incomplete):\n---\n${textContent.substring(0, 1500)}\n---\n` : 'No text could be extracted from this page — rely on the image.\n'}
Look carefully at the document image. Identify logos, headers, form numbers, account numbers, financial figures, and any visual cues that indicate what type of document this is.

Respond with JSON:
{
  "docType": "one of the allowed types",
  "entityGuess": "name or null",
  "taxYearGuess": "YYYY or null",
  "confidence": 0.0-1.0,
  "relevance": "relevant|irrelevant|uncertain"
}`,
    },
  ];

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 256,
    system: CLASSIFICATION_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text in Claude vision response');
  }

  const rawText = textBlock.text.trim();
  const jsonStr = rawText.startsWith('{')
    ? rawText
    : rawText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();

  const parsed = JSON.parse(jsonStr);

  return {
    docType: parsed.docType || 'Other',
    entityGuess: parsed.entityGuess || null,
    taxYearGuess: parsed.taxYearGuess || null,
    confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
    relevance: ['relevant', 'irrelevant', 'uncertain'].includes(parsed.relevance)
      ? parsed.relevance
      : 'uncertain',
  };
}

// ─── Pattern-based fallback classification ──────────────────

const PATTERN_MAP: Array<{
  patterns: RegExp[];
  docType: string;
}> = [
  {
    patterns: [/\bW-?2\b/i, /Wage and Tax Statement/i],
    docType: 'W-2',
  },
  {
    patterns: [/1099-NEC/i, /Nonemployee Compensation/i],
    docType: '1099-NEC',
  },
  {
    patterns: [/1099-K/i, /Payment Card/i, /Third Party Network/i],
    docType: '1099-K',
  },
  {
    patterns: [/1099-INT/i, /Interest Income/i],
    docType: '1099-INT',
  },
  {
    patterns: [/1099-DIV/i, /Dividends and Distributions/i],
    docType: '1099-DIV',
  },
  {
    patterns: [/1099-MISC/i, /Miscellaneous Income/i],
    docType: '1099-MISC',
  },
  {
    patterns: [/1099-R/i, /Distributions From Pensions/i, /Retirement/i],
    docType: '1099-R',
  },
  {
    patterns: [/1099-G/i, /Government Payments/i, /Unemployment/i],
    docType: '1099-G',
  },
  {
    patterns: [/1099-B/i, /Proceeds From Broker/i],
    docType: '1099-B',
  },
  {
    patterns: [/1099-SA/i, /HSA.*Distribution/i],
    docType: '1099-SA',
  },
  {
    patterns: [/SSA-1099/i, /Social Security Benefit/i],
    docType: 'SSA-1099',
  },
  {
    patterns: [/Schedule K-1/i, /Partner.s Share/i, /Shareholder.s Share/i],
    docType: 'K-1',
  },
  {
    patterns: [/Schedule C/i, /Profit or Loss From Business/i],
    docType: 'Schedule C',
  },
  {
    patterns: [/bank statement/i, /account summary/i, /checking|savings/i],
    docType: 'Bank Statement',
  },
  {
    patterns: [/invoice/i, /receipt/i, /paid.*amount/i],
    docType: 'Invoice/Receipt',
  },
  {
    patterns: [
      /articles of incorporation/i,
      /certificate of formation/i,
      /EIN.*letter/i,
    ],
    docType: 'Corporate Filing',
  },
  {
    patterns: [/property tax/i, /real estate tax/i, /assessment/i],
    docType: 'Property Tax',
  },
  {
    patterns: [
      /mortgage/i,
      /form 1098\b/i,
      /\b1098\b/i,
      /interest.*paid/i,
      /loan.*payoff/i,
      /escrow/i,
      /principal.*balance/i,
      /monthly.*payment/i,
      /unpaid.*principal/i,
      /lender/i,
      /servicer/i,
      /home.*equity/i,
    ],
    docType: 'Mortgage Statement',
  },
  {
    patterns: [/1095-A/i, /1095-B/i, /1095-C/i, /health.*coverage/i],
    docType: 'Health Insurance (1095)',
  },
  {
    patterns: [/1098-E/i, /student loan interest/i],
    docType: 'Student Loan (1098-E)',
  },
  {
    patterns: [/1098-T/i, /tuition/i],
    docType: 'Tuition (1098-T)',
  },
  {
    patterns: [/charitable/i, /donation.*receipt/i, /tax.*deductible.*contribution/i],
    docType: 'Charitable Donation',
  },
];

function classifyWithPatterns(textContent: string): PageClassification {
  for (const { patterns, docType } of PATTERN_MAP) {
    const matchCount = patterns.filter((p) => p.test(textContent)).length;
    if (matchCount > 0) {
      return {
        docType,
        entityGuess: extractEntityFromText(textContent),
        taxYearGuess: extractYearFromText(textContent),
        confidence: Math.min(0.85, 0.5 + matchCount * 0.15),
        relevance: 'relevant',
      };
    }
  }

  return {
    docType: 'Other',
    entityGuess: extractEntityFromText(textContent),
    taxYearGuess: extractYearFromText(textContent),
    confidence: 0.3,
    relevance: 'uncertain',
  };
}

function extractYearFromText(text: string): string | null {
  // Look for 4-digit years in tax-relevant range
  const yearMatch = text.match(/\b(20[1-3]\d)\b/);
  return yearMatch ? yearMatch[1] : null;
}

function extractEntityFromText(text: string): string | null {
  // Look for common name patterns in tax documents
  const namePatterns = [
    /(?:Employee.s? name|Recipient.s? name|Name)[:\s]+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+){1,3})/,
    /(?:Payer.s? name|Employer.s? name)[:\s]+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+){0,4}(?:\s(?:LLC|Inc|Corp|LP|LLP))?)/,
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }

  return null;
}
