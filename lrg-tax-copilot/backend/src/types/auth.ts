export type UserRole = 'staff' | 'firm_owner';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  displayName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export interface UserPublic {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
  email: string;
}

export interface JWTPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: UserPublic;
  error?: string;
}
