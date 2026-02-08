import Anthropic from '@anthropic-ai/sdk';
import config from '../config';
import { InteractionMode, ModeDetectionResult } from '../types';

// ─── Priority order for tie-breaking ────────────────────────────
const MODE_PRIORITY: InteractionMode[] = [
  'MODE-RR',
  'MODE-CRD',
  'MODE-PLS',
  'MODE-ITP',
  'MODE-EDU',
  'MODE-QA',
];

// ─── Keyword definitions per mode ───────────────────────────────

interface ModeSignals {
  keywords: string[];
  patterns: RegExp[];
  negativeKeywords: string[];
}

const MODE_SIGNALS: Record<InteractionMode, ModeSignals> = {
  'MODE-RR': {
    keywords: [
      'risk', 'aggressive', 'audit', 'penalty', 'defensible', 'conservative',
      'substantial authority', 'red flag', 'compliance', 'exposure', 'irs scrutiny',
      'position', 'penalties', 'risky', 'flag', 'audit risk', 'notice',
    ],
    patterns: [
      /is this (okay|risky|aggressive|defensible|conservative)/i,
      /audit (risk|exposure|flag)/i,
      /will (this|the irs|they) (flag|question|challenge|audit)/i,
      /how (risky|aggressive|safe|defensible) is/i,
      /can we (defend|justify|support) this/i,
      /substantial authority/i,
      /penalty (risk|exposure)/i,
    ],
    negativeKeywords: ['draft', 'email', 'write', 'compose', 'blog', 'post', 'fee', 'price'],
  },

  'MODE-CRD': {
    keywords: [
      'draft', 'write', 'email', 'respond', 'reply', 'compose',
      'letter', 'message', 'template', 'wording', 'response',
      'client communication', 'send', 'notify', 'inform',
    ],
    patterns: [
      /draft (a|an|the|this) (email|letter|response|reply|message)/i,
      /write (a|an|the|this) (email|letter|response|reply|message)/i,
      /how (should|do|can) (i|we) (respond|reply|word|phrase)/i,
      /compose (a|an|the)/i,
      /help me (write|draft|respond|reply)/i,
      /what (should|do) (i|we) (say|tell|write)/i,
    ],
    negativeKeywords: ['risk', 'audit', 'penalty', 'fee', 'price', 'blog', 'social media'],
  },

  'MODE-PLS': {
    keywords: [
      'fee', 'price', 'cost', 'scope', 'billing', 'included',
      'charge', 'pricing', 'quote', 'rate', 'engagement',
      'out of scope', 'additional charge', 'flat fee', 'hourly',
    ],
    patterns: [
      /how much (should|do|does|can) (we|i) charge/i,
      /what (is|are) (the|our) (fee|price|rate|cost)/i,
      /is (this|that) (included|in scope|out of scope|billable)/i,
      /scope of (the |this )?(engagement|service|work)/i,
      /additional (fee|charge|cost|billing)/i,
      /pricing (for|on|of)/i,
    ],
    negativeKeywords: ['risk', 'audit', 'draft', 'email', 'blog', 'post'],
  },

  'MODE-ITP': {
    keywords: [
      'call', 'meeting', 'talking points', 'script', 'conversation',
      'prepare for', 'phone call', 'discussion', 'explain to',
      'walk through', 'client call', 'client meeting', 'brief me',
    ],
    patterns: [
      /prepare (me |us )?(for|before) (a |the )?(call|meeting|conversation)/i,
      /talking points (for|about|on|regarding)/i,
      /how (should|do|can) (i|we) explain/i,
      /(give|provide) me (a |the )?script/i,
      /what (should|do) (i|we) (say|discuss|cover) (in|during|on|at)/i,
      /brief me (on|about|for)/i,
      /help me prepare/i,
    ],
    negativeKeywords: ['draft', 'email', 'write', 'compose', 'blog', 'fee', 'price'],
  },

  'MODE-EDU': {
    keywords: [
      'post', 'social media', 'blog', 'faq', 'educational',
      'content', 'article', 'linkedin', 'newsletter', 'explainer',
      'infographic', 'tips', 'guide', 'publish',
    ],
    patterns: [
      /write (a |an )?(blog|post|article|faq|guide|tip)/i,
      /social media (post|content|idea)/i,
      /create (a |an )?(educational|explainer|informational)/i,
      /linkedin (post|content|article)/i,
      /content (for|about|on|idea)/i,
      /newsletter (topic|idea|content|section)/i,
    ],
    negativeKeywords: ['risk', 'audit', 'penalty', 'fee', 'price', 'client call', 'meeting'],
  },

  'MODE-QA': {
    keywords: [
      'what is', 'what are', 'how does', 'how do', 'explain', 'tell me about',
      'rules for', 'requirements', 'threshold', 'limit', 'deadline',
      'irs', 'irc', 'section', 'deduction', 'credit', 'filing',
      'tax law', 'tax rules', 'tax code', 'regulation', 'statute',
      'standard deduction', 'itemized', 'exemption', 'exclusion',
      'capital gains', 'depreciation', 'amortization', 'basis',
      'withholding', 'estimated tax', 'penalty', 'extension',
      'schedule a', 'schedule b', 'schedule c', 'schedule d', 'schedule e',
      'form 1040', 'form 1099', 'form w-2', 'form w-4',
      'qualified', 'eligible', 'phase out', 'income limit',
    ],
    patterns: [
      /what (is|are) (the |a )?(rule|law|requirement|threshold|limit|deadline|rate)/i,
      /how (does|do) (the |a )?(irs|tax|deduction|credit|filing)/i,
      /explain (the |a )?(rule|law|provision|section|code|regulation)/i,
      /tell me about/i,
      /what (is|are) (the )?(standard deduction|tax bracket|filing deadline)/i,
      /can (a |the )?(taxpayer|client|person|individual) (deduct|claim|take|use|qualify)/i,
      /is (this|that|it) (taxable|deductible|excludable|exempt)/i,
      /when (is|are|do|does) (the |a )?(deadline|due date|extension|payment)/i,
      /who (qualifies|is eligible|can claim|can deduct)/i,
      /how much (can|is) (the |a )?(deduction|credit|exclusion|exemption)/i,
    ],
    negativeKeywords: ['draft', 'email', 'write', 'compose', 'blog', 'post', 'fee', 'price', 'meeting', 'call'],
  },
};

