import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { requireAuth } from '../middleware/auth';
import { detectMode, getClarifyingQuestionTemplate } from '../services/modeDetector';
import { retrieveContent, extractKeywords } from '../services/notionRetrieval';
import { callClaude } from '../services/claudeClient';
import { logRequest } from '../services/logger';
import { ChatRequest, ChatResponse } from '../types';

const router = Router();

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { sessionId, userMessage, conversationHistory } = req.body as ChatRequest;

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
      };

      res.json(response);
      return;
    }

    // Step 3: Retrieve content from Notion based on mode
    const topicKeywords = extractKeywords(userMessage);
    const retrieval = await retrieveContent(mode, topicKeywords);

    const retrievedIds = retrieval.retrievedContent.map((e) => e.entryId);
    const databasesQueried = [
      ...new Set(retrieval.retrievedContent.map((e) => e.database)),
    ];

    // Step 4: Call Claude with system prompt + retrieved content + guardrail flags
    const assistantMessage = await callClaude({
      mode,
      userMessage,
      conversationHistory: history,
      retrievedContent: retrieval.retrievedContent,
      guardrailFlags: retrieval.guardrailFlagsAggregate,
    });

    // Step 5: Log the request (no prompt text stored)
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

    // Step 6: Return response
    const response: ChatResponse = {
      success: true,
      sessionId: activeSessionId,
      detectedMode: mode,
      confidence,
      assistantMessage,
      retrievedIds,
      guardrailFlagsTriggered: retrieval.guardrailFlagsAggregate,
      clarificationRequired: false,
    };

    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';

    // Log the failure
    logRequest({
      sessionId: activeSessionId,
      userId: req.user?.userId,
      mode: 'MODE-RR', // fallback mode for logging
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
