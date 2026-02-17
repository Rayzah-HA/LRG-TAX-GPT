import Anthropic from '@anthropic-ai/sdk';
import config from '../config';
import { InteractionMode, RetrievedEntry } from '../types';
import { SYSTEM_PROMPT_V1 } from '../prompts/systemPromptV1';
import { loadKnowledgeBase } from './knowledgeBase';
import { findBestTemplate, buildTemplateDraftingBlock } from './templateMatcher';
import { suggestTaxDomeStep, formatTaxDomeStep } from './taxdomeSteps';
import { isMultiStateQuery, classifyMatrixQuery, buildStateMatrixBlock } from './stateMatrix';
import { extractCitations, formatCitationBlock, hasCitationSection } from './citationFormatter';
import { ClientContext, formatClientContext } from './clientIntelligence';

// ─── Types ──────────────────────────────────────────────────────

export interface ClaudeCallParams {
  mode: InteractionMode;
  userMessage: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  retrievedContent: RetrievedEntry[];
  guardrailFlags: string[];
  clientContext?: ClientContext;
}

// ─── Guardrail flag → enforcement instruction mapping ───────────

const GUARDRAIL_INSTRUCTIONS: Record<string, string> = {
  NO_ESTIMATES:
    'Do not generate your own refund, liability, or savings calculations. However, if the preparer provides specific figures from a completed return, use them exactly as given.',
  NO_REFUND_AMOUNTS:
    'Do not generate your own refund, liability, or savings calculations. However, if the preparer provides specific figures from a completed return, use them exactly as given.',
  CONSERVATIVE_POSITION:
    'Apply the substantial authority threshold (IRC §6662) to all positions discussed. Flag aggressive positions and present the conservative interpretation first.',
  SUBSTANTIAL_AUTHORITY:
    'Apply the substantial authority threshold (IRC §6662) to all positions discussed. Flag aggressive positions and present the conservative interpretation first.',
  SCOPE_BOUNDARY:
    'Redirect out-of-scope requests clearly. Do not partially answer topics outside the firm\'s documented services.',
  ESCALATION_REQUIRED:
    'This topic requires firm owner review. Recommend escalation and do not provide a final answer.',
  NO_DOLLAR_AMOUNTS:
    'Do not state specific fee amounts or dollar figures unless they appear in the retrieved pricing rules.',
};

function buildGuardrailBlock(flags: string[]): string {
  if (flags.length === 0) return '';

  const seen = new Set<string>();
  const instructions: string[] = [];

  for (const flag of flags) {
    const instruction = GUARDRAIL_INSTRUCTIONS[flag];
    if (instruction && !seen.has(instruction)) {
      seen.add(instruction);
      instructions.push(`• ${instruction}`);
    }
  }

  if (instructions.length === 0) return '';

  return `
═══════════════════════════════════════
  ACTIVE GUARDRAILS FOR THIS RESPONSE
═══════════════════════════════════════

The following guardrails are triggered by the retrieved firm content. You MUST follow these in addition to all system-level guardrails:

${instructions.join('\n')}

Violation of any active guardrail is a system-level failure. Do not relax these under any circumstances.`;
}

// ─── Mode context descriptions ──────────────────────────────────

