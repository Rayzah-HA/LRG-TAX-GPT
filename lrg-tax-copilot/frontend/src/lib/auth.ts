const TOKEN_KEY = 'lrg_tax_copilot_token';
const USER_KEY = 'lrg_tax_copilot_user';

export interface StoredUser {
  id: string;
  username: string;
  role: 'staff' | 'firm_owner';
  displayName?: string;
  email?: string;
}

// ─── Token management ───────────────────────────────────────────

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// ─── User management ────────────────────────────────────────────

export function setUser(user: StoredUser): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function getUser(): StoredUser | null {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as StoredUser;
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function removeUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY);
  }
}

// ─── Auth state checks ──────────────────────────────────────────

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function isFirmOwner(): boolean {
  const user = getUser();
  return user?.role === 'firm_owner';
}

export function logout(): void {
  removeToken();
  removeUser();
}

// ─── Auth headers for API requests ──────────────────────────────

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}
