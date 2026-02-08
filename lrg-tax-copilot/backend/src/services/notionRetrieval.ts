import { Client } from '@notionhq/client';
import config from '../config';
import { InteractionMode, RetrievedEntry, RetrievalResult } from '../types';
import {
  ParsedPolicy,
  ParsedTemplate,
  ParsedPricingRule,
  ParsedTopicBrief,
} from '../types/notion';
import {
  parsePolicy,
  parseTemplate,
  parsePricingRule,
  parseTopicBrief,
} from './notionParser';

// ─── Placeholder data for development / unconfigured Notion ─────

const PLACEHOLDER_POLICIES: ParsedPolicy[] = [
  {
    id: 'POL-001',
    name: 'Scope of Services',
    category: 'Operations',
    content:
      'LRG Tax Services provides individual and small business tax preparation, ' +
      'tax planning consultations, and IRS notice response assistance. Out-of-scope ' +
      'services include: international tax treaty analysis, transfer pricing studies, ' +
      'tax litigation representation, and criminal tax defense. Staff must redirect ' +
      'clients to appropriate specialists for out-of-scope requests.',
    guardrailFlags: ['SCOPE_BOUNDARY'],
    effectiveDate: '2025-01-01',
    isActive: true,
  },
  {
    id: 'POL-002',
    name: 'No Estimates Policy',
    category: 'Compliance',
    content:
      'Staff and firm systems must never provide refund estimates, tax liability ' +
      'projections, or before/after comparisons to clients or within internal tools. ' +
      'All calculations must be performed by the preparer using professional tax ' +
      'software with complete taxpayer data. Verbal or written estimates — including ' +
      '"rough" or "ballpark" figures — are prohibited. Violation of this policy may ' +
      'result in disciplinary action.',
    guardrailFlags: ['NO_ESTIMATES', 'NO_REFUND_AMOUNTS'],
    effectiveDate: '2025-01-01',
    isActive: true,
  },
  {
    id: 'POL-004',
    name: 'Conservative Position Standard',
    category: 'Compliance',
    content:
      'All filing positions taken by the firm must meet the substantial authority ' +
      'standard (IRC §6662). Staff should present the conservative position first ' +
      'and only discuss alternative positions when supported by specific IRS guidance, ' +
      'court rulings, or revenue rulings. Aggressive positions that rely solely on ' +
      'lack of enforcement are prohibited. When a gray area exists, staff must ' +
      'document the authority relied upon and flag the position for reviewer approval.',
    guardrailFlags: ['CONSERVATIVE_POSITION', 'SUBSTANTIAL_AUTHORITY'],
    effectiveDate: '2025-01-01',
    isActive: true,
  },
];

const PLACEHOLDER_TEMPLATES: ParsedTemplate[] = [
  {
    id: 'TPL-001',
    name: 'Missing Documents Request',
    mode: 'MODE-CRD',
    templateBody:
      'Dear {client_name},\n\nThank you for beginning your {tax_year} tax preparation ' +
      'with LRG Tax Services. To complete your return, we still need the following ' +
      'documents:\n\n{document_list}\n\nPlease upload these through our secure portal ' +
      'or bring them to your next appointment. If you have questions about any of these ' +
      'items, please don\'t hesitate to reach out.\n\nBest regards,\n{preparer_name}\nLRG Tax Services',
    placeholders: ['client_name', 'tax_year', 'document_list', 'preparer_name'],
    relatedPolicyId: null,
  },
  {
    id: 'TPL-002',
    name: 'IRS Notice Response Cover Letter',
    mode: 'MODE-CRD',
    templateBody:
      'Dear {client_name},\n\nWe have reviewed the IRS notice ({notice_type}) dated ' +
      '{notice_date} regarding your {tax_year} return. Here is our assessment:\n\n' +
      '{assessment_summary}\n\nRecommended next steps:\n{next_steps}\n\nWe will handle ' +
      'the response on your behalf. If you have any questions, please contact our office.\n\n' +
      'Best regards,\n{preparer_name}\nLRG Tax Services',
    placeholders: [
      'client_name', 'notice_type', 'notice_date', 'tax_year',
      'assessment_summary', 'next_steps', 'preparer_name',
    ],
    relatedPolicyId: 'POL-001',
  },
];

