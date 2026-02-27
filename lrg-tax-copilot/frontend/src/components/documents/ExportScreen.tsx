'use client';

import { useState, useEffect, useCallback } from 'react';
import { documentsApi, AssembledDoc } from '@/lib/api';

interface ExportScreenProps {
  sessionId: string;
  onBack: () => void;
  onComplete: () => void;
}

interface TreeNode {
  name: string;
  children: TreeNode[];
  isFile?: boolean;
  pageCount?: number;
}

function buildTree(docs: AssembledDoc[], template: string): TreeNode {
  const root: TreeNode = { name: 'export', children: [] };

  for (const doc of docs) {
    const folderPath = template
      .replace('{tax_year}', doc.taxYear || 'Unknown_Year')
      .replace('{entity}', doc.entity || 'Unassigned')
      .replace('{doc_type}', doc.docType);

    const parts = folderPath.split('/').filter(Boolean);
    let current = root;

    for (const part of parts) {
      let child = current.children.find((c) => c.name === part && !c.isFile);
      if (!child) {
        child = { name: part, children: [] };
        current.children.push(child);
      }
      current = child;
    }

    current.children.push({
      name: `${doc.docType}_p${doc.pageNumbers[0]}-${doc.pageNumbers[doc.pageNumbers.length - 1]}.pdf`,
      children: [],
      isFile: true,
      pageCount: doc.pageNumbers.length,
    });
  }

  return root;
}

function TreeView({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  return (
    <div style={{ paddingLeft: depth * 16 }}>
      {node.isFile ? (
        <div className="flex items-center gap-1 text-sm text-gray-300 py-0.5">
          <span className="text-gray-500">&#128196;</span>
          {node.name}
          {node.pageCount && (
            <span className="text-gray-600 text-xs">
              ({node.pageCount} {node.pageCount === 1 ? 'page' : 'pages'})
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1 text-sm text-yellow-400 py-0.5">
          <span>&#128193;</span> {node.name}/
        </div>
      )}
      {node.children.map((child, i) => (
        <TreeView key={`${child.name}-${i}`} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function ExportScreen({
  sessionId,
  onBack,
  onComplete,
}: ExportScreenProps) {
  const [documents, setDocuments] = useState<AssembledDoc[]>([]);
  const [unassigned, setUnassigned] = useState(0);
  const [removed, setRemoved] = useState(0);
  const [template] = useState('{tax_year}/{entity}/{doc_type}');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await documentsApi.getSession(sessionId);
      setDocuments(data.documents);
      setUnassigned(
        data.pages.filter(
          (p) => p.status !== 'assigned' && p.status !== 'removed'
        ).length
      );
      setRemoved(data.pages.filter((p) => p.status === 'removed').length);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleExport() {
    setExporting(true);
    setError('');

    try {
      const blob = await documentsApi.exportZip(sessionId, template);

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LRG-export-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      setExporting(false);
    }
  }

  const tree = buildTree(documents, template);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-lg font-bold text-white mb-2">Export Documents</h1>
      <p className="text-sm text-gray-400 mb-6">
        Review the folder structure below, then download the ZIP.
      </p>

      {/* Folder preview */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4 max-h-80 overflow-y-auto">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
          Folder Structure Preview
        </h3>
        {tree.children.map((child, i) => (
          <TreeView key={`${child.name}-${i}`} node={child} />
        ))}
        <div className="mt-2 flex items-center gap-1 text-sm text-gray-400">
          <span className="text-gray-500">&#128196;</span> index.csv
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-white">
              {documents.length}
            </div>
            <div className="text-xs text-gray-500">Documents</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-400">
              {unassigned}
            </div>
            <div className="text-xs text-gray-500">Unassigned pages</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-500">{removed}</div>
            <div className="text-xs text-gray-500">Removed pages</div>
          </div>
        </div>
      </div>

      {unassigned > 0 && (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-800/50 rounded text-sm text-yellow-300/80">
          {unassigned} page{unassigned !== 1 ? 's' : ''} will not be included
          in the export. Go back to assign them to documents.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleExport}
          disabled={exporting || documents.length === 0}
          className="flex-1 px-4 py-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded transition-colors"
        >
          {exporting ? 'Generating ZIP...' : 'Download ZIP'}
        </button>
        <button
          onClick={onBack}
          disabled={exporting}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
        >
          Back to Review
        </button>
      </div>

      <p className="text-xs text-gray-600 mt-4 text-center">
        After download, all temporary files will be permanently deleted.
      </p>
    </div>
  );
}
