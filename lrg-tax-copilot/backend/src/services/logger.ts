import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { InteractionMode } from '../types';

// ─── JSON file storage ──────────────────────────────────────────

const DB_PATH = path.join(__dirname, '../../database/logs.json');

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

interface LogStore {
  logs: LogRecord[];
}

function readStore(): LogStore {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { logs: [] };
  }
}

function writeStore(store: LogStore): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

// ─── Public API ─────────────────────────────────────────────────
// NOTE: No user prompt text is stored — only operational metadata.

export function logRequest(entry: LogEntry): string {
  const id = uuidv4();
  const store = readStore();

  const record: LogRecord = {
    id,
    timestamp: new Date().toISOString(),
    sessionId: entry.sessionId,
    userId: entry.userId || null,
    mode: entry.mode,
    confidence: entry.confidence,
    databasesQueried: entry.databasesQueried,
    entriesRetrieved: entry.entriesRetrieved,
    guardrailFlagsTriggered: entry.guardrailFlagsTriggered,
    failureState: entry.failureState || null,
    responseDelivered: entry.responseDelivered,
    clarificationRequired: entry.clarificationRequired,
  };

  store.logs.push(record);
  writeStore(store);

  return id;
}

export function getLogsBySession(sessionId: string): LogRecord[] {
  const store = readStore();
  return store.logs
    .filter((l) => l.sessionId === sessionId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function getLogsByUser(userId: string, limit: number = 50): LogRecord[] {
  const store = readStore();
  return store.logs
    .filter((l) => l.userId === userId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}

export function getRecentLogs(limit: number = 100): LogRecord[] {
  const store = readStore();
  return store.logs
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}
