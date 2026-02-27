# Document Intake Assistant — Build Plan & Design

## Overview

Internal-only tool for LRG Tax Services staff. Takes multi-page PDF scans, splits them into individual documents, classifies each page via AI, and exports organized ZIP files. Human-in-the-loop at every step.

---

## 1. MVP Build Plan

### Phase 1: Backend Core (Steps 1–4)
1. **Temp Storage Service** — Ephemeral file management with 1-hour TTL, secure deletion, no PII in logs.
2. **PDF Processor** — Split pages, generate thumbnails (Ghostscript), extract text (pdf-parse).
3. **Document Classifier** — Claude API classification per page (doc_type, entity_guess, tax_year_guess, confidence).
4. **API Routes** — Upload, get session, classify, update pages, assemble docs, export ZIP.

### Phase 2: Frontend (Steps 5–8)
5. **API Client** — Frontend service matching all backend endpoints.
6. **Upload Screen** — Drag-and-drop PDF upload with progress.
7. **Review Screen** — Page thumbnails + metadata panel + bulk actions + merge/split.
8. **Export Screen** — Folder structure preview + ZIP download + auto-cleanup trigger.

### Phase 3: Polish
9. **Navigation** — Add "Documents" link to main app nav.
10. **TTL cleanup cron** — Background interval to purge expired sessions.
11. **Error handling & edge cases.**

### Future Enhancements (Not MVP)
- Batch upload (multiple PDFs at once)
- OCR fallback for scanned images (Tesseract)
- Template memory ("last time this client had these doc types")
- TaxDome integration (auto-create pipeline tasks from split docs)

---

## 2. API Design

### POST `/documents/upload`
Upload a PDF and create a processing session.

```
Request: multipart/form-data
  - file: PDF (max 25MB)

Response 200:
{
  sessionId: string,
  filename: string,          // sanitized, no PII logged
  pageCount: number,
  pages: [
    {
      pageNumber: number,
      thumbnailUrl: string,  // /documents/sessions/:id/pages/:n/thumbnail
      status: "pending"
    }
  ],
  expiresAt: string          // ISO timestamp (1 hour from now)
}
```

### POST `/documents/sessions/:sessionId/classify`
Run AI classification on all pending pages.

```
Request: { pageNumbers?: number[] }  // optional subset; default = all

Response 200:
{
  sessionId: string,
  classifications: [
    {
      pageNumber: number,
      docType: string,
      entityGuess: string | null,
      taxYearGuess: string | null,
      confidence: number,
      relevance: "relevant" | "irrelevant" | "uncertain"
    }
  ]
}
```

### GET `/documents/sessions/:sessionId`
Get full session state.

```
Response 200:
{
  sessionId: string,
  filename: string,
  pageCount: number,
  pages: [{ pageNumber, thumbnailUrl, status, classification?, manualOverrides? }],
  documents: [{ docId, docType, entity, taxYear, pageNumbers, notes }],
  expiresAt: string
}
```

### GET `/documents/sessions/:sessionId/pages/:pageNumber/thumbnail`
Returns JPEG thumbnail image for a page.

### PATCH `/documents/sessions/:sessionId/pages/:pageNumber`
Manual override for a page classification.

```
Request:
{
  docType?: string,
  entity?: string,
  taxYear?: string,
  relevance?: "relevant" | "irrelevant" | "removed",
  notes?: string
}
```

### POST `/documents/sessions/:sessionId/pages/bulk`
Bulk update multiple pages.

```
Request:
{
  pageNumbers: number[],
  action: "assign_type" | "assign_entity" | "mark_irrelevant" | "mark_removed" | "restore",
  value?: string
}
```

### POST `/documents/sessions/:sessionId/documents`
Create/assemble a document from selected pages.

```
Request:
{
  pageNumbers: number[],
  docType: string,
  entity?: string,
  taxYear?: string,
  notes?: string
}

Response 200:
{
  docId: string,
  docType: string,
  entity: string | null,
  taxYear: string | null,
  pageNumbers: number[],
  pageCount: number
}
```

### DELETE `/documents/sessions/:sessionId/documents/:docId`
Remove an assembled document (pages return to unassigned).

### POST `/documents/sessions/:sessionId/export`
Generate and download ZIP.

