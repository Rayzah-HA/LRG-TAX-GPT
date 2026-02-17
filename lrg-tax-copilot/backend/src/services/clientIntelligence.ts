import fs from 'fs';
import path from 'path';

// ─── Client Intelligence ──────────────────────────────────
// Automatically extracts and remembers client details from
// conversations. Persists to JSON file, no database required.

export interface ClientContext {
  clientName: string;
  filingStatus?: string;
  state?: string;
  dependents?: number;
  businessType?: string;
  notes: string[];
  lastInteraction: string;
  interactions: number;
}

interface ClientStore {
  [userId: string]: {
    [clientNameKey: string]: ClientContext;
  };
}

// ─── Storage ──────────────────────────────────────────────

const STORE_DIR = path.join(__dirname, '../../data');
const STORE_FILE = path.join(STORE_DIR, 'client-intelligence.json');

function ensureStoreDir(): void {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
}

function loadStore(): ClientStore {
  ensureStoreDir();
  if (!fs.existsSync(STORE_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeStore(store: ClientStore): void {
  ensureStoreDir();
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

// ─── Client name extraction ───────────────────────────────

const CLIENT_NAME_PATTERNS = [
  /(?:client|taxpayer|customer)\s+(?:named?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/i,
  /(?:for|about|regarding)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})(?:'s|\s+return|\s+tax|\s+file|\s+account)/i,
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})(?:'s\s+(?:return|refund|tax|filing|W-2|1099|documents?))/,
  /(?:Mr\.|Mrs\.|Ms\.|Dr\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/,
];

// Common non-name words to filter out
const NON_NAMES = new Set([
  'the', 'this', 'that', 'their', 'schedule', 'form', 'standard',
  'married', 'single', 'federal', 'state', 'filing', 'jointly',
  'separately', 'draft', 'write', 'email', 'irs', 'notice',
  'my client', 'the client', 'a client',
]);

export interface ExtractedClientInfo {
  clientName: string;
  filingStatus?: string;
  state?: string;
  dependents?: number;
  businessType?: string;
  notes: string[];
}

// ─── Filing status extraction ─────────────────────────────

const FILING_STATUS_MAP: Record<string, string> = {
  'single': 'Single',
  'married filing jointly': 'Married Filing Jointly',
  'mfj': 'Married Filing Jointly',
  'married filing separately': 'Married Filing Separately',
  'mfs': 'Married Filing Separately',
  'head of household': 'Head of Household',
  'hoh': 'Head of Household',
  'qualifying widow': 'Qualifying Surviving Spouse',
  'qualifying surviving spouse': 'Qualifying Surviving Spouse',
};

// ─── State extraction ─────────────────────────────────────

const US_STATES: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC',
};

const STATE_ABBREVS = new Set(Object.values(US_STATES));

// ─── Business type extraction ─────────────────────────────

const BUSINESS_TYPES: Record<string, string> = {
  'sole proprietor': 'Sole Proprietorship',
  'sole prop': 'Sole Proprietorship',
  'schedule c': 'Sole Proprietorship',
  's-corp': 'S-Corporation',
  's corp': 'S-Corporation',
  '1120s': 'S-Corporation',
  'c-corp': 'C-Corporation',
  'c corp': 'C-Corporation',
  '1120': 'C-Corporation',
  'partnership': 'Partnership',
  '1065': 'Partnership',
  'llc': 'LLC',
  'nonprofit': 'Nonprofit',
  'non-profit': 'Nonprofit',
  '990': 'Nonprofit',
};

/**
 * Extracts client details from a user message.
 * Returns null if no client name is found.
 */
export function extractClientInfo(message: string): ExtractedClientInfo | null {
  // Try to find a client name
  let clientName: string | null = null;

  for (const pattern of CLIENT_NAME_PATTERNS) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate.length > 2 && !NON_NAMES.has(candidate.toLowerCase())) {
        clientName = candidate;
        break;
      }
    }
  }

  if (!clientName) return null;

  const lower = message.toLowerCase();
  const info: ExtractedClientInfo = {
    clientName,
    notes: [],
  };

  // Extract filing status
  for (const [key, value] of Object.entries(FILING_STATUS_MAP)) {
    if (lower.includes(key)) {
      info.filingStatus = value;
      break;
    }
  }

  // Extract state
  for (const [stateName, abbrev] of Object.entries(US_STATES)) {
    if (lower.includes(stateName)) {
      info.state = abbrev;
      break;
    }
  }
  // Also check for 2-letter abbreviations at word boundaries
  if (!info.state) {
    const abbrevMatch = message.match(/\b([A-Z]{2})\b/g);
    if (abbrevMatch) {
      for (const abbr of abbrevMatch) {
        if (STATE_ABBREVS.has(abbr)) {
          info.state = abbr;
          break;
        }
      }
    }
  }

  // Extract dependents count
  const depMatch = lower.match(/(\d+)\s*dependent/);
  if (depMatch) {
    info.dependents = parseInt(depMatch[1], 10);
  }

  // Extract business type
  for (const [key, value] of Object.entries(BUSINESS_TYPES)) {
    if (lower.includes(key)) {
      info.businessType = value;
      break;
    }
  }

  // Extract notable details as notes
  const notePatterns = [
    /refund.*?\$[\d,]+/i,
    /owes.*?\$[\d,]+/i,
    /balance due.*?\$[\d,]+/i,
    /income.*?\$[\d,]+/i,
    /extension filed/i,
    /amended return/i,
    /irs notice/i,
    /first.?time filer/i,
    /self.?employed/i,
    /rental (property|income)/i,
  ];

  for (const pattern of notePatterns) {
    const match = message.match(pattern);
    if (match) {
      info.notes.push(match[0]);
    }
  }

  return info;
}

