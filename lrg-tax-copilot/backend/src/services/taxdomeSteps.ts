import { InteractionMode } from '../types';

// ─── TaxDome Step Suggestions ───────────────────────────────
// Suggests what the preparer should do next in TaxDome based
// on the interaction mode and user message content.
// Does NOT call TaxDome APIs — output only.

export interface TaxDomeStep {
  stage: string;
  tag: string;
  task: string;
  message: string;
}

// ─── Keyword-based signal detection ─────────────────────────

interface SignalMatch {
  signal: string;
  step: TaxDomeStep;
}

const SIGNAL_STEPS: Array<{ keywords: string[]; patterns: RegExp[]; step: TaxDomeStep }> = [
  // Return ready / refund notification
  {
    keywords: ['refund', 'return ready', 'e-file', 'efile', 'ready to file', 'filing complete'],
    patterns: [/federal refund/i, /state refund/i, /ready to (e-?file|submit)/i],
    step: {
      stage: 'Review & Sign',
      tag: 'return-ready',
      task: 'Send return summary and collect e-file authorization (Form 8879)',
      message: 'Move client to "Review & Sign" stage. Send return summary via TaxDome message with e-sign request for Form 8879.',
    },
  },
  // Missing documents
  {
    keywords: ['missing', 'still need', 'documents needed', 'upload', 'provide documents'],
    patterns: [/missing (doc|document|form|w-?2|1099)/i, /need .*(doc|form|w-?2|1099)/i],
    step: {
      stage: 'Waiting on Client',
      tag: 'docs-needed',
      task: 'Send document request and set follow-up reminder (3 days)',
      message: 'Move client to "Waiting on Client" stage. Tag as "docs-needed". Create task to follow up in 3 days if documents not received.',
    },
  },
  // IRS notice response
  {
    keywords: ['notice', 'irs notice', 'cp2000', 'letter from irs', 'irs letter'],
    patterns: [/irs (notice|letter)/i, /cp\d{3,4}/i, /notice (of |from)/i],
    step: {
      stage: 'In Progress',
      tag: 'irs-notice',
      task: 'Review notice, draft response, and set IRS response deadline task',
      message: 'Move client to "In Progress" stage. Tag as "irs-notice". Create task with IRS response deadline (usually 30 or 60 days from notice date).',
    },
  },
  // Extension filing
  {
    keywords: ['extension', 'form 4868', '4868', 'extend deadline'],
    patterns: [/file.*(extension|4868)/i, /extension.*(file|submit)/i],
    step: {
      stage: 'Extension Filed',
      tag: 'extension',
      task: 'File extension and create task for extended deadline follow-up',
      message: 'Move client to "Extension Filed" stage. Tag as "extension". Create task for October 15 deadline follow-up.',
    },
  },
  // New client / engagement
  {
    keywords: ['new client', 'engagement', 'onboard', 'welcome', 'organizer'],
    patterns: [/new (client|engagement)/i, /send.*(organizer|questionnaire)/i],
    step: {
      stage: 'New Client',
      tag: 'onboarding',
      task: 'Send engagement letter and tax organizer via TaxDome',
      message: 'Set client to "New Client" stage. Send engagement letter for e-signature and tax organizer questionnaire via TaxDome.',
    },
  },
  // Payment / billing
  {
    keywords: ['invoice', 'billing', 'collect payment', 'charge', 'send invoice'],
    patterns: [/send.*(invoice|bill)/i, /collect.*payment/i],
    step: {
      stage: 'Billing',
      tag: 'payment-pending',
      task: 'Create and send invoice via TaxDome payments',
      message: 'Move client to "Billing" stage. Create invoice in TaxDome and send payment request. Tag as "payment-pending".',
    },
  },
  // E-filed / submitted
  {
    keywords: ['e-filed', 'efiled', 'submitted', 'accepted', 'irs accepted'],
    patterns: [/e-?filed/i, /return.*(submitted|accepted)/i, /irs.*accepted/i],
    step: {
      stage: 'Filed',
      tag: 'e-filed',
      task: 'Confirm e-file acceptance and send client confirmation',
      message: 'Move client to "Filed" stage. Tag as "e-filed". Send acceptance confirmation message to client via TaxDome.',
    },
  },
  // Follow up / check in
  {
    keywords: ['follow up', 'followup', 'check in', 'reminder', 'status update'],
    patterns: [/follow[\s-]?up/i, /check[\s-]?in/i, /status.*update/i],
    step: {
      stage: '(Keep current stage)',
      tag: 'follow-up',
      task: 'Send follow-up message and create next follow-up task',
      message: 'Keep client in current stage. Send follow-up message via TaxDome. Create a new follow-up task for 3-5 days out.',
    },
  },
  // Tax planning
  {
    keywords: ['tax planning', 'projection', 'estimated tax', 'quarterly', 'next year'],
    patterns: [/tax.*(planning|projection)/i, /estimated.*(tax|payment)/i],
    step: {
      stage: 'Tax Planning',
      tag: 'planning',
      task: 'Schedule tax planning consultation and send prep questionnaire',
      message: 'Move client to "Tax Planning" stage. Tag as "planning". Schedule consultation appointment in TaxDome calendar.',
    },
  },
];

/**
 * Suggests the next TaxDome step based on mode and message content.
 */
export function suggestTaxDomeStep(
  mode: InteractionMode,
  userMessage: string
): TaxDomeStep | null {
  const lower = userMessage.toLowerCase();
  let bestMatch: { step: TaxDomeStep; score: number } | null = null;

  for (const signal of SIGNAL_STEPS) {
    let score = 0;

    for (const kw of signal.keywords) {
      if (lower.includes(kw)) score += 1;
    }

    for (const pattern of signal.patterns) {
      pattern.lastIndex = 0;
      if (pattern.test(userMessage)) score += 2;
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { step: signal.step, score };
    }
  }

  // If no signal match, provide a mode-based default
  if (!bestMatch) {
    return getModeDefaultStep(mode);
  }

  return bestMatch.step;
}

function getModeDefaultStep(mode: InteractionMode): TaxDomeStep | null {
  switch (mode) {
    case 'MODE-CRD':
      return {
        stage: '(Depends on message type)',
        tag: 'client-comm',
        task: 'Send drafted message to client via TaxDome',
        message: 'After finalizing the draft, send it to the client as a TaxDome message or email.',
      };
    case 'MODE-PLS':
      return {
        stage: 'Billing',
        tag: 'pricing-review',
        task: 'Create or update invoice based on pricing determination',
        message: 'Update the client invoice in TaxDome to reflect the discussed pricing.',
      };
    default:
      return null; // No suggestion for QA, EDU, etc.
  }
}

/**
 * Formats a TaxDome step suggestion as a string block for the response.
 */
export function formatTaxDomeStep(step: TaxDomeStep): string {
  return [
    '',
    '---',
    '**Suggested Next TaxDome Step**',
    `| Field | Value |`,
    `|---|---|`,
    `| **Stage** | ${step.stage} |`,
    `| **Tag** | \`${step.tag}\` |`,
    `| **Task** | ${step.task} |`,
    `| **Action** | ${step.message} |`,
  ].join('\n');
}
