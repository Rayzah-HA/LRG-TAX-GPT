import fs from 'fs';
import path from 'path';
import { InteractionMode } from '../types';

// ─── Knowledge base directory ────────────────────────────────
const KB_DIR = path.join(__dirname, '../../knowledge');

// ─── Mode → file keyword mapping ────────────────────────────
// Files are selected based on keywords in their filename.
// A file can match multiple modes. MODE-QA gets everything.

const MODE_FILE_KEYWORDS: Record<InteractionMode, string[]> = {
  'MODE-RR': ['deductions', 'credits', 'income', 'brackets', 'obbba', 'filing', 'citations', 'publications'],
  'MODE-CRD': ['templates', 'deadlines', 'filing', 'communication'],
  'MODE-PLS': ['pricing', 'scope', 'services'],
  'MODE-ITP': ['deductions', 'credits', 'income', 'brackets', 'deadlines', 'obbba', 'filing', 'citations'],
  'MODE-EDU': ['deductions', 'credits', 'income', 'brackets', 'deadlines', 'obbba', 'filing'],
  'MODE-QA': [], // empty = load ALL files
  'MODE-MTX': ['filing', 'brackets', 'rates', 'deductions'], // State matrix uses its own data service
};

// ─── Cache per mode ──────────────────────────────────────────
const cache = new Map<string, { content: string; timestamp: number }>();
const CACHE_TTL_MS = 60_000;

function readAllFiles(): Array<{ name: string; content: string }> {
  if (!fs.existsSync(KB_DIR)) {
    fs.mkdirSync(KB_DIR, { recursive: true });
    return [];
  }

  return fs
    .readdirSync(KB_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .sort()
    .map((f) => ({
      name: f,
      content: fs.readFileSync(path.join(KB_DIR, f), 'utf-8').trim(),
    }))
    .filter((f) => f.content.length > 0);
}

function fileMatchesMode(filename: string, mode: InteractionMode): boolean {
  const keywords = MODE_FILE_KEYWORDS[mode];
  if (keywords.length === 0) return true; // MODE-QA loads everything
  const lower = filename.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

/**
 * Loads knowledge base files filtered by mode.
 * MODE-QA loads everything. Other modes load only relevant files.
 */
export function loadKnowledgeBase(mode?: InteractionMode): string {
  const cacheKey = mode || '__all__';
  const now = Date.now();
  const cached = cache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.content;
  }

  const allFiles = readAllFiles();

  const filtered = mode
    ? allFiles.filter((f) => fileMatchesMode(f.name, mode))
    : allFiles;

  const sections = filtered.map((f) => {
    const title = f.name.replace(/\.md$/, '').replace(/[-_]/g, ' ');
    return `── ${title} ──\n${f.content}`;
  });

  const result = sections.join('\n\n');
  cache.set(cacheKey, { content: result, timestamp: now });
  return result;
}

/**
 * Returns a list of knowledge base file names (for diagnostics).
 */
export function listKnowledgeFiles(): string[] {
  if (!fs.existsSync(KB_DIR)) return [];
  return fs
    .readdirSync(KB_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();
}
