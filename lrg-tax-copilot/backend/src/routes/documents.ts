import { Router, Request, Response } from 'express';
import multer from 'multer';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  createSession,
  getSessionForUser,
  destroySession,
  updateSessionStatus,
  getPagePdfPath,
  getThumbnailPath,
  listUserSessions,
} from '../services/tempStorage';
import { processUploadedPdf, mergePages } from '../services/documentProcessor';
import { classifyPage } from '../services/documentClassifier';
import {
  BulkActionRequest,
  CreateDocumentRequest,
  PageUpdateRequest,
  DOC_TYPES,
} from '../types/documents';
import fs from 'fs';
import path from 'path';

const router = Router();

// ─── Multer config: memory storage, PDF only, 25MB ─────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are accepted'));
    }
  },
});

// ─── POST /documents/upload ─────────────────────────────────

router.post(
  '/upload',
  requireAuth,
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const userId = req.user!.userId;

      // Create session
      const session = createSession(userId, req.file.originalname);

      // Log operational metadata only — no filenames or PII
      console.log(
        `[documents] Upload started: session=${session.sessionId} size=${req.file.size} user=${userId}`
      );

      // Process PDF: split pages, generate thumbnails, extract text
      const pages = await processUploadedPdf(
        session.sessionId,
        req.file.buffer
      );

      session.pages = pages;
      session.pageCount = pages.length;
      session.status = 'ready';

      console.log(
        `[documents] Upload processed: session=${session.sessionId} pages=${pages.length}`
      );

      return res.json({
        sessionId: session.sessionId,
        filename: session.originalFilename,
        pageCount: session.pageCount,
        pages: pages.map((p) => ({
          pageNumber: p.pageNumber,
          thumbnailUrl: `/documents/sessions/${session.sessionId}/pages/${p.pageNumber}/thumbnail`,
          status: p.status,
        })),
        expiresAt: session.expiresAt.toISOString(),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Upload failed';
      console.error(`[documents] Upload error: ${message}`);
      return res.status(500).json({ error: message });
    }
  }
);

// ─── GET /documents/sessions ────────────────────────────────

router.get(
  '/sessions',
  requireAuth,
  (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const sessions = listUserSessions(userId);

    return res.json(
      sessions.map((s) => ({
        sessionId: s.sessionId,
        filename: s.originalFilename,
        pageCount: s.pageCount,
        documentCount: s.documents.length,
        status: s.status,
        expiresAt: s.expiresAt.toISOString(),
      }))
    );
  }
);

// ─── GET /documents/sessions/:sessionId ─────────────────────

router.get(
  '/sessions/:sessionId',
  requireAuth,
  (req: Request, res: Response) => {
    const session = getSessionForUser(
      String(req.params.sessionId),
      req.user!.userId
    );
    if (!session) {
      return res
        .status(404)
        .json({ error: 'Session not found or expired' });
    }

    return res.json({
      sessionId: session.sessionId,
      filename: session.originalFilename,
      pageCount: session.pageCount,
      pages: session.pages.map((p) => ({
        pageNumber: p.pageNumber,
        thumbnailUrl: `/documents/sessions/${session.sessionId}/pages/${p.pageNumber}/thumbnail`,
        status: p.status,
        classification: p.classification,
        manualOverrides: p.manualOverrides,
      })),
      documents: session.documents,
      expiresAt: session.expiresAt.toISOString(),
      status: session.status,
    });
  }
);

// ─── GET /documents/sessions/:id/pages/:n/thumbnail ─────────

router.get(
  '/sessions/:sessionId/pages/:pageNumber/thumbnail',
  requireAuth,
  (req: Request, res: Response) => {
    const session = getSessionForUser(
      String(req.params.sessionId),
      req.user!.userId
    );
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const pageNum = parseInt(String(req.params.pageNumber), 10);
    const thumbPath = getThumbnailPath(session.sessionId, pageNum);

    if (!fs.existsSync(thumbPath) || fs.statSync(thumbPath).size === 0) {
      // Return a 1x1 placeholder if thumbnail wasn't generated
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(
        '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="200" fill="#1f2937">' +
          '<rect width="150" height="200"/>' +
          `<text x="75" y="100" text-anchor="middle" fill="#9ca3af" font-size="14">Page ${pageNum}</text>` +
          '</svg>'
      );
    }

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return res.sendFile(thumbPath);
  }
);

