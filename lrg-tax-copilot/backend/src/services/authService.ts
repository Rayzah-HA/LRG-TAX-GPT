import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import config from '../config';
import {
  User,
  UserPublic,
  UserRole,
  JWTPayload,
  LoginResponse,
} from '../types/auth';

// ─── Database initialization ────────────────────────────────────

const DB_PATH = path.join(__dirname, '../../database/auth.db');

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
  }
  return db;
}

function initializeSchema(): void {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('staff', 'firm_owner')),
      display_name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login TEXT
    )
  `);

  // Create default firm_owner if no users exist
  const count = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as {
    cnt: number;
  };

  if (count.cnt === 0) {
    const hash = bcrypt.hashSync('changeme123', config.auth.bcryptRounds);
    db.prepare(
      `INSERT INTO users (id, username, password_hash, role, display_name, email)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(uuidv4(), 'admin', hash, 'firm_owner', 'Firm Owner', 'admin@lrgtaxservice.com');
  }
}

// ─── Row → type mappers ─────────────────────────────────────────

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  role: string;
  display_name: string;
  email: string;
  is_active: number;
  created_at: string;
  last_login: string | null;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role as UserRole,
    displayName: row.display_name,
    email: row.email,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    lastLogin: row.last_login,
  };
}

function userToPublic(user: User): UserPublic {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    email: user.email,
  };
}

// ─── JWT helpers ────────────────────────────────────────────────

function signToken(user: User): string {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };
  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
  });
}

// ─── Public API ─────────────────────────────────────────────────

export function login(username: string, password: string): LoginResponse {
  const row = getDb()
    .prepare('SELECT * FROM users WHERE username = ?')
    .get(username) as UserRow | undefined;

  if (!row) {
    return { success: false, error: 'Invalid username or password' };
  }

  const user = rowToUser(row);

  if (!user.isActive) {
    return { success: false, error: 'Account is deactivated' };
  }

  if (!bcrypt.compareSync(password, user.passwordHash)) {
    return { success: false, error: 'Invalid username or password' };
  }

  // Update last login
  getDb()
    .prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?")
    .run(user.id);

  const token = signToken(user);

  return {
    success: true,
    token,
    user: userToPublic(user),
  };
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function refreshToken(token: string): LoginResponse {
  const payload = verifyToken(token);
  if (!payload) {
    return { success: false, error: 'Invalid or expired token' };
  }

  const row = getDb()
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(payload.userId) as UserRow | undefined;

  if (!row) {
    return { success: false, error: 'User not found' };
  }

  const user = rowToUser(row);

  if (!user.isActive) {
    return { success: false, error: 'Account is deactivated' };
  }

  const newToken = signToken(user);

  return {
    success: true,
    token: newToken,
    user: userToPublic(user),
  };
}

export function createUser(
  username: string,
  password: string,
  role: UserRole,
  displayName: string,
  email: string
): { success: boolean; user?: UserPublic; error?: string } {
  // Check for existing username
  const existing = getDb()
    .prepare('SELECT id FROM users WHERE username = ?')
    .get(username);

  if (existing) {
    return { success: false, error: 'Username already exists' };
  }

  const id = uuidv4();
  const hash = bcrypt.hashSync(password, config.auth.bcryptRounds);

  getDb()
    .prepare(
      `INSERT INTO users (id, username, password_hash, role, display_name, email)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(id, username, hash, role, displayName, email);

  return {
    success: true,
    user: { id, username, role, displayName, email },
  };
}

export function getAllUsers(): UserPublic[] {
  const rows = getDb()
    .prepare('SELECT * FROM users ORDER BY created_at ASC')
    .all() as UserRow[];

  return rows.map((row) => userToPublic(rowToUser(row)));
}

export function updatePassword(
  userId: string,
  newPassword: string
): { success: boolean; error?: string } {
  const row = getDb()
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(userId) as UserRow | undefined;

  if (!row) {
    return { success: false, error: 'User not found' };
  }

  const hash = bcrypt.hashSync(newPassword, config.auth.bcryptRounds);

  getDb()
    .prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    .run(hash, userId);

  return { success: true };
}

export function deactivateUser(
  userId: string
): { success: boolean; error?: string } {
  const row = getDb()
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(userId) as UserRow | undefined;

  if (!row) {
    return { success: false, error: 'User not found' };
  }

  getDb()
    .prepare('UPDATE users SET is_active = 0 WHERE id = ?')
    .run(userId);

  return { success: true };
}

export function activateUser(
  userId: string
): { success: boolean; error?: string } {
  const row = getDb()
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(userId) as UserRow | undefined;

  if (!row) {
    return { success: false, error: 'User not found' };
  }

  getDb()
    .prepare('UPDATE users SET is_active = 1 WHERE id = ?')
    .run(userId);

  return { success: true };
}

// Initialize on import
getDb();
