import { InteractionMode } from '../types';

// ─── State Tax Matrix ─────────────────────────────────────
// Handles multi-state tax queries, formatting results for
// comparison across all 50 states + DC.

export interface StateInfo {
  abbrev: string;
  name: string;
  incomeType: 'progressive' | 'flat' | 'none';
  topRate: number | null;
  standardDeduction: number | null;
  notes: string;
}

// ─── State Tax Data (TY 2025) ────────────────────────────

export const STATE_TAX_DATA: StateInfo[] = [
  { abbrev: 'AL', name: 'Alabama', incomeType: 'progressive', topRate: 5.0, standardDeduction: 2500, notes: 'Deductible federal income tax' },
  { abbrev: 'AK', name: 'Alaska', incomeType: 'none', topRate: null, standardDeduction: null, notes: 'No state income tax' },
  { abbrev: 'AZ', name: 'Arizona', incomeType: 'flat', topRate: 2.5, standardDeduction: 14600, notes: 'Flat rate since 2023' },
  { abbrev: 'AR', name: 'Arkansas', incomeType: 'progressive', topRate: 3.9, standardDeduction: 2340, notes: 'Rate reduced from 4.4% in 2025' },
  { abbrev: 'CA', name: 'California', incomeType: 'progressive', topRate: 13.3, standardDeduction: 5540, notes: 'Highest state rate in US; mental health surcharge above $1M' },
  { abbrev: 'CO', name: 'Colorado', incomeType: 'flat', topRate: 4.4, standardDeduction: 14600, notes: 'Flat rate; conforms to federal standard deduction' },
  { abbrev: 'CT', name: 'Connecticut', incomeType: 'progressive', topRate: 6.99, standardDeduction: null, notes: 'No standard deduction; uses personal exemption and credit' },
  { abbrev: 'DE', name: 'Delaware', incomeType: 'progressive', topRate: 6.6, standardDeduction: 3250, notes: 'No sales tax' },
  { abbrev: 'FL', name: 'Florida', incomeType: 'none', topRate: null, standardDeduction: null, notes: 'No state income tax' },
  { abbrev: 'GA', name: 'Georgia', incomeType: 'flat', topRate: 5.39, standardDeduction: 12000, notes: 'Transitioning to flat rate; rate decreasing annually' },
  { abbrev: 'HI', name: 'Hawaii', incomeType: 'progressive', topRate: 11.0, standardDeduction: 2200, notes: '12 brackets; high top rate' },
  { abbrev: 'ID', name: 'Idaho', incomeType: 'flat', topRate: 5.695, standardDeduction: 14600, notes: 'Switched to flat rate 2023' },
  { abbrev: 'IL', name: 'Illinois', incomeType: 'flat', topRate: 4.95, standardDeduction: null, notes: 'Flat rate; no standard deduction; uses personal exemption' },
  { abbrev: 'IN', name: 'Indiana', incomeType: 'flat', topRate: 3.05, standardDeduction: null, notes: 'Flat rate; county taxes apply; rate decreasing' },
  { abbrev: 'IA', name: 'Iowa', incomeType: 'flat', topRate: 3.8, standardDeduction: 14600, notes: 'Switched to flat rate 2025' },
  { abbrev: 'KS', name: 'Kansas', incomeType: 'progressive', topRate: 5.7, standardDeduction: 3500, notes: '3 brackets' },
  { abbrev: 'KY', name: 'Kentucky', incomeType: 'flat', topRate: 4.0, standardDeduction: 3160, notes: 'Flat rate; considering further reductions' },
  { abbrev: 'LA', name: 'Louisiana', incomeType: 'flat', topRate: 3.0, standardDeduction: 12500, notes: 'Switched to flat rate 2025; federal income tax no longer deductible' },
  { abbrev: 'ME', name: 'Maine', incomeType: 'progressive', topRate: 7.15, standardDeduction: 14600, notes: 'Conforms to federal standard deduction' },
  { abbrev: 'MD', name: 'Maryland', incomeType: 'progressive', topRate: 5.75, standardDeduction: 2550, notes: 'County piggyback taxes 2.25%–3.2%' },
  { abbrev: 'MA', name: 'Massachusetts', incomeType: 'flat', topRate: 5.0, standardDeduction: null, notes: 'Flat rate; 4% millionaire surtax above $1M' },
  { abbrev: 'MI', name: 'Michigan', incomeType: 'flat', topRate: 4.25, standardDeduction: null, notes: 'Flat rate; uses personal exemption' },
  { abbrev: 'MN', name: 'Minnesota', incomeType: 'progressive', topRate: 9.85, standardDeduction: 14575, notes: '4 brackets; high top rate' },
  { abbrev: 'MS', name: 'Mississippi', incomeType: 'flat', topRate: 4.7, standardDeduction: 2300, notes: 'Transitioning to flat rate; first $10K exempt' },
  { abbrev: 'MO', name: 'Missouri', incomeType: 'progressive', topRate: 4.8, standardDeduction: 14600, notes: 'Rate decreasing; conforms to federal standard deduction' },
  { abbrev: 'MT', name: 'Montana', incomeType: 'flat', topRate: 5.9, standardDeduction: 14600, notes: 'Switched to flat rate 2024' },
  { abbrev: 'NE', name: 'Nebraska', incomeType: 'progressive', topRate: 5.84, standardDeduction: 8350, notes: 'Rate decreasing; Social Security fully exempt by 2025' },
  { abbrev: 'NV', name: 'Nevada', incomeType: 'none', topRate: null, standardDeduction: null, notes: 'No state income tax' },
  { abbrev: 'NH', name: 'New Hampshire', incomeType: 'none', topRate: null, standardDeduction: null, notes: 'Interest & dividends tax fully repealed 2025' },
  { abbrev: 'NJ', name: 'New Jersey', incomeType: 'progressive', topRate: 10.75, standardDeduction: null, notes: 'No standard deduction; high top rate above $1M' },
  { abbrev: 'NM', name: 'New Mexico', incomeType: 'progressive', topRate: 5.9, standardDeduction: 14600, notes: 'Conforms to federal standard deduction' },
  { abbrev: 'NY', name: 'New York', incomeType: 'progressive', topRate: 10.9, standardDeduction: 8000, notes: 'NYC additional 3.876%; high top rate' },
  { abbrev: 'NC', name: 'North Carolina', incomeType: 'flat', topRate: 4.5, standardDeduction: 14600, notes: 'Flat rate; rate decreasing annually toward 3.99%' },
  { abbrev: 'ND', name: 'North Dakota', incomeType: 'flat', topRate: 1.95, standardDeduction: 14600, notes: 'Lowest state income tax rate; first $44,725 exempt' },
  { abbrev: 'OH', name: 'Ohio', incomeType: 'progressive', topRate: 3.5, standardDeduction: null, notes: 'No standard deduction; first $26,050 exempt' },
  { abbrev: 'OK', name: 'Oklahoma', incomeType: 'progressive', topRate: 4.75, standardDeduction: 6350, notes: '6 brackets' },
  { abbrev: 'OR', name: 'Oregon', incomeType: 'progressive', topRate: 9.9, standardDeduction: 2745, notes: 'High top rate; no sales tax' },
  { abbrev: 'PA', name: 'Pennsylvania', incomeType: 'flat', topRate: 3.07, standardDeduction: null, notes: 'Flat rate; no standard deduction; many exclusions' },
  { abbrev: 'RI', name: 'Rhode Island', incomeType: 'progressive', topRate: 5.99, standardDeduction: 10550, notes: '3 brackets' },
  { abbrev: 'SC', name: 'South Carolina', incomeType: 'progressive', topRate: 6.2, standardDeduction: 14600, notes: 'Transitioning to lower top rate' },
  { abbrev: 'SD', name: 'South Dakota', incomeType: 'none', topRate: null, standardDeduction: null, notes: 'No state income tax' },
  { abbrev: 'TN', name: 'Tennessee', incomeType: 'none', topRate: null, standardDeduction: null, notes: 'No state income tax (Hall tax fully repealed 2021)' },
  { abbrev: 'TX', name: 'Texas', incomeType: 'none', topRate: null, standardDeduction: null, notes: 'No state income tax' },
  { abbrev: 'UT', name: 'Utah', incomeType: 'flat', topRate: 4.55, standardDeduction: null, notes: 'Flat rate; uses tax credit instead of standard deduction' },
  { abbrev: 'VT', name: 'Vermont', incomeType: 'progressive', topRate: 8.75, standardDeduction: 14600, notes: 'Conforms to federal standard deduction' },
  { abbrev: 'VA', name: 'Virginia', incomeType: 'progressive', topRate: 5.75, standardDeduction: 8000, notes: '4 brackets; standard deduction doubled 2022' },
  { abbrev: 'WA', name: 'Washington', incomeType: 'none', topRate: null, standardDeduction: null, notes: 'No state income tax; 7% capital gains tax above $270K' },
  { abbrev: 'WV', name: 'West Virginia', incomeType: 'progressive', topRate: 5.12, standardDeduction: null, notes: 'Rate cuts planned; uses personal exemption' },
  { abbrev: 'WI', name: 'Wisconsin', incomeType: 'progressive', topRate: 7.65, standardDeduction: 13230, notes: '4 brackets; flat rate proposed' },
  { abbrev: 'WY', name: 'Wyoming', incomeType: 'none', topRate: null, standardDeduction: null, notes: 'No state income tax' },
  { abbrev: 'DC', name: 'District of Columbia', incomeType: 'progressive', topRate: 10.75, standardDeduction: 14600, notes: 'High top rate above $1M' },
];

