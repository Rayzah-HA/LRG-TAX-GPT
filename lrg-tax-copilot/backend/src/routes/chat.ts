import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { requireAuth } from '../middleware/auth';
import { detectMode, getClarifyingQuestionTemplate } from '../services/modeDetector';
import { retrieveContent, extractKeywords } from '../services/notionRetrieval';
import { callClaude } from '../services/claudeClient';
import { logRequest } from '../services/logger';
import { detectPII } from '../services/piiDetector';
import { suggestTaxDomeStep } from '../services/taxdomeSteps';
import { extractClientInfo, getClientContext, ClientContext } from '../services/clientIntelligence';
import { ChatRequest, ChatResponse } from '../types';
import { extractDocumentText } from '../services/documentTextExtractor';

const router = Router();

// Multer for optional file attachment in chat
const chatUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Use PDF, PNG, JPEG, or WebP.'));
    }
  },
});

router.post('/', requireAuth, chatUpload.single('file'), async (req: Request, res: Response) => {
  // Support both JSON body and multipart form data
  let sessionId: string | undefined;
  let userMessage: string | undefined;
  let conversationHistory: ChatRequest['conversationHistory'] | undefined;

  if (req.is('multipart/form-data')) {
    sessionId = req.body.sessionId;
    userMessage = req.body.userMessage;
    try {
      conversationHistory = req.body.conversationHistory
        ? JSON.parse(req.body.conversationHistory)
        : [];
    } catch {
      conversationHistory = [];
    }
  } else {
    const body = req.body as ChatRequest;
    sessionId = body.sessionId;
    userMessage = body.userMessage;
    conversationHistory = body.conversationHistory;
  }

  if (!userMessage || typeof userMessage !== 'string') {
    res.status(400).json({
      success: false,
      error: 'userMessage is required',
    } as Partial<ChatResponse>);
    return;
  }

  const activeSessionId = sessionId || uuidv4();
  const history = Array.isArray(conversationHistory) ? conversationHistory : [];

  try {
    // Step 0a: Extract text from attached document (if any)
    let documentContext: string | undefined;
    if (req.file) {
      try {
        documentContext = await extractDocumentText(
          req.file.buffer,
          req.file.mimetype
        );
        console.log(
          `[chat] Document attached: type=${req.file.mimetype} extractedLength=${documentContext?.length || 0}`
        );
      } catch (err) {
        console.log(`[chat] Document text extraction failed: ${err}`);
      }
    }

    // Step 0b: PII detection (warn, don't block)
    const piiResults = detectPII(userMessage);

    // Step 1: Detect mode
    const detection = await detectMode(userMessage);
    const { mode, confidence } = detection;

    // Step 2: If confidence below threshold, return clarifying question
    if (confidence < config.confidenceThreshold) {
      const clarifyingMessage = getClarifyingQuestionTemplate();

      logRequest({
        sessionId: activeSessionId,
        userId: req.user?.userId,
        mode,
        confidence,
        databasesQueried: [],
        entriesRetrieved: 0,
        guardrailFlagsTriggered: [],
        responseDelivered: true,
        clarificationRequired: true,
      });

      const response: ChatResponse = {
        success: true,
        sessionId: activeSessionId,
        detectedMode: mode,
        confidence,
        assistantMessage: clarifyingMessage,
        retrievedIds: [],
        guardrailFlagsTriggered: [],
        clarificationRequired: true,
        piiWarnings: piiResults.length > 0
          ? piiResults.map((p) => ({ type: p.type, redacted: p.redacted }))
          : undefined,
      };

      res.json(response);
      return;
    }

    // Step 3: Extract client context (Client Intelligence)
    const userId = req.user?.userId || 'anonymous';
    const clientInfo = extractClientInfo(userMessage);
    let clientContext: ClientContext | null = null;
    if (clientInfo) {
      clientContext = getClientContext(userId, clientInfo.clientName);
    }

    // Step 4: Retrieve content from Notion based on mode
    const topicKeywords = extractKeywords(userMessage);
    const retrieval = await retrieveContent(mode, topicKeywords);

    const retrievedIds = retrieval.retrievedContent.map((e) => e.entryId);
    const databasesQueried = [
      ...new Set(retrieval.retrievedContent.map((e) => e.database)),
    ];

    // Step 5: Call Claude with system prompt + retrieved content + guardrail flags
    const assistantMessage = await callClaude({
      mode,
      userMessage,
      conversationHistory: history,
      retrievedContent: retrieval.retrievedContent,
      guardrailFlags: retrieval.guardrailFlagsAggregate,
      clientContext: clientContext || undefined,
      documentContext,
    });

    // Step 6: Auto-save client context from the conversation
    if (clientInfo) {
      const { saveClientContext } = await import('../services/clientIntelligence');
      saveClientContext(userId, clientInfo);
    }

    // Step 7: Suggest TaxDome step
    const taxdomeStep = suggestTaxDomeStep(mode, userMessage) || undefined;

    // Step 8: Log the request (no prompt text stored)
    logRequest({
      sessionId: activeSessionId,
      userId: req.user?.userId,
      mode,
      confidence,
      databasesQueried,
      entriesRetrieved: retrieval.retrievedContent.length,
      guardrailFlagsTriggered: retrieval.guardrailFlagsAggregate,
      responseDelivered: true,
      clarificationRequired: false,
    });

    // Step 9: Return response
    const response: ChatResponse = {
      success: true,
      sessionId: activeSessionId,
      detectedMode: mode,
      confidence,
      assistantMessage,
      retrievedIds,
      guardrailFlagsTriggered: retrieval.guardrailFlagsAggregate,
      clarificationRequired: false,
      piiWarnings: piiResults.length > 0
        ? piiResults.map((p) => ({ type: p.type, redacted: p.redacted }))
        : undefined,
      taxdomeStep,
      clientContext: clientContext
        ? {
            clientName: clientContext.clientName,
            filingStatus: clientContext.filingStatus,
            state: clientContext.state,
            lastInteraction: clientContext.lastInteraction,
          }
        : undefined,
    };

    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';

    logRequest({
      sessionId: activeSessionId,
      userId: req.user?.userId,
      mode: 'MODE-RR',
      confidence: 0,
      databasesQueried: [],
      entriesRetrieved: 0,
      guardrailFlagsTriggered: [],
      failureState: message,
      responseDelivered: false,
      clarificationRequired: false,
    });

    const status = message.includes('Rate limit') ? 429 : 500;

    res.status(status).json({
      success: false,
      sessionId: activeSessionId,
      error: message,
    } as Partial<ChatResponse>);
  }
});

export default router;