// ─── POST /documents/sessions/:id/classify ──────────────────

router.post(
  '/sessions/:sessionId/classify',
  requireAuth,
  async (req: Request, res: Response) => {
    const session = getSessionForUser(
      String(req.params.sessionId),
      req.user!.userId
    );
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const { pageNumbers } = req.body as { pageNumbers?: number[] };

    // Determine which pages to classify
    const targetPages = pageNumbers
      ? session.pages.filter((p) => pageNumbers.includes(p.pageNumber))
      : session.pages.filter((p) => p.status === 'pending');

    console.log(
      `[documents] Classification started: session=${session.sessionId} pages=${targetPages.length}`
    );

    const classifications = [];

    for (const page of targetPages) {
      const result = await classifyPage(
        page.pageNumber,
        page.textContent || '',
        page.thumbnailPath
      );

      page.classification = result;
      page.status = 'classified';

      classifications.push({
        pageNumber: page.pageNumber,
        docType: result.docType,
        entityGuess: result.entityGuess,
        taxYearGuess: result.taxYearGuess,
        confidence: result.confidence,
        relevance: result.relevance,
      });

      // Log doc type + confidence only — no entity names
      console.log(
        `[documents] Classified page ${page.pageNumber}: type=${result.docType} confidence=${result.confidence.toFixed(2)}`
      );
    }

    return res.json({
      sessionId: session.sessionId,
      classifications,
    });
  }
);

// ─── PATCH /documents/sessions/:id/pages/:n ─────────────────

router.patch(
  '/sessions/:sessionId/pages/:pageNumber',
  requireAuth,
  (req: Request, res: Response) => {
    const session = getSessionForUser(
      String(req.params.sessionId),
      req.user!.userId
    );
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const pageNum = parseInt(String(req.params.pageNumber), 10);
    const page = session.pages.find((p) => p.pageNumber === pageNum);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const update = req.body as PageUpdateRequest;

    // Apply manual overrides
    if (!page.manualOverrides) {
      page.manualOverrides = {};
    }

    if (update.docType !== undefined) {
      page.manualOverrides.docType = update.docType;
    }
    if (update.entity !== undefined) {
      page.manualOverrides.entityGuess = update.entity;
    }
    if (update.taxYear !== undefined) {
      page.manualOverrides.taxYearGuess = update.taxYear;
    }
    if (update.relevance === 'removed') {
      page.status = 'removed';
    } else if (update.relevance !== undefined) {
      page.manualOverrides.relevance = update.relevance;
      if (page.status === 'removed') page.status = 'classified';
    }

    return res.json({
      pageNumber: page.pageNumber,
      status: page.status,
      classification: page.classification,
      manualOverrides: page.manualOverrides,
    });
  }
);

// ─── POST /documents/sessions/:id/pages/bulk ────────────────

router.post(
  '/sessions/:sessionId/pages/bulk',
  requireAuth,
  (req: Request, res: Response) => {
    const session = getSessionForUser(
      String(req.params.sessionId),
      req.user!.userId
    );
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const { pageNumbers, action, value } = req.body as BulkActionRequest;

    if (!pageNumbers || !Array.isArray(pageNumbers) || !action) {
      return res
        .status(400)
        .json({ error: 'pageNumbers and action are required' });
    }

    const affected = session.pages.filter((p) =>
      pageNumbers.includes(p.pageNumber)
    );

    for (const page of affected) {
      if (!page.manualOverrides) page.manualOverrides = {};

      switch (action) {
        case 'assign_type':
          if (value) page.manualOverrides.docType = value;
          break;
        case 'assign_entity':
          if (value) page.manualOverrides.entityGuess = value;
          break;
        case 'mark_irrelevant':
          page.manualOverrides.relevance = 'irrelevant';
          break;
        case 'mark_removed':
          page.status = 'removed';
          break;
        case 'restore':
          page.status = page.classification ? 'classified' : 'pending';
          if (page.manualOverrides.relevance) {
            delete page.manualOverrides.relevance;
          }
          break;
      }
    }

    return res.json({
      updated: affected.length,
      pageNumbers: affected.map((p) => p.pageNumber),
    });
  }
);