// States with no income tax
export const NO_INCOME_TAX_STATES = STATE_TAX_DATA
  .filter((s) => s.incomeType === 'none')
  .map((s) => s.abbrev);

// ─── Query classification ─────────────────────────────────

export type MatrixQueryType =
  | 'rates'          // income tax rates comparison
  | 'deductions'     // standard deduction comparison
  | 'no-tax'         // which states have no income tax
  | 'general'        // general multi-state query
  | 'specific-state'; // specific state lookup

const QUERY_PATTERNS: Array<{ type: MatrixQueryType; patterns: RegExp[] }> = [
  {
    type: 'rates',
    patterns: [
      /tax rat/i, /income tax/i, /highest.*rate/i, /lowest.*rate/i,
      /flat.*(rate|tax)/i, /progressive.*(rate|tax)/i, /top.*rate/i,
    ],
  },
  {
    type: 'deductions',
    patterns: [
      /standard deduction/i, /state.*deduction/i, /deduction.*state/i,
    ],
  },
  {
    type: 'no-tax',
    patterns: [
      /no.*(state|income) tax/i, /no tax.*state/i, /state.*no tax/i,
      /tax.?free state/i, /zero.*(state|income) tax/i,
    ],
  },
];

export function classifyMatrixQuery(message: string): MatrixQueryType {
  for (const { type, patterns } of QUERY_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(message)) return type;
    }
  }
  return 'general';
}

