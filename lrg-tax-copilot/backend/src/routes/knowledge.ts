import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdf: (buffer: Buffer) => Promise<{ text: string }> = require('pdf-parse');
import mammoth from 'mammoth';
import { requireAuth, requireRole } from '../middleware/auth';
import { listKnowledgeFiles } from '../services/knowledgeBase';

const router = Router();

const KB_DIR = path.join(__dirname, '../../knowledge');

// ─── Multer config (memory storage, 10MB limit) ─────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.pdf', '.docx', '.txt', '.md'];

    if (allowed.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Accepted: PDF, DOCX, TXT, MD`));
    }
  },
});

// ─── Helpers ──────────────────────────────────────────────────

function sanitizeFilename(name: string): string {
  return name
    .replace(/\.[^/.]+$/, '')        // remove extension
    .replace(/[^a-zA-Z0-9\s-_]/g, '') // remove special chars
    .replace(/\s+/g, '-')            // spaces to dashes
    .toLowerCase()
    .slice(0, 80);
}

async function extractText(buffer: Buffer, ext: string): Promise<string> {
  switch (ext) {
    case '.pdf': {
      const data = await pdf(buffer);
      return data.text;
    }
    case '.docx': {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case '.txt':
    case '.md':
      return buffer.toString('utf-8');
    default:
      throw new Error(`Cannot extract text from ${ext} files`);
  }
}

// ─── POST /knowledge/upload — Upload a document ──────────────

router.post(
  '/upload',
  requireAuth,
  requireRole('firm_owner'),
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file provided' });
        return;
      }

      const ext = path.extname(req.file.originalname).toLowerCase();
      const rawText = await extractText(req.file.buffer, ext);

      if (!rawText.trim()) {
        res.status(400).json({ success: false, error: 'Could not extract any text from the file' });
        return;
      }

      // Build markdown filename
      const baseName = sanitizeFilename(req.file.originalname);
      const existing = fs.existsSync(KB_DIR) ? fs.readdirSync(KB_DIR).filter(f => f.endsWith('.md')) : [];
      const nextNum = String(existing.length + 1).padStart(2, '0');
      const mdFilename = `${nextNum}-${baseName}.md`;
      const mdPath = path.join(KB_DIR, mdFilename);

      // Ensure directory exists
      if (!fs.existsSync(KB_DIR)) {
        fs.mkdirSync(KB_DIR, { recursive: true });
      }

      // Build markdown content
      const title = req.file.originalname.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const mdContent = `# ${title}\n\n${rawText.trim()}\n`;

      fs.writeFileSync(mdPath, mdContent, 'utf-8');

      res.json({
        success: true,
        filename: mdFilename,
        originalName: req.file.originalname,
        extractedLength: rawText.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      res.status(500).json({ success: false, error: message });
    }
  }
);

// ─── GET /knowledge/files — List knowledge base files ────────

router.get('/files', requireAuth, (_req: Request, res: Response) => {
  const files = listKnowledgeFiles();
  const fileDetails = files.map((f) => {
    const filePath = path.join(KB_DIR, f);
    const stats = fs.statSync(filePath);
    return {
      name: f,
      size: stats.size,
      modified: stats.mtime.toISOString(),
    };
  });

  res.json({ success: true, files: fileDetails });
});

// ─── DELETE /knowledge/files/:filename — Remove a file ───────

router.delete(
  '/files/:filename',
  requireAuth,
  requireRole('firm_owner'),
  (req: Request, res: Response) => {
    const filename = String(req.params.filename);

    // Prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      res.status(400).json({ success: false, error: 'Invalid filename' });
      return;
    }

    const filePath = path.join(KB_DIR, filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: 'File not found' });
      return;
    }

    fs.unlinkSync(filePath);
    res.json({ success: true, deleted: filename });
  }
);

export default router;