// ─── POST /documents/sessions/:id/documents ─────────────────

router.post(
  '/sessions/:sessionId/documents',
  requireAuth,
  (req: Request, res: Response) => {
    const session = getSessionForUser(
      String(req.params.sessionId),
      req.user!.userId
    );
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const body = req.body as CreateDocumentRequest;

    if (
      !body.pageNumbers ||
      !Array.isArray(body.pageNumbers) ||
      !body.docType
    ) {
      return res
        .status(400)
        .json({ error: 'pageNumbers and docType are required' });
    }

    // Verify all pages exist and aren't removed
    for (const pn of body.pageNumbers) {
      const page = session.pages.find((p) => p.pageNumber === pn);
      if (!page) {
        return res
          .status(400)
          .json({ error: `Page ${pn} not found` });
      }
      if (page.status === 'removed') {
        return res
          .status(400)
          .json({ error: `Page ${pn} is marked as removed` });
      }
    }

    const doc = {
      docId: uuidv4(),
      docType: body.docType,
      entity: body.entity || null,
      taxYear: body.taxYear || null,
      pageNumbers: body.pageNumbers.sort((a, b) => a - b),
      notes: body.notes || null,
    };

    session.documents.push(doc);

    // Mark pages as assigned
    for (const pn of body.pageNumbers) {
      const page = session.pages.find((p) => p.pageNumber === pn);
      if (page) page.status = 'assigned';
    }

    return res.json(doc);
  }
);

// ─── DELETE /documents/sessions/:id/documents/:docId ────────

router.delete(
  '/sessions/:sessionId/documents/:docId',
  requireAuth,
  (req: Request, res: Response) => {
    const session = getSessionForUser(
      String(req.params.sessionId),
      req.user!.userId
    );
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const docId = String(req.params.docId);
    const docIndex = session.documents.findIndex((d) => d.docId === docId);
    if (docIndex === -1) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = session.documents[docIndex];

    // Unassign pages
    for (const pn of doc.pageNumbers) {
      const page = session.pages.find((p) => p.pageNumber === pn);
      if (page && page.status === 'assigned') {
        page.status = page.classification ? 'classified' : 'pending';
      }
    }

    session.documents.splice(docIndex, 1);

    return res.json({ deleted: docId });
  }
);

// ─── POST /documents/sessions/:id/auto-group ────────────────
// Automatically creates documents by grouping pages with same doc type + entity

router.post(
  '/sessions/:sessionId/auto-group',
  requireAuth,
  (req: Request, res: Response) => {
    const session = getSessionForUser(
      String(req.params.sessionId),
      req.user!.userId
    );
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Group classified, non-removed, unassigned pages
    const eligible = session.pages.filter(
      (p) =>
        p.status === 'classified' &&
        p.classification &&
        (p.manualOverrides?.relevance || p.classification.relevance) !==
          'irrelevant'
    );

    const groups = new Map<
      string,
      { docType: string; entity: string | null; taxYear: string | null; pages: number[] }
    >();

    for (const page of eligible) {
      const docType =
        page.manualOverrides?.docType ||
        page.classification!.docType;
      const entity =
        page.manualOverrides?.entityGuess ??
        page.classification!.entityGuess;
      const taxYear =
        page.manualOverrides?.taxYearGuess ??
        page.classification!.taxYearGuess;

      const key = `${docType}||${entity || ''}||${taxYear || ''}`;

      if (!groups.has(key)) {
        groups.set(key, { docType, entity, taxYear, pages: [] });
      }
      groups.get(key)!.pages.push(page.pageNumber);
    }

    // Create documents from groups
    const created = [];
    for (const group of groups.values()) {
      const doc = {
        docId: uuidv4(),
        docType: group.docType,
        entity: group.entity,
        taxYear: group.taxYear,
        pageNumbers: group.pages.sort((a, b) => a - b),
        notes: null,
      };

      session.documents.push(doc);

      for (const pn of group.pages) {
        const page = session.pages.find((p) => p.pageNumber === pn);
        if (page) page.status = 'assigned';
      }

      created.push(doc);
    }

    return res.json({ created });
  }
);