const MODE_CONTEXT: Record<InteractionMode, string> = {
  'MODE-RR':
    'INTERACTION MODE: Risk Review (MODE-RR)\n' +
    'The user is asking about the risk, defensibility, or compliance posture of a tax position. ' +
    'Focus on the substantial authority standard, potential penalties, audit exposure, and the ' +
    'conservative vs. aggressive spectrum. Always present the conservative position first.',

  'MODE-CRD':
    'INTERACTION MODE: Client Response Drafting (MODE-CRD)\n' +
    'The user needs help drafting a communication to a client. Produce professional, clear, ' +
    'and compliant language. Use any retrieved templates as a starting point. Include all ' +
    'preparer-provided figures (refund amounts, credits, deductions) exactly as given.',

  'MODE-PLS':
    'INTERACTION MODE: Pricing Logic Support (MODE-PLS)\n' +
    'The user is asking about fees, pricing, scope, or billing. Reference the firm\'s pricing ' +
    'rules and scope of services. Explain the logic behind pricing but do not state specific ' +
    'dollar amounts unless they appear in the retrieved pricing rules.',

  'MODE-ITP':
    'INTERACTION MODE: Internal Talking Points (MODE-ITP)\n' +
    'The user is preparing for a client call, meeting, or conversation. Provide structured ' +
    'talking points, key facts, and suggested language. Ensure all points comply with firm ' +
    'policies — talking points must be as compliant as written communications.',

  'MODE-EDU':
    'INTERACTION MODE: Educational Content (MODE-EDU)\n' +
    'The user wants to create educational or marketing content (blog, social media, FAQ). ' +
    'Produce accurate, general-audience tax education. Never include firm-internal guidance. ' +
    'Use plain language and include appropriate disclaimers about seeking professional advice.',

  'MODE-QA':
    'INTERACTION MODE: General Tax Q&A (MODE-QA)\n' +
    'The user is asking a general question about tax law, IRS rules, deductions, credits, ' +
    'filing requirements, thresholds, deadlines, or other tax knowledge. Provide a clear, ' +
    'accurate answer grounded in the tax knowledge base and retrieved content. Cite IRC ' +
    'sections, IRS publications, or other authority when possible. Use conditional language ' +
    '("generally," "in most cases") as tax rules have exceptions. If the knowledge base ' +
    'contains relevant information, use it. If not, answer from general tax knowledge but ' +
    'note that the user may want to verify against current IRS guidance.',

  'MODE-MTX':
    'INTERACTION MODE: Tax Matrix — Multi-State Comparison (MODE-MTX)\n' +
    'The user is asking a tax question that spans multiple states. Use the State Tax Matrix ' +
    'data provided below to answer comprehensively. Present results in a clear, formatted ' +
    'table. Always note that state tax laws change frequently and recommend verifying against ' +
    'current state Department of Revenue guidance. Include relevant caveats about local taxes ' +
    '(county, city) that may apply on top of state rates.',
};

// ─── Retrieved context block ────────────────────────────────────

function buildRetrievedContextBlock(entries: RetrievedEntry[]): string {
  if (entries.length === 0) return '';

  const sections = entries.map((entry, i) => {
    const header = `[${i + 1}] ${entry.database.toUpperCase()}: ${entry.entryName} (${entry.entryId})`;
    const flags =
      entry.guardrailFlags.length > 0
        ? `Guardrail flags: ${entry.guardrailFlags.join(', ')}`
        : '';
    const related = entry.relatedPolicy
      ? `Related policy: ${entry.relatedPolicy}`
      : '';
    const meta = [flags, related].filter(Boolean).join(' | ');

    return `${header}${meta ? '\n' + meta : ''}\n${entry.content}`;
  });

  return `
═══════════════════════════════════════
  RETRIEVED FIRM CONTENT
═══════════════════════════════════════

The following content was retrieved from the firm's knowledge base. Use it to ground your response. Do not fabricate policies, templates, or rules not present here.

${sections.join('\n\n---\n\n')}

End of retrieved content. If the user's question is not addressed by the above, say so and recommend the preparer consult the firm's full policy documentation.`;
}

// ─── Knowledge base block (selective by mode) ───────────────────

function buildKnowledgeBaseBlock(mode: InteractionMode): string {
  const kb = loadKnowledgeBase(mode);
  if (!kb) return '';

  return `
═══════════════════════════════════════
  TAX KNOWLEDGE BASE
═══════════════════════════════════════

The following tax law reference material has been loaded from the firm's knowledge base. Use this to answer tax questions accurately. This content is authoritative for the firm's purposes.

${kb}

End of tax knowledge base.`;
}

