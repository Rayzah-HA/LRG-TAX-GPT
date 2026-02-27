'use client';

import { useState, useRef, DragEvent } from 'react';

interface UploadScreenProps {
  onUploadComplete: (sessionId: string) => void;
  onBack: () => void;
}

export default function UploadScreen({ onUploadComplete, onBack }: UploadScreenProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError('File exceeds 25MB limit.');
      return;
    }

    setError('');
    setUploading(true);
    setProgress('Uploading and processing...');

    try {
      const { documentsApi } = await import('@/lib/api');
      const result = await documentsApi.upload(file);
      setProgress(`Processed ${result.pageCount} pages. Redirecting...`);
      onUploadComplete(result.sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
      setProgress('');
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="text-gray-400 hover:text-white text-sm mb-6 flex items-center gap-1"
      >
        &larr; Back to Copilot
      </button>

      <h1 className="text-xl font-bold text-white mb-2">Document Intake</h1>
      <p className="text-sm text-gray-400 mb-6">
        Upload a multi-page PDF scan to split, classify, and organize into
        individual tax documents.
      </p>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-700 hover:border-gray-500 bg-gray-900'
        } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-300">{progress}</p>
          </div>
        ) : (
          <>
            <div className="text-4xl text-gray-600 mb-3">&#128196;</div>
            <p className="text-gray-300 font-medium">
              Drag & drop a PDF here
            </p>
            <p className="text-gray-500 text-sm mt-1">
              or click to browse
            </p>
            <p className="text-gray-600 text-xs mt-3">
              PDF only &middot; Max 25MB
            </p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Privacy notice */}
      <div className="mt-6 p-3 bg-yellow-900/20 border border-yellow-800/50 rounded text-xs text-yellow-300/80">
        <strong>Privacy:</strong> Uploaded files are processed temporarily and
        auto-deleted within 1 hour. Do not paste client PII into text fields.
        Page content is analyzed for classification only and never stored in
        logs.
      </div>
    </div>
  );
}