```
Request:
{
  folderTemplate?: string   // default: "{tax_year}/{entity}/{doc_type}"
}

Response: application/zip stream
Headers: Content-Disposition: attachment; filename="LRG-export-{date}.zip"
```

Session files auto-deleted after successful export.

### DELETE `/documents/sessions/:sessionId`
Manually delete a session and all temp files.

---

## 3. Data Model

### Session (in-memory + disk temp)

```typescript
interface DocumentSession {
  sessionId: string;
  userId: string;
  originalFilename: string;   // sanitized
  pageCount: number;
  pages: PageInfo[];
  documents: AssembledDocument[];
  createdAt: Date;
  expiresAt: Date;            // createdAt + 1 hour
  status: 'processing' | 'ready' | 'exporting' | 'exported' | 'expired';
}

interface PageInfo {
  pageNumber: number;
  textContent?: string;       // extracted text (in memory only, never logged)
  thumbnailPath: string;      // path to temp JPEG
  pdfPagePath: string;        // path to split single-page PDF
  classification?: PageClassification;
  manualOverrides?: Partial<PageClassification>;
  status: 'pending' | 'classified' | 'assigned' | 'removed';
}

interface PageClassification {
  docType: string;
  entityGuess: string | null;
  taxYearGuess: string | null;
  confidence: number;
  relevance: 'relevant' | 'irrelevant' | 'uncertain';
}

interface AssembledDocument {
  docId: string;
  docType: string;
  entity: string | null;
  taxYear: string | null;
  pageNumbers: number[];
  notes: string | null;
}
```

### What Gets Stored Where

| Data | Location | Lifetime | Logged? |
|------|----------|----------|---------|
| Original PDF | disk temp | ≤1 hour | Size + page count only |
| Split page PDFs | disk temp | ≤1 hour | Never |
| Page thumbnails (JPEG) | disk temp | ≤1 hour | Never |
| Extracted text | memory only | session lifetime | Never |
| Session metadata | memory (Map) | ≤1 hour | Session ID + timestamps only |
| Classifications | memory | session lifetime | Doc types only (no entity names) |
| Export ZIP | streamed, never saved | streaming only | Export event + page count |

### TTL Handling

- Sessions auto-expire 1 hour after creation.
- Background interval runs every 5 minutes checking for expired sessions.
- Expired sessions: delete all temp files, remove from memory map.
- Successful export: immediate cleanup.
- Server restart: orphaned temp files cleaned on startup.

---

## 4. UI Flow & Components

### Screen 1: Upload
```
┌─────────────────────────────────────────────────┐
│  ← Back to Copilot          Document Intake     │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │                                             │ │
│  │        Drag & drop a PDF here               │ │
│  │        or click to browse                   │ │
│  │                                             │ │
│  │        Max 25MB · PDF only                  │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  ⚠ Privacy: Do not paste client PII into text   │
│    fields. Uploaded files are processed locally  │
│    and auto-deleted within 1 hour.               │
│                                                  │
│  [Upload & Process]                              │
└─────────────────────────────────────────────────┘
```

### Screen 2: Review (Main Working Screen)
```
┌────────────────────────────────────────────────────────────────────┐
│  Document Review    session expires in 47:23    [Export] [Discard] │
│                                                                    │
│  Bulk: [Remove Irrelevant] [Auto-Group] [Clear Selections]        │
│                                                                    │
│  ┌──────────────────────────────────────┐ ┌──────────────────────┐│
│  │ Page Grid (thumbnails)               │ │ Page Details         ││
│  │                                      │ │                      ││
│  │ [1]W-2  [2]W-2  [3]1099  [4]1099   │ │ Page 3 of 12         ││
│  │  95%     95%     88%      88%       │ │                      ││
│  │                                      │ │ Type: 1099-NEC    ▼ ││
│  │ [5]Bank [6]Bank [7]K-1   [8]???    │ │ Entity: Neurionix    ││
│  │  72%     72%     91%      45%       │ │ Tax Year: 2025       ││
│  │                                      │ │ Confidence: 88%      ││
│  │ [9]Inv  [10]Inv [11]SSA  [12]Junk  │ │ Relevance: ✓ Relevant││
│  │  80%     80%     94%     REMOVED    │ │                      ││
│  │                                      │ │ [Mark Removed]       ││
│  │                                      │ │ [Merge with →]       ││
│  │                                      │ │                      ││
│  └──────────────────────────────────────┘ │ ── Assembled Docs ── ││
│                                           │ Doc 1: W-2 (p1-2)   ││
│  Documents Created: 6                     │ Doc 2: 1099 (p3-4)  ││
│  Pages Unassigned: 2                      │ Doc 3: Bank (p5-6)  ││
│  Pages Removed: 1                         │ ...                  ││
│                                           └──────────────────────┘│
└────────────────────────────────────────────────────────────────────┘
```