// ─── TaxDome step instruction ──────────────────────────────────

const TAXDOME_INSTRUCTION = `
═══════════════════════════════════════
  TAXDOME COMPANION
═══════════════════════════════════════

This copilot is a TaxDome companion tool. After your main response, if a logical next step exists in TaxDome (moving a client to a pipeline stage, applying a tag, creating a task, or sending a message), include it as a "Suggested Next TaxDome Step" section at the end of your response.

Format it as:
---
**Suggested Next TaxDome Step**
| Field | Value |
|---|---|
| **Stage** | [pipeline stage name] |
| **Tag** | [tag to apply] |
| **Task** | [task description] |
| **Action** | [what to do in TaxDome] |

Only include this section when a clear TaxDome action follows from the interaction. Do not force a suggestion if none is appropriate.`;

// ─── Assemble full system prompt ────────────────────────────────

function buildSystemPrompt(
  mode: InteractionMode,
  guardrailFlags: string[],
  retrievedContent: RetrievedEntry[],
  userMessage: string,
  clientContext?: ClientContext
): string {
  const parts: string[] = [
    SYSTEM_PROMPT_V1,
    '',
    MODE_CONTEXT[mode],
    TAXDOME_INSTRUCTION,
    buildKnowledgeBaseBlock(mode),
    buildGuardrailBlock(guardrailFlags),
    buildRetrievedContextBlock(retrievedContent),
  ];

  // Template-first drafting for MODE-CRD
  if (mode === 'MODE-CRD') {
    const matched = findBestTemplate(retrievedContent, userMessage);
    if (matched) {
      parts.push(buildTemplateDraftingBlock(matched, userMessage));
    }
  }

  // State Tax Matrix for MODE-MTX
  if (mode === 'MODE-MTX' || isMultiStateQuery(userMessage)) {
    const queryType = classifyMatrixQuery(userMessage);
    parts.push(buildStateMatrixBlock(queryType));
  }

  // Client Intelligence context
  if (clientContext) {
    parts.push(formatClientContext(clientContext));
  }

  return parts.filter(Boolean).join('\n\n');
}

// ─── Main API call ──────────────────────────────────────────────

export async function callClaude(params: ClaudeCallParams): Promise<string> {
  const {
    mode,
    userMessage,
    conversationHistory,
    retrievedContent,
    guardrailFlags,
    clientContext,
  } = params;

  const systemPrompt = buildSystemPrompt(
    mode, guardrailFlags, retrievedContent, userMessage, clientContext
  );

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  const client = new Anthropic({ apiKey: config.anthropicApiKey });

  // Use higher token limit for matrix queries (large table output)
  const maxTokens = mode === 'MODE-MTX' ? 4096 : 2048;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    let result = textBlock.text;

    // Auto-append citation block for research modes if not already present
    if (['MODE-QA', 'MODE-RR', 'MODE-ITP'].includes(mode) && !hasCitationSection(result)) {
      const citations = extractCitations(result);
      if (citations.length > 0) {
        result += formatCitationBlock(citations);
      }
    }

    // If Claude didn't include a TaxDome step and we can suggest one, append it
    if (!result.includes('Suggested Next TaxDome Step')) {
      const step = suggestTaxDomeStep(mode, userMessage);
      if (step) {
        result += '\n' + formatTaxDomeStep(step);
      }
    }

    return result;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      const status = error.status;
      if (status === 429) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment and try again.'
        );
      }
      if (status === 401) {
        throw new Error(
          'Authentication failed. Check the ANTHROPIC_API_KEY configuration.'
        );
      }
      if (status === 400) {
        throw new Error(
          `Invalid request to Claude API: ${error.message}`
        );
      }
      throw new Error(`Claude API error (${status}): ${error.message}`);
    }

    throw error;
  }
}
