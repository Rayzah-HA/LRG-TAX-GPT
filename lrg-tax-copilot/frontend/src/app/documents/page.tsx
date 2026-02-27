'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { documentsApi } from '@/lib/api';
import UploadScreen from '@/components/documents/UploadScreen';
import ReviewScreen from '@/components/documents/ReviewScreen';
import ExportScreen from '@/components/documents/ExportScreen';

type Screen = 'upload' | 'review' | 'export' | 'done';

export default function DocumentIntakePage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>('upload');
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    }
  }, [router]);

  function handleUploadComplete(newSessionId: string) {
    setSessionId(newSessionId);
    setScreen('review');
  }

  function handleBack() {
    router.push('/');
  }

  async function handleDiscard() {
    if (sessionId) {
      try {
        await documentsApi.deleteSession(sessionId);
      } catch {
        // Best effort
      }
    }
    setSessionId(null);
    setScreen('upload');
  }

  function handleExportComplete() {
    setScreen('done');
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {screen === 'upload' && (
          <UploadScreen
            onUploadComplete={handleUploadComplete}
            onBack={handleBack}
          />
        )}

        {screen === 'review' && sessionId && (
          <ReviewScreen
            sessionId={sessionId}
            onExport={() => setScreen('export')}
            onDiscard={handleDiscard}
          />
        )}

        {screen === 'export' && sessionId && (
          <ExportScreen
            sessionId={sessionId}
            onBack={() => setScreen('review')}
            onComplete={handleExportComplete}
          />
        )}

        {screen === 'done' && (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="text-4xl mb-4">&#9989;</div>
            <h1 className="text-xl font-bold text-white mb-2">
              Export Complete
            </h1>
            <p className="text-gray-400 mb-6">
              Your ZIP has been downloaded and all temporary files have been
              securely deleted.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setSessionId(null);
                  setScreen('upload');
                }}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded transition-colors"
              >
                Process Another PDF
              </button>
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                Back to Copilot
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