const PLACEHOLDER_PRICING_RULES: ParsedPricingRule[] = [
  {
    id: 'PRC-001',
    name: 'Individual Return Base Pricing',
    serviceType: 'Individual Tax Return',
    basePrice: 250,
    conditions:
      'Base price covers Form 1040 with standard deductions and W-2 income only. ' +
      'Additional schedules: Schedule C (+$150), Schedule D (+$75), Schedule E (+$100), ' +
      'Rental properties (+$100 each). State returns: +$50 per state. Itemized ' +
      'deductions: +$75. Rush processing (under 48 hours): +50% surcharge.',
    guardrailFlags: ['NO_ESTIMATES'],
  },
];

const PLACEHOLDER_TOPIC_BRIEFS: ParsedTopicBrief[] = [
  {
    id: 'TPC-001',
    name: 'Home Office Deduction Overview',
    topic: 'Deductions',
    summary:
      'The home office deduction (IRC §280A) allows taxpayers who use part of their ' +
      'home regularly and exclusively for business to deduct related expenses. Two ' +
      'methods available: Regular Method (actual expenses, proportional) and Simplified ' +
      'Method ($5/sq ft, max 300 sq ft = $1,500). Employee eligibility was eliminated ' +
      'by TCJA for 2018-2025. Self-employed individuals remain eligible.',
    keyPoints: [
      'Regular and exclusive use test',
      'Simplified method: $5/sq ft, max $1,500',
      'Employees ineligible under TCJA (2018-2025)',
      'Self-employed: Schedule C deduction',
    ],
    relatedPolicyIds: ['POL-004'],
  },
  {
    id: 'TPC-002',
    name: 'Estimated Tax Payments',
    topic: 'Payments',
    summary:
      'Taxpayers generally must make estimated tax payments if they expect to owe ' +
      '$1,000 or more when their return is filed (IRC §6654). Safe harbor: pay 100% ' +
      'of prior year liability (110% if AGI > $150,000) or 90% of current year ' +
      'liability. Quarterly due dates: April 15, June 15, September 15, January 15. ' +
      'Underpayment penalties apply when safe harbor is not met.',
    keyPoints: [
      '$1,000 threshold for requirement',
      'Safe harbor: 100% prior year (110% if AGI > $150K)',
      'Quarterly due dates',
      'Underpayment penalty under IRC §6654',
    ],
    relatedPolicyIds: ['POL-002', 'POL-004'],
  },
];

// ─── Keyword extraction ─────────────────────────────────────────

const KEYWORD_TO_TOPIC_MAP: Record<string, string[]> = {
  // Deductions
  'home office': ['Deductions'],
  'deduction': ['Deductions'],
  'deductions': ['Deductions'],
  'itemize': ['Deductions'],
  'standard deduction': ['Deductions'],
  'business expense': ['Deductions'],
  'depreciation': ['Deductions'],
  'section 179': ['Deductions'],

  // Credits
  'credit': ['Credits'],
  'child tax credit': ['Credits'],
  'earned income': ['Credits'],
  'eic': ['Credits'],
  'eitc': ['Credits'],
  'education credit': ['Credits'],

  // Filing
  'filing status': ['Filing'],
  'married filing': ['Filing'],
  'head of household': ['Filing'],
  'dependent': ['Filing'],
  'extension': ['Filing'],

  // Income
  'income': ['Income'],
  'w-2': ['Income'],
  'w2': ['Income'],
  '1099': ['Income'],
  'self-employment': ['Income'],
  'rental income': ['Income'],
  'capital gains': ['Income'],

  // Payments
  'estimated tax': ['Payments'],
  'quarterly payment': ['Payments'],
  'underpayment': ['Payments'],
  'withholding': ['Payments'],
  'payment plan': ['Payments'],
  'installment': ['Payments'],

  // IRS Notices
  'irs notice': ['IRS Notices'],
  'cp2000': ['IRS Notices'],
  'audit': ['IRS Notices'],
  'letter from irs': ['IRS Notices'],
  'notice': ['IRS Notices'],

  // Business
  'llc': ['Business'],
  's-corp': ['Business'],
  's corp': ['Business'],
  'partnership': ['Business'],
  'schedule c': ['Business'],
  'business': ['Business'],
  'entity': ['Business'],
};