/**
 * Detects if a message is a multi-state query.
 */
export function isMultiStateQuery(message: string): boolean {
  const stateComparePatterns = [
    /all\s+(?:50\s+)?states/i,
    /every\s+state/i,
    /state[\s-]by[\s-]state/i,
    /across\s+(?:all\s+)?states/i,
    /compare\s+(?:state|tax)/i,
    /(?:which|what)\s+states?\s+(?:have|has|don't|do not|doesn't)/i,
    /state\s+(?:tax\s+)?(?:comparison|matrix|breakdown|overview)/i,
    /(?:highest|lowest|best|worst)\s+(?:state\s+)?(?:tax|income tax|rate)/i,
    /multi[\s-]?state/i,
  ];

  return stateComparePatterns.some((p) => p.test(message));
}

/**
 * Builds a state tax context block for the system prompt.
 */
export function buildStateMatrixBlock(queryType: MatrixQueryType): string {
  let content: string;

  switch (queryType) {
    case 'no-tax':
      content = formatNoTaxStates();
      break;
    case 'rates':
      content = formatRateComparison();
      break;
    case 'deductions':
      content = formatDeductionComparison();
      break;
    default:
      content = formatFullMatrix();
  }

  return `
═══════════════════════════════════════
  STATE TAX MATRIX
═══════════════════════════════════════

Present this data as a clean, formatted table in your response. The user asked a multi-state tax question — use this reference data to answer comprehensively.

${content}

Notes:
- Data reflects TY 2025 rates and thresholds.
- State tax laws change frequently — recommend verifying against current state DOR guidance.
- Rates shown are top marginal rates for individual income tax.
- Standard deductions shown are for single filers where applicable.`;
}

