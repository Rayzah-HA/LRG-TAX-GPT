'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { knowledgeApi } from '@/lib/api';

interface KnowledgeFile {
  name: string;
  size: number;
  modified: string;
}

interface KnowledgeManagerProps {
  isFirmOwner: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function KnowledgeManager({ isFirmOwner }: KnowledgeManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await knowledgeApi.listFiles();
      setFiles(result.files);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load knowledge files' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [isOpen, loadFiles]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage(null);

    try {
      const result = await knowledgeApi.upload(file);
      setMessage({
        type: 'success',
        text: `Uploaded "${result.originalName}" → ${result.filename} (${result.extractedLength.toLocaleString()} chars extracted)`,
      });
      loadFiles();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleDelete(filename: string) {
    if (!confirm(`Delete "${filename}" from the knowledge base?`)) return;

    try {
      await knowledgeApi.deleteFile(filename);
      setMessage({ type: 'success', text: `Deleted "${filename}"` });
      loadFiles();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      setMessage({ type: 'error', text: msg });
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs px-3 py-1.5 rounded bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        title="Knowledge Base"
      >
        KB {files.length > 0 && isOpen ? `(${files.length})` : ''}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-white">Knowledge Base</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-300"
            >
              &times;
            </button>
          </div>

          {/* Upload section (firm_owner only) */}
          {isFirmOwner && (
            <div className="px-4 py-3 border-b border-gray-800">
              <label className="block">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={handleUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    isUploading
                      ? 'border-gray-700 text-gray-600 cursor-wait'
                      : 'border-gray-600 text-gray-400 hover:border-cyan-700 hover:text-cyan-300'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <span className="animate-spin text-sm">&#9696;</span>
                      <span className="text-xs">Processing...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">+</span>
                      <span className="text-xs">Upload PDF, DOCX, TXT, or MD</span>
                    </>
                  )}
                </div>
              </label>
            </div>
          )}

          {/* Status message */}
          {message && (
            <div
              className={`mx-4 mt-2 p-2 rounded text-xs ${
                message.type === 'success'
                  ? 'bg-green-900/30 border border-green-800 text-green-300'
                  : 'bg-red-900/30 border border-red-800 text-red-300'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* File list */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-6 text-center text-xs text-gray-500">
                Loading...
              </div>
            ) : files.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-gray-500">
                No knowledge files yet
              </div>
            ) : (
              <ul className="py-1">
                {files.map((file) => (
                  <li
                    key={file.name}
                    className="flex items-center justify-between px-4 py-2 hover:bg-gray-800/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-300 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {formatSize(file.size)}
                      </p>
                    </div>
                    {isFirmOwner && (
                      <button
                        onClick={() => handleDelete(file.name)}
                        className="ml-2 text-gray-600 hover:text-red-400 text-xs shrink-0"
                        title="Delete"
                      >
                        &times;
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-800">
            <p className="text-[10px] text-gray-600">
              Files are loaded into every AI response automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
