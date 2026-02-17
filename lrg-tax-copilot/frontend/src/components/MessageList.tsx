'use client';

import { useEffect, useRef } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-white mb-2">
            LRG Tax Copilot
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Everything tax professionals need, in one place. Research with
            citations, draft communications, compare state taxes, and get
            automatic client context — all powered by AI.
          </p>
          <div className="grid grid-cols-2 gap-2 text-left">
            {[
              'What is IRC §199A and who qualifies for the QBI deduction?',
              'Draft a refund notification email for John Smith',
              'Which states have no income tax?',
              'Compare state tax rates across all 50 states',
              'What do we charge for S-Corp preparation?',
              'Write an IRS notice response letter for CP2000',
            ].map((example) => (
              <div
                key={example}
                className="text-xs text-gray-500 px-3 py-2 bg-gray-900 border border-gray-800 rounded"
              >
                {example}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-2xl rounded-lg px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 border border-gray-700 text-gray-200'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-medium">
                Copilot
              </div>
            )}
            <div className="message-content text-sm whitespace-pre-wrap">
              {msg.content}
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-medium">
              Copilot
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
