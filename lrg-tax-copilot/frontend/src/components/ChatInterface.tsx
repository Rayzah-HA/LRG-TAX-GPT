'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import AuthGuard from './AuthGuard';
import MessageList, { Message } from './MessageList';
import MessageInput from './MessageInput';
import ModeBadge from './ModeBadge';
import MetadataPanel from './MetadataPanel';
import KnowledgeManager from './KnowledgeManager';
import { chatApi } from '@/lib/api';
import { getUser, logout, isFirmOwner as checkFirmOwner, StoredUser } from '@/lib/auth';

interface ChatMetadata {
  detectedMode: string;
  confidence: number;
  retrievedIds: string[];
  guardrailFlagsTriggered: string[];
  clarificationRequired: boolean;
}

export default function ChatInterface() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [lastMetadata, setLastMetadata] = useState<ChatMetadata | null>(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    setSessionId(uuidv4());
    setUser(getUser());
  }, []);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setSessionId(uuidv4());
    setLastMetadata(null);
    setError('');
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    router.push('/login');
  }, [router]);

  async function sendMessage(userMessage: string) {
    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: userMessage,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError('');

    // Build conversation history from existing messages (exclude the one we just added)
    const conversationHistory = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const result = await chatApi.send(sessionId, userMessage, conversationHistory);

      if (result.sessionId) {
        setSessionId(result.sessionId);
      }

      setLastMetadata({
        detectedMode: result.detectedMode,
        confidence: result.confidence,
        retrievedIds: result.retrievedIds,
        guardrailFlagsTriggered: result.guardrailFlagsTriggered,
        clarificationRequired: result.clarificationRequired,
      });

      const assistantMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: result.assistantMessage,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send message';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-950">
        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-950 shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-semibold text-white">
                LRG Tax Copilot
              </h1>
              {lastMetadata && (
                <ModeBadge
                  mode={lastMetadata.detectedMode}
                  confidence={lastMetadata.confidence}
                  clarificationRequired={lastMetadata.clarificationRequired}
                />
              )}
            </div>

            <div className="flex items-center gap-3">
              {user && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {user.displayName || user.username}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      user.role === 'firm_owner'
                        ? 'bg-amber-900/30 text-amber-300 border border-amber-800'
                        : 'bg-gray-800 text-gray-400 border border-gray-700'
                    }`}
                  >
                    {user.role === 'firm_owner' ? 'Owner' : 'Staff'}
                  </span>
                </div>
              )}

              <KnowledgeManager isFirmOwner={checkFirmOwner()} />

              <button
                onClick={handleNewChat}
                className="text-xs px-3 py-1.5 rounded bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                New Chat
              </button>

              <button
                onClick={handleLogout}
                className="text-xs px-3 py-1.5 rounded bg-gray-800 border border-gray-700 text-gray-400 hover:bg-red-900/30 hover:text-red-300 hover:border-red-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </header>

          {/* Error banner */}
          {error && (
            <div className="mx-4 mt-2 p-3 bg-red-900/30 border border-red-800 rounded text-sm text-red-300 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError('')}
                className="text-red-400 hover:text-red-200 ml-2"
              >
                &times;
              </button>
            </div>
          )}

          {/* Messages */}
          <MessageList messages={messages} isLoading={isLoading} />

          {/* Input */}
          <MessageInput onSend={sendMessage} disabled={isLoading} />
        </div>

        {/* Sidebar - metadata panel */}
        {lastMetadata &&
          (lastMetadata.retrievedIds.length > 0 ||
            lastMetadata.guardrailFlagsTriggered.length > 0) && (
            <MetadataPanel
              retrievedIds={lastMetadata.retrievedIds}
              guardrailFlags={lastMetadata.guardrailFlagsTriggered}
            />
          )}
      </div>
    </AuthGuard>
  );
}
