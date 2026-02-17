export type InteractionMode =
  | 'MODE-RR'
  | 'MODE-CRD'
  | 'MODE-PLS'
  | 'MODE-ITP'
  | 'MODE-EDU'
  | 'MODE-QA'
  | 'MODE-MTX';

export interface ModeDetectionResult {
  mode: InteractionMode;
  confidence: number;
  rationale: string;
}

export interface RetrievedEntry {
  database: string;
  entryId: string;
  entryName: string;
  content: string;
  guardrailFlags: string[];
  relatedPolicy?: string;
}

export interface RetrievalResult {
  success: boolean;
  mode: InteractionMode;
  retrievedContent: RetrievedEntry[];
  guardrailFlagsAggregate: string[];
  truncated: boolean;
  error?: string;
}

export interface ChatRequest {
  sessionId: string;
  userMessage: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ChatResponse {
  success: boolean;
  sessionId: string;
  detectedMode: InteractionMode;
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
  citations?: Array<{
    type: string;
    reference: string;
  }>;
  error?: string;
}
