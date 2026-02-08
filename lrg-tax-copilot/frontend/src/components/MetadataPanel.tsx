'use client';

interface MetadataPanelProps {
  retrievedIds: string[];
  guardrailFlags: string[];
}

const FLAG_LABELS: Record<string, string> = {
  NO_ESTIMATES: 'No Estimates',
  NO_REFUND_AMOUNTS: 'No Refund Amounts',
  CONSERVATIVE_POSITION: 'Conservative Position',
  SUBSTANTIAL_AUTHORITY: 'Substantial Authority',
  SCOPE_BOUNDARY: 'Scope Boundary',
  ESCALATION_REQUIRED: 'Escalation Required',
  NO_DOLLAR_AMOUNTS: 'No Dollar Amounts',
};

export default function MetadataPanel({ retrievedIds, guardrailFlags }: MetadataPanelProps) {
  if (retrievedIds.length === 0 && guardrailFlags.length === 0) {
    return null;
  }

  return (
    <div className="w-64 shrink-0 border-l border-gray-800 bg-gray-950 p-4 overflow-y-auto">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
        Response Metadata
      </h3>

      {retrievedIds.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-400 mb-2">
            Retrieved Entries
          </h4>
          <ul className="space-y-1">
            {retrievedIds.map((id) => (
              <li
                key={id}
                className="text-xs px-2 py-1 bg-gray-900 border border-gray-800 rounded text-gray-300 font-mono"
              >
                {id}
              </li>
            ))}
          </ul>
        </div>
      )}

      {guardrailFlags.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-400 mb-2">
            Active Guardrails
          </h4>
          <ul className="space-y-1">
            {guardrailFlags.map((flag) => (
              <li
                key={flag}
                className="text-xs px-2 py-1 bg-amber-900/20 border border-amber-800/50 rounded text-amber-300"
              >
                {FLAG_LABELS[flag] || flag}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
