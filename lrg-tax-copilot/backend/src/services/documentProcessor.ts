import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { PDFDocument } from 'pdf-lib';
import {
  getOriginalPdfPath,
  getPagePdfPath,
  getThumbnailPath,
} from './tempStorage';
import { PageInfo } from '../types/documents';

const execFileAsync = promisify(execFile);

// ─── Process uploaded PDF ───────────────────────────────────
// Splits into single-page PDFs, generates thumbnails, extracts text.

export async function processUploadedPdf(
  sessionId: string,
  pdfBuffer: Buffer
): Promise<PageInfo[]> {
  // Save original PDF to temp
  const originalPath = getOriginalPdfPath(sessionId);
  fs.writeFileSync(originalPath, pdfBuffer);

  // Load with pdf-lib for splitting
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pageCount = pdfDoc.getPageCount();
  const pages: PageInfo[] = [];

  // Split each page into its own PDF
  for (let i = 0; i < pageCount; i++) {
    const pageNumber = i + 1;
    const singlePageDoc = await PDFDocument.create();
    const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [i]);
    singlePageDoc.addPage(copiedPage);

    const singlePageBytes = await singlePageDoc.save();
    const pagePath = getPagePdfPath(sessionId, pageNumber);
    fs.writeFileSync(pagePath, singlePageBytes);

    pages.push({
      pageNumber,
      thumbnailPath: getThumbnailPath(sessionId, pageNumber),
      pdfPagePath: pagePath,
      status: 'pending',
    });
  }

  // Generate thumbnails (batch via Ghostscript)
  await generateThumbnails(sessionId, originalPath, pageCount);

  // Extract text per page
  await extractTextPerPage(pages);

  return pages;
}

// ─── Thumbnail generation via Ghostscript ───────────────────

async function generateThumbnails(
  sessionId: string,
  pdfPath: string,
  pageCount: number
): Promise<void> {
  // Ghostscript outputs one JPEG per page using %d placeholder
  const outputPattern = getThumbnailPath(sessionId, 0).replace(
    'thumb-0.jpg',
    'thumb-%d.jpg'
  );

  try {
    await execFileAsync('gs', [
      '-dNOPAUSE',
      '-dBATCH',
      '-dSAFER',
      '-sDEVICE=jpeg',
      '-r72',                    // 72 DPI for thumbnails (fast + small)
      '-dJPEGQ=60',             // Moderate quality
      '-dTextAlphaBits=4',
      '-dGraphicsAlphaBits=4',
      `-dFirstPage=1`,
      `-dLastPage=${pageCount}`,
      `-sOutputFile=${outputPattern}`,
      pdfPath,
    ], { timeout: 30000 });
  } catch (error) {
    // Ghostscript not available — generate placeholder thumbnails
    console.log(
      '[documentProcessor] Ghostscript not available, using placeholder thumbnails'
    );
    for (let i = 1; i <= pageCount; i++) {
      const thumbPath = getThumbnailPath(sessionId, i);
      // Write a minimal placeholder if gs isn't installed
      if (!fs.existsSync(thumbPath)) {
        fs.writeFileSync(thumbPath, Buffer.alloc(0));
      }
    }
  }
}

// ─── Text extraction per page ───────────────────────────────

async function extractTextPerPage(
  pages: PageInfo[]
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  let pdfParse: (buffer: Buffer) => Promise<{ text: string }>;
  try {
    // pdf-parse is a CJS module; require works reliably here
    const mod = require('pdf-parse');
    pdfParse = typeof mod === 'function' ? mod : mod.default;
    if (typeof pdfParse !== 'function') {
      console.log('[documentProcessor] pdf-parse loaded but not callable, skipping text extraction');
      return;
    }
  } catch {
    console.log('[documentProcessor] pdf-parse not available, skipping text extraction');
    return;
  }

  // Extract text from each single-page PDF
  for (const page of pages) {
    try {
      const pageBuffer = fs.readFileSync(page.pdfPagePath);
      const parsed = await pdfParse(pageBuffer);
      // Store in memory only — never written to disk or logged
      page.textContent = parsed.text?.trim() || '';
    } catch {
      page.textContent = '';
    }
  }
}

// ─── Merge pages into a single PDF ─────────────────────────

export async function mergePages(pagePaths: string[]): Promise<Buffer> {
  const mergedDoc = await PDFDocument.create();

  for (const pagePath of pagePaths) {
    const pageBytes = fs.readFileSync(pagePath);
    const sourceDoc = await PDFDocument.load(pageBytes);
    const [copiedPage] = await mergedDoc.copyPages(sourceDoc, [0]);
    mergedDoc.addPage(copiedPage);
  }

  const mergedBytes = await mergedDoc.save();
  return Buffer.from(mergedBytes);
}
