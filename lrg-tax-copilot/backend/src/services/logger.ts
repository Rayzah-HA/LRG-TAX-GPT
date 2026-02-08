import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { InteractionMode } from '../types';

// ─── Database initialization ────────────────────────────────────

const DB_PATH = path.join(__dirname, '../../database/logs.db');

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeSchema();
  }
  return db;
}

function initializeSchema(): void {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS request_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      session_id TEXT NOT NULL,
      user_id TEXT,
      mode TEXT NOT NULL,
      confidence REAL NOT NULL,
      databases_queried TEXT NOT NULL DEFAULT '[]',
      entries_retrieved INTEGER NOT NULL DEFAULT 0,
      guardrail_flags_triggered TEXT NOT NULL DEFAULT '[]',
      failure_state TEXT,
      response_delivered INTEGER NOT NULL DEFAULT 1,
      clarification_required INTEGER NOT NULL DEFAULT 0
    )
  `);

  getDb().exec(`
    CREATE INDEX IF NOT EXISTS idx_logs_session ON request_logs (session_id);
    CREATE INDEX IF NOT EXISTS idx_logs_user ON request_logs (user_id);
    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON request_logs (timestamp DESC);
  `);
}

// ─── Types ──────────────────────────────────────────────────────

export interface LogEntry {
  sessionId: string;
  userId?: string;
  mode: InteractionMode;
  confidence: number;
  databasesQueried: string[];
  entriesRetrieved: number;
  guardrailFlagsTriggered: string[];
  failureState?: string;
  responseDelivered: boolean;
  clarificationRequired: boolean;
}

interface LogRow {
  id: string;
  timestamp: string;
  session_id: string;
  user_id: string | null;
  mode: string;
  confidence: number;
  databases_queried: string;
  entries_retrieved: number;
  guardrail_flags_triggered: string;
  failure_state: string | null;
  response_delivered: number;
  clarification_required: number;
}

export interface LogRecord {
  id: string;
  timestamp: string;
  sessionId: string;
  userId: string | null;
  mode: string;
  confidence: number;
  databasesQueried: string[];
  entriesRetrieved: number;
  guardrailFlagsTriggered: string[];
  failureState: string | null;
  responseDelivered: boolean;
  clarificationRequired: boolean;
}

function rowToRecord(row: LogRow): LogRecord {
  return {
    id: row.id,
    timestamp: row.timestamp,
    sessionId: row.session_id,
    userId: row.user_id,
    mode: row.mode,
    confidence: row.confidence,
    databasesQueried: JSON.parse(row.databases_queried),
    entriesRetrieved: row.entries_retrieved,
    guardrailFlagsTriggered: JSON.parse(row.guardrail_flags_triggered),
    failureState: row.failure_state,
    responseDelivered: row.response_delivered === 1,
    clarificationRequired: row.clarification_required === 1,
  };
}

// ─── Public API ─────────────────────────────────────────────────
// NOTE: No user prompt text is stored — only operational metadata.

export function logRequest(entry: LogEntry): string {
  const id = uuidv4();

  getDb()
    .prepare(
      `INSERT INTO request_logs
        (id, session_id, user_id, mode, confidence, databases_queried,
         entries_retrieved, guardrail_flags_triggered, failure_state,
         response_delivered, clarification_required)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      entry.sessionId,
      entry.userId || null,
      entry.mode,
      entry.confidence,
      JSON.stringify(entry.databasesQueried),
      entry.entriesRetrieved,
      JSON.stringify(entry.guardrailFlagsTriggered),
      entry.failureState || null,
      entry.responseDelivered ? 1 : 0,
      entry.clarificationRequired ? 1 : 0
    );

  return id;
}

export function getLogsBySession(sessionId: string): LogRecord[] {
  const rows = getDb()
    .prepare(
      'SELECT * FROM request_logs WHERE session_id = ? ORDER BY timestamp ASC'
    )
    .all(sessionId) as LogRow[];

  return rows.map(rowToRecord);
}

export function getLogsByUser(userId: string, limit: number = 50): LogRecord[] {
  const rows = getDb()
    .prepare(
      'SELECT * FROM request_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?'
    )
    .all(userId, limit) as LogRow[];

  return rows.map(rowToRecord);
}

export function getRecentLogs(limit: number = 100): LogRecord[] {
  const rows = getDb()
    .prepare(
      'SELECT * FROM request_logs ORDER BY timestamp DESC LIMIT ?'
    )
    .all(limit) as LogRow[];

  return rows.map(rowToRecord);
}

// Initialize on import
getDb();
