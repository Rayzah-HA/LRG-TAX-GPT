'use client';

interface ModeBadgeProps {
  mode: string;
  confidence: number;
  clarificationRequired: boolean;
}

const MODE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  'MODE-RR': {
    label: 'Risk Review',
    color: 'text-red-300',
    bg: 'bg-red-900/30',
    border: 'border-red-800',
  },
  'MODE-CRD': {
    label: 'Client Response',
    color: 'text-blue-300',
    bg: 'bg-blue-900/30',
    border: 'border-blue-800',
  },
  'MODE-PLS': {
    label: 'Pricing/Scope',
    color: 'text-green-300',
    bg: 'bg-green-900/30',
    border: 'border-green-800',
  },
  'MODE-ITP': {
    label: 'Talking Points',
    color: 'text-purple-300',
    bg: 'bg-purple-900/30',
    border: 'border-purple-800',
  },
  'MODE-EDU': {
    label: 'Educational',
    color: 'text-yellow-300',
    bg: 'bg-yellow-900/30',
    border: 'border-yellow-800',
  },
  'MODE-QA': {
    label: 'Tax Q&A',
    color: 'text-cyan-300',
    bg: 'bg-cyan-900/30',
    border: 'border-cyan-800',
  },
  'MODE-MTX': {
    label: 'Tax Matrix',
    color: 'text-orange-300',
    bg: 'bg-orange-900/30',
    border: 'border-orange-800',
  },
};

export default function ModeBadge({ mode, confidence, clarificationRequired }: ModeBadgeProps) {
  if (clarificationRequired) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-amber-900/30 border border-amber-800 text-amber-300">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Clarification Needed
      </span>
    );
  }

  const config = MODE_CONFIG[mode];

  if (!config) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-gray-800 border border-gray-700 text-gray-400">
        {mode}
      </span>
    );
  }

  const pct = Math.round(confidence * 100);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${config.bg} border ${config.border} ${config.color}`}
    >
      {config.label}
      <span className="opacity-60">{pct}%</span>
    </span>
  );
}
