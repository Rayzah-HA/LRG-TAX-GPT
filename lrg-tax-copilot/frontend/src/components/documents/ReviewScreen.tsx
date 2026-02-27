'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  documentsApi,
  DocPageInfo,
  AssembledDoc,
} from '@/lib/api';

interface ReviewScreenProps {
  sessionId: string;
  onExport: () => void;
  onDiscard: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Helpers ────────────────────────────────────────────────

function getEffective(page: DocPageInfo) {
  const c = page.classification;
  const m = page.manualOverrides;
  return {
    docType: m?.docType || c?.docType || '?',
    entity: m?.entityGuess ?? c?.entityGuess ?? null,
    taxYear: m?.taxYearGuess ?? c?.taxYearGuess ?? null,
    confidence: c?.confidence ?? 0,
    relevance: m?.relevance || c?.relevance || 'uncertain',
  };
}

function confidenceColor(conf: number): string {
  if (conf >= 0.8) return 'text-green-400';
  if (conf >= 0.6) return 'text-yellow-400';
  return 'text-red-400';
}

function statusBadge(status: string): { label: string; color: string } {
  switch (status) {
    case 'pending':
      return { label: 'Pending', color: 'bg-gray-700 text-gray-300' };
    case 'classified':
      return { label: 'Classified', color: 'bg-blue-900 text-blue-300' };
    case 'assigned':
      return { label: 'Assigned', color: 'bg-green-900 text-green-300' };
    case 'removed':
      return { label: 'Removed', color: 'bg-red-900 text-red-300' };
    default:
      return { label: status, color: 'bg-gray-700' };
  }
}

// ─── Component ──────────────────────────────────────────────

export default function ReviewScreen({
  sessionId,
  onExport,
  onDiscard,
}: ReviewScreenProps) {
  const [pages, setPages] = useState<DocPageInfo[]>([]);
  const [documents, setDocuments] = useState<AssembledDoc[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [activePage, setActivePage] = useState<number | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit state for active page
  const [editDocType, setEditDocType] = useState('');
  const [editEntity, setEditEntity] = useState('');
  const [editTaxYear, setEditTaxYear] = useState('');

  const [docTypes, setDocTypes] = useState<string[]>([]);

  // Create document modal
  const [showCreateDoc, setShowCreateDoc] = useState(false);
  const [newDocType, setNewDocType] = useState('');
  const [newEntity, setNewEntity] = useState('');
  const [newTaxYear, setNewTaxYear] = useState('');

  const loadSession = useCallback(async () => {
    try {
      const data = await documentsApi.getSession(sessionId);
      setPages(data.pages);
      setDocuments(data.documents);
      setExpiresAt(data.expiresAt);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
    documentsApi.getDocTypes().then((r) => setDocTypes(r.docTypes)).catch(() => {});
  }, [loadSession]);

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Set edit fields when active page changes
  useEffect(() => {
    if (activePage === null) return;
    const page = pages.find((p) => p.pageNumber === activePage);
    if (!page) return;
    const eff = getEffective(page);
    setEditDocType(eff.docType);
    setEditEntity(eff.entity || '');
    setEditTaxYear(eff.taxYear || '');
  }, [activePage, pages]);

  // ─── Actions ────────────────────────────────────────────

  async function handleClassify() {
    setClassifying(true);
    setError('');
    try {
      await documentsApi.classify(sessionId);
      await loadSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Classification failed');
    }
    setClassifying(false);
  }

  async function handleSavePageEdit() {
    if (activePage === null) return;
    try {
      await documentsApi.updatePage(sessionId, activePage, {
        docType: editDocType || undefined,
        entity: editEntity || undefined,
        taxYear: editTaxYear || undefined,
      });
      await loadSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function handleRemovePage(pageNum: number) {
    try {
      await documentsApi.updatePage(sessionId, pageNum, {
        relevance: 'removed',
      });
      await loadSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove failed');
    }
  }

  async function handleRestorePage(pageNum: number) {
    try {
      await documentsApi.bulkAction(sessionId, [pageNum], 'restore');
      await loadSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed');
    }
  }

  async function handleBulkRemoveIrrelevant() {
    const irrelevantPages = pages
      .filter((p) => {
        const eff = getEffective(p);
        return eff.relevance === 'irrelevant' && p.status !== 'removed';
      })
      .map((p) => p.pageNumber);

    if (irrelevantPages.length === 0) return;

    try {
      await documentsApi.bulkAction(
        sessionId,
        irrelevantPages,
        'mark_removed'
      );
      await loadSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk remove failed');
    }
  }

  async function handleAutoGroup() {
    try {
      const result = await documentsApi.autoGroup(sessionId);
      await loadSession();
      if (result.created.length === 0) {
        setError('No pages available to auto-group. Classify pages first.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auto-group failed');
    }
  }

  async function handleCreateDocument() {
    if (selectedPages.size === 0 || !newDocType) return;
    try {
      await documentsApi.createDocument(sessionId, {
        pageNumbers: Array.from(selectedPages),
        docType: newDocType,
        entity: newEntity || undefined,
        taxYear: newTaxYear || undefined,
      });
      setSelectedPages(new Set());
      setShowCreateDoc(false);
      setNewDocType('');
      setNewEntity('');
      setNewTaxYear('');
      await loadSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  }

  async function handleDeleteDocument(docId: string) {
    try {
      await documentsApi.deleteDocument(sessionId, docId);
      await loadSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  function togglePageSelection(pageNum: number) {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) next.delete(pageNum);
      else next.add(pageNum);
      return next;
    });
  }

  // ─── Computed ────────────────────────────────────────────

  const pendingPages = pages.filter((p) => p.status === 'pending').length;
  const classifiedPages = pages.filter((p) => p.status === 'classified').length;
  const assignedPages = pages.filter((p) => p.status === 'assigned').length;
  const removedPages = pages.filter((p) => p.status === 'removed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-white">Document Review</h1>
          <p className="text-xs text-gray-500">
            {pages.length} pages &middot; Session expires in{' '}
            <span className={timeLeft === 'Expired' ? 'text-red-400' : 'text-yellow-400'}>
              {timeLeft}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onExport}
            disabled={documents.length === 0}
            className="px-3 py-1.5 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded transition-colors"
          >
            Export ({documents.length})
          </button>
          <button
            onClick={onDiscard}
            className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-300 text-sm rounded transition-colors"
          >
            Discard
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-900/30 border border-red-800 rounded text-sm text-red-300 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-200">&times;</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleClassify}
          disabled={classifying || pendingPages === 0}
          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded transition-colors"
        >
          {classifying ? 'Classifying...' : `Classify (${pendingPages} pending)`}
        </button>
        <button
          onClick={handleAutoGroup}
          disabled={classifiedPages === 0}
          className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded transition-colors"
        >
          Auto-Group
        </button>
        <button
          onClick={handleBulkRemoveIrrelevant}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors"
        >
          Remove Irrelevant
        </button>
        {selectedPages.size > 0 && (
          <button
            onClick={() => setShowCreateDoc(true)}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm rounded transition-colors"
          >
            Create Doc ({selectedPages.size} pages)
          </button>
        )}
        <div className="flex-1" />
        <span className="text-xs text-gray-500 self-center">
          {assignedPages} assigned &middot; {removedPages} removed
        </span>
      </div>

      {/* Main content: grid + sidebar */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Page grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {pages.map((page) => {
              const eff = getEffective(page);
              const badge = statusBadge(page.status);
              const isSelected = selectedPages.has(page.pageNumber);
              const isActive = activePage === page.pageNumber;

              return (
                <div
                  key={page.pageNumber}
                  className={`relative rounded-lg border-2 cursor-pointer transition-all ${
                    isActive
                      ? 'border-blue-500 ring-1 ring-blue-500/50'
                      : isSelected
                      ? 'border-emerald-500'
                      : page.status === 'removed'
                      ? 'border-gray-800 opacity-40'
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                  onClick={() => setActivePage(page.pageNumber)}
                >
                  {/* Selection checkbox */}
                  {page.status !== 'removed' && (
                    <div
                      className="absolute top-1 left-1 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePageSelection(page.pageNumber);
                      }}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'border-gray-600 bg-gray-800/80'
                        }`}
                      >
                        {isSelected && '\u2713'}
                      </div>
                    </div>
                  )}

                  {/* Thumbnail */}
                  <div className="aspect-[3/4] bg-gray-800 rounded-t-md overflow-hidden">
                    <img
                      src={`${API_BASE}${page.thumbnailUrl}`}
                      alt={`Page ${page.pageNumber}`}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>

                  {/* Info bar */}
                  <div className="p-1.5 bg-gray-900 rounded-b-md">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        p{page.pageNumber}
                      </span>
                      <span className={`text-xs ${badge.color} px-1 rounded`}>
                        {page.status === 'classified' || page.status === 'assigned'
                          ? eff.docType
                          : badge.label}
                      </span>
                    </div>
                    {page.classification && (
                      <div className={`text-xs ${confidenceColor(eff.confidence)} mt-0.5`}>
                        {Math.round(eff.confidence * 100)}%
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-72 shrink-0 overflow-y-auto">
          {/* Active page detail */}
          {activePage !== null && (() => {
            const page = pages.find((p) => p.pageNumber === activePage);
            if (!page) return null;
            const eff = getEffective(page);
            const badge = statusBadge(page.status);

            return (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">
                    Page {page.pageNumber}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                {page.classification && (
                  <div className="space-y-2 mb-3">
                    <div className="text-xs text-gray-400">
                      AI: {eff.docType}{' '}
                      <span className={confidenceColor(eff.confidence)}>
                        ({Math.round(eff.confidence * 100)}%)
                      </span>
                    </div>
                    {eff.entity && (
                      <div className="text-xs text-gray-400">
                        Entity: {eff.entity}
                      </div>
                    )}
                    {eff.taxYear && (
                      <div className="text-xs text-gray-400">
                        Year: {eff.taxYear}
                      </div>
                    )}
                  </div>
                )}

                {/* Edit fields */}
                <div className="space-y-2 border-t border-gray-800 pt-3">
                  <label className="block">
                    <span className="text-xs text-gray-500">Doc Type</span>
                    <select
                      value={editDocType}
                      onChange={(e) => setEditDocType(e.target.value)}
                      className="w-full mt-0.5 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                    >
                      <option value="">-- Select --</option>
                      {docTypes.map((dt) => (
                        <option key={dt} value={dt}>{dt}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs text-gray-500">Entity</span>
                    <input
                      value={editEntity}
                      onChange={(e) => setEditEntity(e.target.value)}
                      className="w-full mt-0.5 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                      placeholder="Person or business name"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-gray-500">Tax Year</span>
                    <input
                      value={editTaxYear}
                      onChange={(e) => setEditTaxYear(e.target.value)}
                      className="w-full mt-0.5 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                      placeholder="2025"
                    />
                  </label>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSavePageEdit}
                      className="flex-1 px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded"
                    >
                      Save
                    </button>
                    {page.status === 'removed' ? (
                      <button
                        onClick={() => handleRestorePage(page.pageNumber)}
                        className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded"
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRemovePage(page.pageNumber)}
                        className="flex-1 px-2 py-1 bg-red-900/50 hover:bg-red-800 text-red-300 text-xs rounded"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Assembled documents list */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-3">
              Assembled Documents ({documents.length})
            </h3>
            {documents.length === 0 ? (
              <p className="text-xs text-gray-500">
                No documents yet. Classify pages, then use Auto-Group or
                select pages to create documents.
              </p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.docId}
                    className="p-2 bg-gray-800 rounded border border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white">
                        {doc.docType}
                      </span>
                      <button
                        onClick={() => handleDeleteDocument(doc.docId)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        &times;
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {doc.entity || 'Unassigned'} &middot;{' '}
                      {doc.taxYear || 'No year'} &middot; p
                      {doc.pageNumbers.join(',')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create document modal */}
      {showCreateDoc && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-96">
            <h3 className="text-white font-semibold mb-4">
              Create Document from {selectedPages.size} pages
            </h3>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs text-gray-400">Doc Type *</span>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                >
                  <option value="">-- Select --</option>
                  {docTypes.map((dt) => (
                    <option key={dt} value={dt}>{dt}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-gray-400">Entity</span>
                <input
                  value={newEntity}
                  onChange={(e) => setNewEntity(e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-400">Tax Year</span>
                <input
                  value={newTaxYear}
                  onChange={(e) => setNewTaxYear(e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white"
                />
              </label>
              <div className="text-xs text-gray-500">
                Pages: {Array.from(selectedPages).sort((a, b) => a - b).join(', ')}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreateDocument}
                disabled={!newDocType}
                className="flex-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-700 text-white text-sm rounded"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateDoc(false)}
                className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
