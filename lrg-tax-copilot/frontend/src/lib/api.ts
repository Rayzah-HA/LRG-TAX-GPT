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
  async send(
    sessionId: string,
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    file?: File
  ): Promise<ChatResponse> {
    // If a file is attached, use multipart form data
    if (file) {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('userMessage', userMessage);
      formData.append('conversationHistory', JSON.stringify(conversationHistory));
      formData.append('file', file);

      const headers = getAuthHeaders();

      const response = await fetch(`${API_BASE}/chat`, {
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
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data as ChatResponse;
    }

    // Standard JSON request (no file)
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

// ─── Document Intake API ───────────────────────────────────

export interface DocPageInfo {
  pageNumber: number;
  thumbnailUrl: string;
  status: 'pending' | 'classified' | 'assigned' | 'removed';
  classification?: {
    docType: string;
    entityGuess: string | null;
    taxYearGuess: string | null;
    confidence: number;
    relevance: 'relevant' | 'irrelevant' | 'uncertain';
  };
  manualOverrides?: {
    docType?: string;
    entityGuess?: string;
    taxYearGuess?: string;
    relevance?: 'relevant' | 'irrelevant' | 'uncertain';
  };
}

export interface AssembledDoc {
  docId: string;
  docType: string;
  entity: string | null;
  taxYear: string | null;
  pageNumbers: number[];
  notes: string | null;
}

interface DocUploadResponse {
  sessionId: string;
  filename: string;
  pageCount: number;
  pages: Array<{ pageNumber: number; thumbnailUrl: string; status: string }>;
  expiresAt: string;
}

interface DocSessionResponse {
  sessionId: string;
  filename: string;
  pageCount: number;
  pages: DocPageInfo[];
  documents: AssembledDoc[];
  expiresAt: string;
  status: string;
}

interface ClassifyResponse {
  sessionId: string;
  classifications: Array<{
    pageNumber: number;
    docType: string;
    entityGuess: string | null;
    taxYearGuess: string | null;
    confidence: number;
    relevance: string;
  }>;
}

interface DocSessionSummary {
  sessionId: string;
  filename: string;
  pageCount: number;
  documentCount: number;
  status: string;
  expiresAt: string;
}

export const documentsApi = {
  async upload(file: File): Promise<DocUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.status === 401) {
      logout();
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('Session expired.');
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Upload failed');
    return data as DocUploadResponse;
  },

  listSessions() {
    return apiRequest<DocSessionSummary[]>('/documents/sessions');
  },

  getSession(sessionId: string) {
    return apiRequest<DocSessionResponse>(
      `/documents/sessions/${sessionId}`
    );
  },

  classify(sessionId: string, pageNumbers?: number[]) {
    return apiRequest<ClassifyResponse>(
      `/documents/sessions/${sessionId}/classify`,
      {
        method: 'POST',
        body: JSON.stringify({ pageNumbers }),
      }
    );
  },

  updatePage(
    sessionId: string,
    pageNumber: number,
    update: {
      docType?: string;
      entity?: string;
      taxYear?: string;
      relevance?: string;
    }
  ) {
    return apiRequest<DocPageInfo>(
      `/documents/sessions/${sessionId}/pages/${pageNumber}`,
      { method: 'PATCH', body: JSON.stringify(update) }
    );
  },

  bulkAction(
    sessionId: string,
    pageNumbers: number[],
    action: string,
    value?: string
  ) {
    return apiRequest<{ updated: number; pageNumbers: number[] }>(
      `/documents/sessions/${sessionId}/pages/bulk`,
      {
        method: 'POST',
        body: JSON.stringify({ pageNumbers, action, value }),
      }
    );
  },

  createDocument(
    sessionId: string,
    params: {
      pageNumbers: number[];
      docType: string;
      entity?: string;
      taxYear?: string;
      notes?: string;
    }
  ) {
    return apiRequest<AssembledDoc>(
      `/documents/sessions/${sessionId}/documents`,
      { method: 'POST', body: JSON.stringify(params) }
    );
  },

  deleteDocument(sessionId: string, docId: string) {
    return apiRequest<{ deleted: string }>(
      `/documents/sessions/${sessionId}/documents/${docId}`,
      { method: 'DELETE' }
    );
  },

  autoGroup(sessionId: string) {
    return apiRequest<{ created: AssembledDoc[] }>(
      `/documents/sessions/${sessionId}/auto-group`,
      { method: 'POST' }
    );
  },

  async exportZip(sessionId: string, folderTemplate?: string): Promise<Blob> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    };

    const response = await fetch(
      `${API_BASE}/documents/sessions/${sessionId}/export`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ folderTemplate }),
      }
    );

    if (response.status === 401) {
      logout();
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('Session expired.');
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(
        (data as { error?: string }).error || 'Export failed'
      );
    }

    return response.blob();
  },

  deleteSession(sessionId: string) {
    return apiRequest<{ deleted: string }>(
      `/documents/sessions/${sessionId}`,
      { method: 'DELETE' }
    );
  },

  getDocTypes() {
    return apiRequest<{ docTypes: string[] }>('/documents/doc-types');
  },
};
