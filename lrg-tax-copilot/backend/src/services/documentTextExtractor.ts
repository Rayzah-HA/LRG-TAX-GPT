// ─── Extract text from uploaded documents for chat context ───

/**
 * Extracts text content from a PDF or image buffer.
 * Used to provide document context in chat conversations.
 */
export async function extractDocumentText(
  buffer: Buffer,
  mimeType: string
): Promise<string | undefined> {
  if (mimeType === 'application/pdf') {
    return extractPdfText(buffer);
  }

  // For images, return a placeholder — Claude will use vision if available
  if (mimeType.startsWith('image/')) {
    return undefined; // Images handled via vision in claudeClient
  }

  return undefined;
}

async function extractPdfText(buffer: Buffer): Promise<string | undefined> {
  let pdfParse: (buf: Buffer) => Promise<{ text: string }>;
  try {
    const mod = require('pdf-parse');
    pdfParse = typeof mod === 'function' ? mod : mod.default;
    if (typeof pdfParse !== 'function') return undefined;
  } catch {
    return undefined;
  }

  const result = await pdfParse(buffer);
  const text = result.text?.trim();

  if (!text || text.length < 10) return undefined;

  // Truncate very long documents to avoid exceeding context limits
  const MAX_CHARS = 12000;
  if (text.length > MAX_CHARS) {
    return text.substring(0, MAX_CHARS) + '\n\n[...document truncated]';
  }

  return text;
}