// ─── POST /documents/sessions/:id/export ────────────────────

router.post(
  '/sessions/:sessionId/export',
  requireAuth,
  async (req: Request, res: Response) => {
    const session = getSessionForUser(
      String(req.params.sessionId),
      req.user!.userId
    );
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.documents.length === 0) {
      return res
        .status(400)
        .json({ error: 'No documents assembled for export' });
    }

    updateSessionStatus(session.sessionId, 'exporting');

    const { folderTemplate } = (req.body || {}) as {
      folderTemplate?: string;
    };
    const template = folderTemplate || '{tax_year}/{entity}/{doc_type}';

    console.log(
      `[documents] Export started: session=${session.sessionId} docs=${session.documents.length}`
    );

    try {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="LRG-export-${new Date().toISOString().slice(0, 10)}.zip"`
      );

      const archive = archiver('zip', { zlib: { level: 6 } });
      archive.pipe(res);

      // Build index CSV
      const csvRows = [
        'doc_id,doc_type,entity,tax_year,page_range,notes',
      ];

      for (const doc of session.documents) {
        // Merge pages into single PDF
        const pagePaths = doc.pageNumbers.map((pn) =>
          getPagePdfPath(session.sessionId, pn)
        );
        const mergedPdf = await mergePages(pagePaths);

        // Build folder path from template
        const folderPath = template
          .replace('{tax_year}', sanitize(doc.taxYear || 'Unknown_Year'))
          .replace('{entity}', sanitize(doc.entity || 'Unassigned'))
          .replace('{doc_type}', sanitize(doc.docType));

        const filename = `${sanitize(doc.docType)}.pdf`;
        const fullPath = `${folderPath}/${filename}`;

        // Avoid duplicate filenames by appending page range
        const uniquePath = `${folderPath}/${sanitize(doc.docType)}_p${doc.pageNumbers[0]}-${doc.pageNumbers[doc.pageNumbers.length - 1]}.pdf`;

        archive.append(mergedPdf, { name: uniquePath });

        // CSV row
        const pageRange = `${doc.pageNumbers[0]}-${doc.pageNumbers[doc.pageNumbers.length - 1]}`;
        csvRows.push(
          `${doc.docId},${csvEscape(doc.docType)},${csvEscape(doc.entity || '')},${csvEscape(doc.taxYear || '')},${pageRange},${csvEscape(doc.notes || '')}`
        );
      }

      // Add index.csv
      archive.append(csvRows.join('\n'), { name: 'index.csv' });

      await archive.finalize();

      console.log(
        `[documents] Export complete: session=${session.sessionId}`
      );

      // Schedule cleanup after response completes
      res.on('finish', () => {
        destroySession(session.sessionId);
        console.log(
          `[documents] Session cleaned after export: ${session.sessionId}`
        );
      });
    } catch (error) {
      updateSessionStatus(session.sessionId, 'ready');
      const message =
        error instanceof Error ? error.message : 'Export failed';
      console.error(`[documents] Export error: ${message}`);
      if (!res.headersSent) {
        return res.status(500).json({ error: message });
      }
    }
  }
);

// ─── DELETE /documents/sessions/:sessionId ──────────────────

router.delete(
  '/sessions/:sessionId',
  requireAuth,
  (req: Request, res: Response) => {
    const session = getSessionForUser(
      String(req.params.sessionId),
      req.user!.userId
    );
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    destroySession(session.sessionId);
    console.log(
      `[documents] Session manually deleted: ${req.params.sessionId}`
    );

    return res.json({ deleted: req.params.sessionId });
  }
);

// ─── GET /documents/doc-types ───────────────────────────────

router.get('/doc-types', requireAuth, (_req: Request, res: Response) => {
  return res.json({ docTypes: DOC_TYPES });
});

// ─── Helpers ────────────────────────────────────────────────

function sanitize(str: string): string {
  return str.replace(/[^a-zA-Z0-9\-_() ]/g, '_').substring(0, 80);
}

function csvEscape(str: string): string {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default router;