function formatNoTaxStates(): string {
  const noTax = STATE_TAX_DATA.filter((s) => s.incomeType === 'none');
  const lines = noTax.map((s) => `| ${s.abbrev} | ${s.name} | ${s.notes} |`);

  return `**States With No Individual Income Tax**

| State | Name | Notes |
|-------|------|-------|
${lines.join('\n')}`;
}

function formatRateComparison(): string {
  const withTax = STATE_TAX_DATA
    .filter((s) => s.incomeType !== 'none')
    .sort((a, b) => (b.topRate || 0) - (a.topRate || 0));

  const lines = withTax.map((s) =>
    `| ${s.abbrev} | ${s.name} | ${s.incomeType} | ${s.topRate}% | ${s.notes} |`
  );

  return `**State Income Tax Rates (Highest to Lowest)**

| State | Name | Type | Top Rate | Notes |
|-------|------|------|----------|-------|
${lines.join('\n')}

**No Income Tax States:** ${NO_INCOME_TAX_STATES.join(', ')}`;
}

function formatDeductionComparison(): string {
  const withDed = STATE_TAX_DATA
    .filter((s) => s.standardDeduction !== null)
    .sort((a, b) => (b.standardDeduction || 0) - (a.standardDeduction || 0));

  const lines = withDed.map((s) =>
    `| ${s.abbrev} | ${s.name} | $${s.standardDeduction?.toLocaleString()} | ${s.notes} |`
  );

  const noDed = STATE_TAX_DATA
    .filter((s) => s.incomeType !== 'none' && s.standardDeduction === null)
    .map((s) => s.abbrev);

  return `**State Standard Deductions (Single Filer, Highest to Lowest)**

| State | Name | Std Deduction | Notes |
|-------|------|---------------|-------|
${lines.join('\n')}

**States with no standard deduction (use exemptions/credits):** ${noDed.join(', ')}
**States with no income tax:** ${NO_INCOME_TAX_STATES.join(', ')}`;
}

function formatFullMatrix(): string {
  const lines = STATE_TAX_DATA.map((s) => {
    const rate = s.topRate !== null ? `${s.topRate}%` : 'N/A';
    const ded = s.standardDeduction !== null ? `$${s.standardDeduction.toLocaleString()}` : 'N/A';
    return `| ${s.abbrev} | ${s.name} | ${s.incomeType} | ${rate} | ${ded} | ${s.notes} |`;
  });

  return `**Complete State Tax Matrix (All 50 States + DC)**

| State | Name | Tax Type | Top Rate | Std Deduction | Notes |
|-------|------|----------|----------|---------------|-------|
${lines.join('\n')}`;
}
