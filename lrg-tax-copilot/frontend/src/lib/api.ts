import { getAuthHeaders, logout } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Generic request helper ─────────────────────────────────────

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

// ─── Auth API ───────────────────────────────────────────────────

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    username: string;
    role: 'staff' | 'firm_owner';
    displayName: string;
    email: string;
  };
  error?: string;
}

interface MeResponse {
  success: boolean;
  user: {
    userId: string;
    username: string;
    role: 'staff' | 'firm_owner';
  };
}

interface UserPublic {
  id: string;
  username: string;
  role: 'staff' | 'firm_owner';
  displayName: string;
  email: string;
}

interface UsersResponse {
  success: boolean;
  users: UserPublic[];
}

interface CreateUserParams {
  username: string;
  password: string;
  role: 'staff' | 'firm_owner';
  displayName: string;
  email?: string;
}

export const authApi = {
  login(username: string, password: string) {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  me() {
    return apiRequest<MeResponse>('/auth/me');
  },

  changePassword(newPassword: string) {
    return apiRequest<{ success: boolean }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  },

  getUsers() {
    return apiRequest<UsersResponse>('/auth/users');
  },

  createUser(params: CreateUserParams) {
    return apiRequest<{ success: boolean; user: UserPublic }>('/auth/users', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
};

// ─── Chat API ───────────────────────────────────────────────────

interface ChatResponse {
  success: boolean;
  sessionId: string;
  detectedMode: string;
  confidence: number;
  assistantMessage: string;
  retrievedIds: string[];
  guardrailFlagsTriggered: string[];
  clarificationRequired: boolean;
  piiWarnings?: Array<{ type: string; redacted: string }>;
  taxdomeStep?: {
    stage: string;
    tag: string;
    task: string;
    message: string;
  };
  clientContext?: {
    clientName: string;
    filingStatus?: string;
    state?: string;
    lastInteraction: string;
  };
  citations?: Array<{ type: string; reference: string }>;
  error?: string;
}

export const chatApi = {
  send(
    sessionId: string,
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ) {
    return apiRequest<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({ sessionId, userMessage, conversationHistory }),
    });
  },
};

// ─── Knowledge Base API ──────────────────────────────────────

interface KnowledgeFile {
  name: string;
  size: number;
  modified: string;
}

interface KnowledgeFilesResponse {
  success: boolean;
  files: KnowledgeFile[];
}

interface UploadResponse {
  success: boolean;
  filename: string;
  originalName: string;
  extractedLength: number;
  error?: string;
}

export const knowledgeApi = {
  listFiles() {
    return apiRequest<KnowledgeFilesResponse>('/knowledge/files');
  },

  async upload(file: File): Promise<UploadResponse> {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const formData = new FormData();
    formData.append('file', file);

    const headers = getAuthHeaders();

    const response = await fetch(`${API_BASE}/knowledge/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.status === 401) {
      logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please log in again.');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Upload failed with status ${response.status}`);
    }

    return data as UploadResponse;
  },

  deleteFile(filename: string) {
    return apiRequest<{ success: boolean; deleted: string }>(`/knowledge/files/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });
  },
};

// ─── Client Intelligence API ─────────────────────────────────

interface ClientSummary {
  clientName: string;
  filingStatus?: string;
  state?: string;
  businessType?: string;
  interactions: number;
  lastInteraction: string;
}

interface ClientsResponse {
  success: boolean;
  clients: ClientSummary[];
}

export const clientsApi = {
  list() {
    return apiRequest<ClientsResponse>('/clients');
  },
};