// ─── Scoring constants ──────────────────────────────────────────
const KEYWORD_WEIGHT = 0.12;
const PATTERN_WEIGHT = 0.25;
const NEGATIVE_PENALTY = 0.06;
const MAX_RULE_CONFIDENCE = 0.95;

// ─── Thresholds for LLM fallback ───────────────────────────────
const LOW_CONFIDENCE_THRESHOLD = 0.40;
const AMBIGUOUS_CONFIDENCE_THRESHOLD = 0.75;
const AMBIGUOUS_SCORE_GAP = 0.15;

// ─── Stage 1: Rule-based keyword scoring ────────────────────────

interface ScoredMode {
  mode: InteractionMode;
  score: number;
  matchedKeywords: string[];
  matchedPatterns: number;
  negativeHits: number;
}

function scoreMessage(message: string): ScoredMode[] {
  const lower = message.toLowerCase();

  const scores: ScoredMode[] = MODE_PRIORITY.map((mode) => {
    const signals = MODE_SIGNALS[mode];
    let score = 0;
    const matchedKeywords: string[] = [];

    // Keyword matches
    for (const keyword of signals.keywords) {
      if (lower.includes(keyword)) {
        score += KEYWORD_WEIGHT;
        matchedKeywords.push(keyword);
      }
    }

    // Regex pattern matches
    let matchedPatterns = 0;
    for (const pattern of signals.patterns) {
      if (pattern.test(message)) {
        score += PATTERN_WEIGHT;
        matchedPatterns++;
      }
    }

    // Negative signal penalties
    let negativeHits = 0;
    for (const neg of signals.negativeKeywords) {
      if (lower.includes(neg)) {
        score -= NEGATIVE_PENALTY;
        negativeHits++;
      }
    }

    return {
      mode,
      score: Math.max(0, Math.min(score, MAX_RULE_CONFIDENCE)),
      matchedKeywords,
      matchedPatterns,
      negativeHits,
    };
  });

  return scores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return MODE_PRIORITY.indexOf(a.mode) - MODE_PRIORITY.indexOf(b.mode);
  });
}

function buildRuleRationale(top: ScoredMode): string {
  const parts: string[] = [];
  if (top.matchedKeywords.length > 0) {
    parts.push(`keywords: [${top.matchedKeywords.join(', ')}]`);
  }
  if (top.matchedPatterns > 0) {
    parts.push(`${top.matchedPatterns} pattern match(es)`);
  }
  if (top.negativeHits > 0) {
    parts.push(`${top.negativeHits} negative signal(s)`);
  }
  return `Rule-based: ${parts.join('; ')} → score ${top.score.toFixed(2)}`;
}

