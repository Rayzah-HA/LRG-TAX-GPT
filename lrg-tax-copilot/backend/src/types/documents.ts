// ─── Document Intake Assistant Types ─────────────────────────

export const DOC_TYPES = [
  'W-2',
  '1099-NEC',
  '1099-K',
  '1099-INT',
  '1099-DIV',
  '1099-MISC',
  '1099-R',
  '1099-G',
  '1099-B',
  '1099-SA',
  'SSA-1099',
  'K-1',
  'Schedule C',
  'Bank Statement',
  'Invoice/Receipt',
  'Corporate Filing',
  'Property Tax',
  'Mortgage Statement',
  'Health Insurance (1095)',
  'Student Loan (1098-E)',
  'Tuition (1098-T)',
  'Charitable Donation',
  'Other',
  'Irrelevant',
] as const;

export type DocType = (typeof DOC_TYPES)[number];

export type Relevance = 'relevant' | 'irrelevant' | 'uncertain';

export type PageStatus = 'pending' | 'classified' | 'assigned' | 'removed';

export type SessionStatus =
  | 'processing'
  | 'ready'
  | 'exporting'
  | 'exported'
  | 'expired';

export interface PageClassification {
  docType: DocType | string;
  entityGuess: string | null;
  taxYearGuess: string | null;
  confidence: number;
  relevance: Relevance;
}

export interface PageInfo {
  pageNumber: number;
  textContent?: string;       // in memory only, never persisted or logged
  thumbnailPath: string;
  pdfPagePath: string;
  classification?: PageClassification;
  manualOverrides?: Partial<PageClassification>;
  status: PageStatus;
}

export interface AssembledDocument {
  docId: string;
  docType: string;
  entity: string | null;
  taxYear: string | null;
  pageNumbers: number[];
  notes: string | null;
}

export interface DocumentSession {
  sessionId: string;
  userId: string;
  originalFilename: string;   // sanitized
  pageCount: number;
  pages: PageInfo[];
  documents: AssembledDocument[];
  createdAt: Date;
  expiresAt: Date;
  status: SessionStatus;
}

// ─── API Request / Response ──────────────────────────────────

export interface UploadResponse {
  sessionId: string;
  filename: string;
  pageCount: number;
  pages: Array<{
    pageNumber: number;
    thumbnailUrl: string;
    status: PageStatus;
  }>;
  expiresAt: string;
}

export interface ClassifyRequest {
  pageNumbers?: number[];
}

export interface ClassifyResponse {
  sessionId: string;
  classifications: Array<{
    pageNumber: number;
    docType: string;
    entityGuess: string | null;
    taxYearGuess: string | null;
    confidence: number;
    relevance: Relevance;
  }>;
}

export interface PageUpdateRequest {
  docType?: string;
  entity?: string;
  taxYear?: string;
  relevance?: Relevance | 'removed';
  notes?: string;
}

export interface BulkActionRequest {
  pageNumbers: number[];
  action:
    | 'assign_type'
    | 'assign_entity'
    | 'mark_irrelevant'
    | 'mark_removed'
    | 'restore';
  value?: string;
}

export interface CreateDocumentRequest {
  pageNumbers: number[];
  docType: string;
  entity?: string;
  taxYear?: string;
  notes?: string;
}

export interface ExportRequest {
  folderTemplate?: string;
}

export interface SessionResponse {
  sessionId: string;
  filename: string;
  pageCount: number;
  pages: Array<{
    pageNumber: number;
    thumbnailUrl: string;
    status: PageStatus;
    classification?: PageClassification;
    manualOverrides?: Partial<PageClassification>;
  }>;
  documents: AssembledDocument[];
  expiresAt: string;
  status: SessionStatus;
}