export function extractKeywords(userMessage: string): string[] {
  const lower = userMessage.toLowerCase();
  const matched = new Set<string>();

  for (const [keyword, topics] of Object.entries(KEYWORD_TO_TOPIC_MAP)) {
    if (lower.includes(keyword)) {
      for (const topic of topics) {
        matched.add(topic);
      }
    }
  }

  return Array.from(matched);
}

// ─── Notion client helpers ──────────────────────────────────────

function isNotionConfigured(): boolean {
  return !!(config.notionApiKey && config.notionDatabaseIds.policies);
}

function getNotionClient(): Client {
  return new Client({ auth: config.notionApiKey });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NotionPage = any;

function getProperties(page: NotionPage): Record<string, any> {
  return page.properties || {};
}

async function queryDatabase(
  notion: Client,
  databaseId: string,
  filter?: object,
  pageSize?: number
): Promise<NotionPage[]> {
  if (!databaseId) return [];

  const params: Record<string, unknown> = {
    database_id: databaseId,
    page_size: pageSize || config.retrievalLimits.perDatabase,
  };
  if (filter) params.filter = filter;

  const response = await notion.databases.query(
    params as Parameters<typeof notion.databases.query>[0]
  );
  return response.results;
}

// ─── Converters: parsed types → RetrievedEntry ──────────────────

function policyToEntry(p: ParsedPolicy, relatedPolicy?: string): RetrievedEntry {
  return {
    database: 'policies',
    entryId: p.id,
    entryName: p.name,
    content: p.content,
    guardrailFlags: p.guardrailFlags,
    relatedPolicy,
  };
}

function templateToEntry(t: ParsedTemplate): RetrievedEntry {
  return {
    database: 'templates',
    entryId: t.id,
    entryName: t.name,
    content: t.templateBody,
    guardrailFlags: [],
    relatedPolicy: t.relatedPolicyId || undefined,
  };
}

function pricingRuleToEntry(r: ParsedPricingRule): RetrievedEntry {
  const content = r.basePrice
    ? `Base price: $${r.basePrice}. ${r.conditions}`
    : r.conditions;
  return {
    database: 'pricingRules',
    entryId: r.id,
    entryName: r.name,
    content,
    guardrailFlags: r.guardrailFlags,
  };
}

function topicBriefToEntry(
  b: ParsedTopicBrief,
  excludeFirmGuidance: boolean = false
): RetrievedEntry {
  let content = b.summary;
  if (!excludeFirmGuidance && b.keyPoints.length > 0) {
    content += '\n\nKey Points:\n' + b.keyPoints.map((p) => `• ${p}`).join('\n');
  }
  return {
    database: 'topicBriefs',
    entryId: b.id,
    entryName: b.name,
    content,
    guardrailFlags: [],
    relatedPolicy: b.relatedPolicyIds[0],
  };
}

// ─── Placeholder retrieval (no Notion configured) ───────────────

function retrievePlaceholder(
  mode: InteractionMode,
  topicKeywords: string[]
): RetrievalResult {
  const entries: RetrievedEntry[] = [];

  switch (mode) {
    case 'MODE-CRD': {
      // Templates (Client Communication) + related Policies
      for (const tpl of PLACEHOLDER_TEMPLATES) {
        entries.push(templateToEntry(tpl));
      }
      // Always include scope policy for drafting
      const scopePolicy = PLACEHOLDER_POLICIES.find((p) => p.id === 'POL-001');
      if (scopePolicy) entries.push(policyToEntry(scopePolicy));
      break;
    }

    case 'MODE-RR': {
      // Always POL-004 first
      const pol004 = PLACEHOLDER_POLICIES.find((p) => p.id === 'POL-004');
      if (pol004) entries.push(policyToEntry(pol004));
      // Topic briefs matching keywords
      for (const brief of PLACEHOLDER_TOPIC_BRIEFS) {
        if (
          topicKeywords.length === 0 ||
          topicKeywords.some((k) => brief.topic.toLowerCase().includes(k.toLowerCase()))
        ) {
          entries.push(topicBriefToEntry(brief));
        }
      }
      // Additional policies (No Estimates)
      const pol002 = PLACEHOLDER_POLICIES.find((p) => p.id === 'POL-002');
      if (pol002) entries.push(policyToEntry(pol002));
      break;
    }

    case 'MODE-PLS': {
      // Pricing rules + POL-001 (Scope of Services)
      for (const rule of PLACEHOLDER_PRICING_RULES) {
        entries.push(pricingRuleToEntry(rule));
      }
      const scopePolicy = PLACEHOLDER_POLICIES.find((p) => p.id === 'POL-001');
      if (scopePolicy) entries.push(policyToEntry(scopePolicy));
      break;
    }

    case 'MODE-EDU': {
      // Topic briefs only, exclude Firm Guidance field
      for (const brief of PLACEHOLDER_TOPIC_BRIEFS) {
        if (
          topicKeywords.length === 0 ||
          topicKeywords.some((k) => brief.topic.toLowerCase().includes(k.toLowerCase()))
        ) {
          entries.push(topicBriefToEntry(brief, true));
        }
      }
      break;
    }

    case 'MODE-ITP': {
      // Topic Briefs + Policies + Templates
      for (const brief of PLACEHOLDER_TOPIC_BRIEFS) {
        if (
          topicKeywords.length === 0 ||
          topicKeywords.some((k) => brief.topic.toLowerCase().includes(k.toLowerCase()))
        ) {
          entries.push(topicBriefToEntry(brief));
        }
      }
      for (const policy of PLACEHOLDER_POLICIES) {
        entries.push(policyToEntry(policy));
      }
      for (const tpl of PLACEHOLDER_TEMPLATES) {
        entries.push(templateToEntry(tpl));
      }
      break;
    }
  }

  // Enforce total cap
  const capped = entries.slice(0, config.retrievalLimits.total);
  const truncated = entries.length > config.retrievalLimits.total;

  // Aggregate guardrail flags
  const allFlags = new Set<string>();
  for (const entry of capped) {
    for (const flag of entry.guardrailFlags) {
      allFlags.add(flag);
    }
  }

  return {
    success: true,
    mode,
    retrievedContent: capped,
    guardrailFlagsAggregate: Array.from(allFlags),
    truncated,
  };
}

// ─── Live Notion retrieval ──────────────────────────────────────

const ACTIVE_FILTER = {
  property: 'Status',
  select: { equals: 'Active' },
};

async function retrieveFromNotion(
  mode: InteractionMode,
  topicKeywords: string[]
): Promise<RetrievalResult> {
  const notion = getNotionClient();
  const entries: RetrievedEntry[] = [];
  const dbIds = config.notionDatabaseIds;
  const perDb = config.retrievalLimits.perDatabase;

  switch (mode) {
    case 'MODE-CRD': {
      // Templates with category = Client Communication
      if (dbIds.templates) {
        const templatePages = await queryDatabase(notion, dbIds.templates, {
          and: [
            ACTIVE_FILTER,
            { property: 'Category', select: { equals: 'Client Communication' } },
          ],
        }, perDb);
        for (const page of templatePages) {
          const parsed = parseTemplate(page.id, getProperties(page));
          entries.push(templateToEntry(parsed));
        }
      }
      // Related Policies
      if (dbIds.policies) {
        const policyPages = await queryDatabase(
          notion, dbIds.policies, ACTIVE_FILTER, perDb
        );
        for (const page of policyPages) {
          const parsed = parsePolicy(page.id, getProperties(page));
          entries.push(policyToEntry(parsed));
        }
      }
      break;
    }

    case 'MODE-RR': {
      // Always retrieve POL-004 first (Conservative Standard)
      if (dbIds.policies) {
        const allPolicies = await queryDatabase(
          notion, dbIds.policies, ACTIVE_FILTER, perDb
        );
        // Sort POL-004 to front by checking name
        const sorted = allPolicies.sort((a: NotionPage, b: NotionPage) => {
          const nameA = (getProperties(a).Name?.title?.[0]?.plain_text || '').toLowerCase();
          const nameB = (getProperties(b).Name?.title?.[0]?.plain_text || '').toLowerCase();
          if (nameA.includes('conservative')) return -1;
          if (nameB.includes('conservative')) return 1;
          return 0;
        });
        for (const page of sorted) {
          const parsed = parsePolicy(page.id, getProperties(page));
          entries.push(policyToEntry(parsed));
        }
      }
      // Topic Briefs matching keywords
      if (dbIds.topicBriefs) {
        const briefPages = await queryDatabase(
          notion, dbIds.topicBriefs, ACTIVE_FILTER, perDb
        );
        for (const page of briefPages) {
          const parsed = parseTopicBrief(page.id, getProperties(page));
          entries.push(topicBriefToEntry(parsed));
        }
      }
      break;
    }

    case 'MODE-PLS': {
      // Pricing Rules
      if (dbIds.pricingRules) {
        const rulePages = await queryDatabase(
          notion, dbIds.pricingRules, ACTIVE_FILTER, perDb
        );
        for (const page of rulePages) {
          const parsed = parsePricingRule(page.id, getProperties(page));
          entries.push(pricingRuleToEntry(parsed));
        }
      }
      // POL-001 (Scope of Services)
      if (dbIds.policies) {
        const policyPages = await queryDatabase(
          notion, dbIds.policies, ACTIVE_FILTER, perDb
        );
        for (const page of policyPages) {
          const parsed = parsePolicy(page.id, getProperties(page));
          if (parsed.name.toLowerCase().includes('scope')) {
            entries.push(policyToEntry(parsed));
          }
        }
      }
      break;
    }

    case 'MODE-EDU': {
      // Topic Briefs only, exclude Firm Guidance
      if (dbIds.topicBriefs) {
        const briefPages = await queryDatabase(
          notion, dbIds.topicBriefs, ACTIVE_FILTER, perDb
        );
        for (const page of briefPages) {
          const parsed = parseTopicBrief(page.id, getProperties(page));
          entries.push(topicBriefToEntry(parsed, true));
        }
      }
      break;
    }

    case 'MODE-ITP': {
      // Topic Briefs + Policies + Templates
      if (dbIds.topicBriefs) {
        const briefPages = await queryDatabase(
          notion, dbIds.topicBriefs, ACTIVE_FILTER, perDb
        );
        for (const page of briefPages) {
          const parsed = parseTopicBrief(page.id, getProperties(page));
          entries.push(topicBriefToEntry(parsed));
        }
      }
      if (dbIds.policies) {
        const policyPages = await queryDatabase(
          notion, dbIds.policies, ACTIVE_FILTER, perDb
        );
        for (const page of policyPages) {
          const parsed = parsePolicy(page.id, getProperties(page));
          entries.push(policyToEntry(parsed));
        }
      }
      if (dbIds.templates) {
        const templatePages = await queryDatabase(
          notion, dbIds.templates, ACTIVE_FILTER, perDb
        );
        for (const page of templatePages) {
          const parsed = parseTemplate(page.id, getProperties(page));
          entries.push(templateToEntry(parsed));
        }
      }
      break;
    }
  }

  // Exclude Firm Owner Only audience entries
  const filtered = entries.filter(
    (e) => !e.content.toLowerCase().includes('[firm owner only]')
  );

  // Enforce total cap
  const capped = filtered.slice(0, config.retrievalLimits.total);
  const truncated = filtered.length > config.retrievalLimits.total;

  // Aggregate guardrail flags
  const allFlags = new Set<string>();
  for (const entry of capped) {
    for (const flag of entry.guardrailFlags) {
      allFlags.add(flag);
    }
  }

  return {
    success: true,
    mode,
    retrievedContent: capped,
    guardrailFlagsAggregate: Array.from(allFlags),
    truncated,
  };
}

// ─── Main retrieval function ────────────────────────────────────

export async function retrieveContent(
  mode: InteractionMode,
  topicKeywords: string[]
): Promise<RetrievalResult> {
  if (!isNotionConfigured()) {
    return retrievePlaceholder(mode, topicKeywords);
  }

  try {
    return await retrieveFromNotion(mode, topicKeywords);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Fall back to placeholder data on Notion errors
    const fallback = retrievePlaceholder(mode, topicKeywords);
    return {
      ...fallback,
      error: `Notion retrieval failed, using placeholder data: ${message}`,
    };
  }
}
