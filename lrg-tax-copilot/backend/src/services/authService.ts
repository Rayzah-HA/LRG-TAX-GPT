import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import config from '../config';
import {
  User,
  UserPublic,
  UserRole,
  JWTPayload,
  LoginResponse,
} from '../types/auth';

// ─── JSON file storage ──────────────────────────────────────────

const DB_PATH = path.join(__dirname, '../../database/users.json');

interface UsersStore {
  users: User[];
}

function readStore(): UsersStore {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { users: [] };
  }
}

function writeStore(store: UsersStore): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

function initialize(): void {
  const store = readStore();

  if (store.users.length === 0) {
    const hash = bcrypt.hashSync('changeme123', config.auth.bcryptRounds);
    store.users.push({
      id: uuidv4(),
      username: 'admin',
      passwordHash: hash,
      role: 'firm_owner',
      displayName: 'Firm Owner',
      email: 'admin@lrgtaxservice.com',
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: null,
    });
    writeStore(store);
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function userToPublic(user: User): UserPublic {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    email: user.email,
  };
}

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
  const store = readStore();
  const user = store.users.find((u) => u.username === username);

  if (!user) {
    return { success: false, error: 'Invalid username or password' };
  }

  if (!user.isActive) {
    return { success: false, error: 'Account is deactivated' };
  }

  if (!bcrypt.compareSync(password, user.passwordHash)) {
    return { success: false, error: 'Invalid username or password' };
  }

  // Update last login
  user.lastLogin = new Date().toISOString();
  writeStore(store);

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

  const store = readStore();
  const user = store.users.find((u) => u.id === payload.userId);

  if (!user) {
    return { success: false, error: 'User not found' };
  }

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
  const store = readStore();

  if (store.users.some((u) => u.username === username)) {
    return { success: false, error: 'Username already exists' };
  }

  const id = uuidv4();
  const hash = bcrypt.hashSync(password, config.auth.bcryptRounds);

  const user: User = {
    id,
    username,
    passwordHash: hash,
    role,
    displayName,
    email,
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: null,
  };

  store.users.push(user);
  writeStore(store);

  return {
    success: true,
    user: { id, username, role, displayName, email },
  };
}

export function getAllUsers(): UserPublic[] {
  const store = readStore();
  return store.users.map(userToPublic);
}

export function updatePassword(
  userId: string,
  newPassword: string
): { success: boolean; error?: string } {
  const store = readStore();
  const user = store.users.find((u) => u.id === userId);

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  user.passwordHash = bcrypt.hashSync(newPassword, config.auth.bcryptRounds);
  writeStore(store);

  return { success: true };
}

export function deactivateUser(
  userId: string
): { success: boolean; error?: string } {
  const store = readStore();
  const user = store.users.find((u) => u.id === userId);

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  user.isActive = false;
  writeStore(store);

  return { success: true };
}

export function activateUser(
  userId: string
): { success: boolean; error?: string } {
  const store = readStore();
  const user = store.users.find((u) => u.id === userId);

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  user.isActive = true;
  writeStore(store);

  return { success: true };
}

// Initialize on import
initialize();
