import fs from 'fs';
import path from 'path';

// ─── Knowledge base directory ────────────────────────────────
const KB_DIR = path.join(__dirname, '../../knowledge');

// ─── Cache ───────────────────────────────────────────────────
let cachedContent: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // Reload files every 60 seconds

/**
 * Loads all .md files from the knowledge/ directory and
 * returns their combined content as a single string.
 * Results are cached for 60 seconds so hot-reloading works
 * without reading disk on every request.
 */
export function loadKnowledgeBase(): string {
  const now = Date.now();
  if (cachedContent !== null && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedContent;
  }

  if (!fs.existsSync(KB_DIR)) {
    fs.mkdirSync(KB_DIR, { recursive: true });
    cachedContent = '';
    cacheTimestamp = now;
    return '';
  }

  const files = fs
    .readdirSync(KB_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();

  if (files.length === 0) {
    cachedContent = '';
    cacheTimestamp = now;
    return '';
  }

  const sections: string[] = [];

  for (const file of files) {
    const filePath = path.join(KB_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    if (content) {
      const title = file.replace(/\.md$/, '').replace(/[-_]/g, ' ');
      sections.push(`── ${title} ──\n${content}`);
    }
  }

  cachedContent = sections.join('\n\n');
  cacheTimestamp = now;
  return cachedContent;
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