/**
 * Gets stored context for a specific client.
 */
export function getClientContext(userId: string, clientName: string): ClientContext | null {
  const store = loadStore();
  const userStore = store[userId];
  if (!userStore) return null;

  const key = clientName.toLowerCase().trim();
  return userStore[key] || null;
}

/**
 * Saves or updates client context from extracted info.
 */
export function saveClientContext(userId: string, info: ExtractedClientInfo): void {
  const store = loadStore();
  if (!store[userId]) store[userId] = {};

  const key = info.clientName.toLowerCase().trim();
  const existing = store[userId][key];

  const updated: ClientContext = {
    clientName: info.clientName,
    filingStatus: info.filingStatus || existing?.filingStatus,
    state: info.state || existing?.state,
    dependents: info.dependents ?? existing?.dependents,
    businessType: info.businessType || existing?.businessType,
    notes: existing ? [...new Set([...existing.notes, ...info.notes])].slice(-20) : info.notes,
    lastInteraction: new Date().toISOString(),
    interactions: (existing?.interactions || 0) + 1,
  };

  store[userId][key] = updated;
  writeStore(store);
}

/**
 * Lists all clients for a user.
 */
export function listClients(userId: string): ClientContext[] {
  const store = loadStore();
  const userStore = store[userId];
  if (!userStore) return [];
  return Object.values(userStore).sort(
    (a, b) => new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime()
  );
}

/**
 * Formats client context for injection into the system prompt.
 */
export function formatClientContext(ctx: ClientContext): string {
  const parts = [`Client: ${ctx.clientName}`];
  if (ctx.filingStatus) parts.push(`Filing Status: ${ctx.filingStatus}`);
  if (ctx.state) parts.push(`State: ${ctx.state}`);
  if (ctx.dependents !== undefined) parts.push(`Dependents: ${ctx.dependents}`);
  if (ctx.businessType) parts.push(`Business Type: ${ctx.businessType}`);
  if (ctx.notes.length > 0) parts.push(`Recent Notes: ${ctx.notes.slice(-5).join('; ')}`);
  parts.push(`Previous Interactions: ${ctx.interactions}`);
  parts.push(`Last Seen: ${new Date(ctx.lastInteraction).toLocaleDateString()}`);

  return `
═══════════════════════════════════════
  CLIENT INTELLIGENCE
═══════════════════════════════════════

The following client context was automatically recalled from previous interactions. Use this to personalize your response and maintain continuity.

${parts.join('\n')}

This context is automatically maintained — no manual data entry required.`;
}
