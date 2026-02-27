import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DocumentSession, SessionStatus } from '../types/documents';

// ─── Configuration ──────────────────────────────────────────
const TEMP_DIR = path.join(__dirname, '../../uploads/tmp');
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// ─── In-memory session store ────────────────────────────────
const sessions = new Map<string, DocumentSession>();

// ─── Initialize ─────────────────────────────────────────────

export function initTempStorage(): void {
  // Ensure temp directory exists
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Clean orphaned files from previous runs
  cleanOrphanedFiles();

  // Start background cleanup interval
  setInterval(cleanupExpiredSessions, CLEANUP_INTERVAL_MS);
}

// ─── Session management ─────────────────────────────────────

export function createSession(userId: string, filename: string): DocumentSession {
  const sessionId = crypto.randomUUID();
  const now = new Date();

  const sessionDir = path.join(TEMP_DIR, sessionId);
  fs.mkdirSync(sessionDir, { recursive: true });
  fs.mkdirSync(path.join(sessionDir, 'pages'), { recursive: true });
  fs.mkdirSync(path.join(sessionDir, 'thumbnails'), { recursive: true });

  const session: DocumentSession = {
    sessionId,
    userId,
    originalFilename: sanitizeFilename(filename),
    pageCount: 0,
    pages: [],
    documents: [],
    createdAt: now,
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
    status: 'processing',
  };

  sessions.set(sessionId, session);
  return session;
}

export function getSession(sessionId: string): DocumentSession | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  // Check expiry
  if (new Date() > session.expiresAt) {
    destroySession(sessionId);
    return undefined;
  }

  return session;
}

export function getSessionForUser(
  sessionId: string,
  userId: string
): DocumentSession | undefined {
  const session = getSession(sessionId);
  if (!session || session.userId !== userId) return undefined;
  return session;
}

export function updateSessionStatus(
  sessionId: string,
  status: SessionStatus
): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.status = status;
  }
}

export function listUserSessions(userId: string): DocumentSession[] {
  const result: DocumentSession[] = [];
  const now = new Date();

  for (const session of sessions.values()) {
    if (session.userId === userId && now <= session.expiresAt) {
      result.push(session);
    }
  }

  return result;
}

// ─── File paths ─────────────────────────────────────────────

export function getSessionDir(sessionId: string): string {
  return path.join(TEMP_DIR, sessionId);
}

export function getOriginalPdfPath(sessionId: string): string {
  return path.join(TEMP_DIR, sessionId, 'original.pdf');
}

export function getPagePdfPath(sessionId: string, pageNumber: number): string {
  return path.join(TEMP_DIR, sessionId, 'pages', `page-${pageNumber}.pdf`);
}

export function getThumbnailPath(
  sessionId: string,
  pageNumber: number
): string {
  return path.join(
    TEMP_DIR,
    sessionId,
    'thumbnails',
    `thumb-${pageNumber}.jpg`
  );
}

// ─── Destruction ────────────────────────────────────────────

export function destroySession(sessionId: string): void {
  const sessionDir = path.join(TEMP_DIR, sessionId);

  // Clear text content from memory first
  const session = sessions.get(sessionId);
  if (session) {
    for (const page of session.pages) {
      page.textContent = undefined;
    }
  }

  // Secure-delete all files
  if (fs.existsSync(sessionDir)) {
    secureDeleteDirectory(sessionDir);
  }

  // Remove from memory
  sessions.delete(sessionId);
}

// ─── Secure deletion ────────────────────────────────────────

function secureDeleteFile(filePath: string): void {
  try {
    if (!fs.existsSync(filePath)) return;

    const stat = fs.statSync(filePath);
    if (stat.isFile() && stat.size > 0) {
      // Overwrite with random bytes before deleting
      const fd = fs.openSync(filePath, 'w');
      const randomBytes = crypto.randomBytes(Math.min(stat.size, 4096));
      fs.writeSync(fd, randomBytes);
      fs.closeSync(fd);
    }
    fs.unlinkSync(filePath);
  } catch {
    // Best-effort: still try to delete even if overwrite fails
    try {
      fs.unlinkSync(filePath);
    } catch {
      // File may already be gone
    }
  }
}

function secureDeleteDirectory(dirPath: string): void {
  try {
    if (!fs.existsSync(dirPath)) return;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        secureDeleteDirectory(fullPath);
      } else {
        secureDeleteFile(fullPath);
      }
    }
    fs.rmdirSync(dirPath);
  } catch {
    // Best-effort cleanup
  }
}

// ─── Cleanup routines ───────────────────────────────────────

function cleanupExpiredSessions(): void {
  const now = new Date();
  const expired: string[] = [];

  for (const [id, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      expired.push(id);
    }
  }

  for (const id of expired) {
    destroySession(id);
    // Operational log only — no PII
    console.log(
      `[tempStorage] Expired session cleaned: ${id} at ${now.toISOString()}`
    );
  }
}

function cleanOrphanedFiles(): void {
  try {
    if (!fs.existsSync(TEMP_DIR)) return;

    const entries = fs.readdirSync(TEMP_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = path.join(TEMP_DIR, entry.name);
        // If directory exists on disk but not in memory, it's orphaned
        if (!sessions.has(entry.name)) {
          secureDeleteDirectory(fullPath);
          console.log(
            `[tempStorage] Orphaned directory cleaned: ${entry.name}`
          );
        }
      }
    }
  } catch {
    // Non-critical
  }
}

// ─── Utilities ──────────────────────────────────────────────

function sanitizeFilename(filename: string): string {
  // Remove path components, keep only the filename
  const base = path.basename(filename);
  // Replace anything that's not alphanumeric, dash, underscore, or dot
  return base.replace(/[^a-zA-Z0-9\-_.]/g, '_').substring(0, 100);
}