// ─── Stage 2: LLM classification fallback ───────────────────────

const LLM_CLASSIFICATION_PROMPT = `You are a mode classifier for a tax firm's internal AI assistant. Given a user message from a tax professional, classify it into exactly one of these interaction modes:

MODE-RR (Risk Review): Questions about tax position risk, audit exposure, defensibility, penalties, or compliance concerns.
MODE-CRD (Client Response Drafting): Requests to draft, write, or compose emails, letters, or client communications.
MODE-PLS (Pricing Logic Support): Questions about fees, pricing, scope of engagement, billing, or what services are included.
MODE-ITP (Internal Talking Points): Requests to prepare for calls, meetings, or conversations — scripts, talking points, discussion prep.
MODE-EDU (Educational Content): Requests to create blog posts, social media content, FAQs, newsletters, or educational material.
MODE-QA (General Tax Q&A): General questions about tax law, IRS rules, deductions, credits, filing requirements, thresholds, deadlines, or any tax knowledge question. This is the DEFAULT when the message is a straightforward tax question that doesn't fit the other modes.

Respond with ONLY a JSON object in this exact format:
{"mode": "MODE-XX", "confidence": 0.XX, "rationale": "brief explanation"}

The confidence should reflect how clearly the message maps to that mode. Use values between 0.50 and 0.95.`;

async function classifyWithLLM(
  userMessage: string,
  ruleScores: ScoredMode[]
): Promise<ModeDetectionResult> {
  const client = new Anthropic({ apiKey: config.anthropicApiKey });

  const scoreContext = ruleScores
    .filter((s) => s.score > 0)
    .map((s) => `${s.mode}: ${s.score.toFixed(2)}`)
    .join(', ');

  const contextNote = scoreContext
    ? `\n\nRule-based scoring produced ambiguous results (${scoreContext}). Use your judgment to break the tie.`
    : '';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Classify this tax professional's message:

"${userMessage}"${contextNote}`,
      },
    ],
    system: LLM_CLASSIFICATION_PROMPT,
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in LLM response');

    const parsed = JSON.parse(jsonMatch[0]);
    const mode = parsed.mode as InteractionMode;

    if (!MODE_PRIORITY.includes(mode)) {
      throw new Error(`Invalid mode from LLM: ${mode}`);
    }

    return {
      mode,
      confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
      rationale: `LLM classification: ${parsed.rationale || 'no rationale provided'}`,
    };
  } catch {
    // If LLM response is unparseable, fall back to best rule-based result
    const best = ruleScores[0];
    return {
      mode: best.mode,
      confidence: Math.max(best.score, 0.30),
      rationale: `LLM fallback failed, using rule-based: ${buildRuleRationale(best)}`,
    };
  }
}

// ─── Main detection function ────────────────────────────────────

export async function detectMode(
  userMessage: string
): Promise<ModeDetectionResult> {
  const scores = scoreMessage(userMessage);
  const top = scores[0];
  const runner = scores[1];

  const topScore = top.score;
  const runnerScore = runner.score;
  const gap = topScore - runnerScore;

  // If all modes score 0, default to MODE-QA (general tax question)
  if (topScore === 0) {
    return {
      mode: 'MODE-QA',
      confidence: 0.75,
      rationale: 'Default: no specific mode signals detected, treating as general tax Q&A',
    };
  }

  // Determine if LLM fallback is needed
  const needsLLM =
    topScore < LOW_CONFIDENCE_THRESHOLD ||
    (topScore < AMBIGUOUS_CONFIDENCE_THRESHOLD && gap < AMBIGUOUS_SCORE_GAP);

  if (needsLLM && config.anthropicApiKey) {
    try {
      return await classifyWithLLM(userMessage, scores);
    } catch {
      // If LLM call fails, proceed with rule-based result
    }
  }

  return {
    mode: top.mode,
    confidence: topScore,
    rationale: buildRuleRationale(top),
  };
}

// ─── Clarifying question template ───────────────────────────────

export function getClarifyingQuestionTemplate(): string {
  return `I want to make sure I help you in the right way. Could you clarify what you're looking for?

- **Tax law question** — General questions about tax rules, deductions, credits, deadlines, or IRS guidance
- **Risk review** — Evaluating whether a tax position is defensible
- **Client response** — Drafting an email, letter, or message to a client
- **Pricing/scope** — Checking fees, what's included, or engagement scope
- **Talking points** — Preparing for a client call or meeting
- **Educational content** — Creating a blog post, FAQ, or social media content

Which of these best fits what you need?`;
}