### Screen 3: Export
```
┌─────────────────────────────────────────────────┐
│  Export Documents                                │
│                                                  │
│  Folder Structure Preview:                       │
│  📁 2025/                                        │
│    📁 John_Smith/                                │
│      📄 W-2.pdf (2 pages)                       │
│      📄 1099-NEC.pdf (1 page)                   │
│    📁 Neurionix_LLC/                             │
│      📄 K-1.pdf (2 pages)                       │
│    📄 SSA-1099.pdf (1 page)                     │
│  📄 index.csv                                    │
│                                                  │
│  Unassigned pages: 2 (will not be exported)      │
│  Removed pages: 1                                │
│                                                  │
│  [Download ZIP]     [Back to Review]             │
│                                                  │
│  After download, all temporary files will be     │
│  permanently deleted.                            │
└─────────────────────────────────────────────────┘
```

---

## 5. Library Choices

| Need | Library | Reasoning |
|------|---------|-----------|
| PDF page splitting/merging | **pdf-lib** | Pure JS, no native deps, excellent page manipulation API. Already battle-tested. |
| PDF text extraction | **pdf-parse** | Already in the project. Works well for text-based PDFs. |
| PDF → image previews | **Ghostscript** (via child_process) | Best quality, fastest. System dep but user approved. Fallback: pdf-poppler or pdf2pic. |
| ZIP creation | **archiver** | Most popular Node ZIP library. Streaming support for large exports. |
| Temp file management | **Custom service** | Simple Map + fs operations. No need for a library — we need tight control over deletion. |
| Image processing | **sharp** (optional) | If thumbnails need resizing. Lightweight, fast. |

---

## 6. No-PII Logging & Secure Deletion

### Logging Rules
```typescript
// ALLOWED to log:
log.info('Document uploaded', { sessionId, pageCount, fileSizeBytes });
log.info('Classification complete', { sessionId, pageNumber, docType, confidence });
log.info('Export generated', { sessionId, documentCount, totalPages });

// NEVER log:
// - Extracted text content
// - Entity names or guesses
// - Original filenames (may contain client names)
// - Page image data
// - Any string that could contain PII
```

### Secure Deletion Protocol
1. **Overwrite before delete**: Write random bytes over file content before fs.unlinkSync.
2. **Recursive cleanup**: Delete all files in session directory, then remove directory.
3. **Memory cleanup**: Null out textContent references, delete session from Map.
4. **Startup sweep**: On server start, delete everything in uploads/tmp/ (orphan cleanup).
5. **Export trigger**: Immediate full cleanup after ZIP stream completes.

---

## 7. File Scaffold

```
backend/src/
├── routes/
│   └── documents.ts              # All document intake endpoints
├── services/
│   ├── tempStorage.ts            # Ephemeral storage + TTL + secure delete
│   ├── documentProcessor.ts      # PDF split, preview gen, text extraction
│   └── documentClassifier.ts     # Claude API page classification
├── types/
│   └── documents.ts              # All type definitions
└── index.ts                      # Register document routes

frontend/src/
├── app/
│   └── documents/
│       └── page.tsx              # Document intake page (orchestrator)
├── components/
│   └── documents/
│       ├── UploadScreen.tsx      # Upload + drag-and-drop
│       ├── ReviewScreen.tsx      # Page grid + actions + assembly
│       ├── PageThumbnail.tsx     # Single page card
│       ├── DocumentPanel.tsx     # Right panel: page detail + doc list
│       └── ExportScreen.tsx      # Export preview + download
└── lib/
    └── api.ts                    # Add documentsApi section
```
