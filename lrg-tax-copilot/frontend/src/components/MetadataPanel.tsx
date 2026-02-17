'use client';

interface MetadataPanelProps {
  retrievedIds: string[];
  guardrailFlags: string[];
  piiWarnings?: Array<{ type: string; redacted: string }>;
  taxdomeStep?: {
    stage: string;
    tag: string;
    task: string;
    message: string;
  };
  clientContext?: {
    clientName: string;
    filingStatus?: string;
    state?: string;
    lastInteraction: string;
  };
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

export default function MetadataPanel({
  retrievedIds,
  guardrailFlags,
  piiWarnings,
  taxdomeStep,
  clientContext,
}: MetadataPanelProps) {
  const hasContent =
    retrievedIds.length > 0 ||
    guardrailFlags.length > 0 ||
    (piiWarnings && piiWarnings.length > 0) ||
    taxdomeStep ||
    clientContext;

  if (!hasContent) return null;

  return (
    <div className="w-72 shrink-0 border-l border-gray-800 bg-gray-950 p-4 overflow-y-auto">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
        Response Metadata
      </h3>

      {/* PII Warnings */}
      {piiWarnings && piiWarnings.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-red-400 mb-2">
            PII Detected
          </h4>
          <ul className="space-y-1">
            {piiWarnings.map((warning, i) => (
              <li
                key={i}
                className="text-xs px-2 py-1.5 bg-red-900/20 border border-red-800/50 rounded text-red-300"
              >
                <span className="font-medium">{warning.type}</span>
                <span className="block text-red-400/70 font-mono mt-0.5">
                  {warning.redacted}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-red-400/60 mt-1.5">
            PII was detected in your message. Consider removing sensitive data before sending to clients.
          </p>
        </div>
      )}

      {/* Client Intelligence */}
      {clientContext && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-cyan-400 mb-2">
            Client Intelligence
          </h4>
          <div className="bg-cyan-900/10 border border-cyan-800/30 rounded p-2 space-y-1">
            <div className="text-xs text-cyan-300 font-medium">
              {clientContext.clientName}
            </div>
            {clientContext.filingStatus && (
              <div className="text-[10px] text-gray-400">
                Status: {clientContext.filingStatus}
              </div>
            )}
            {clientContext.state && (
              <div className="text-[10px] text-gray-400">
                State: {clientContext.state}
              </div>
            )}
            <div className="text-[10px] text-gray-500">
              Last seen: {new Date(clientContext.lastInteraction).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}

      {/* TaxDome Step */}
      {taxdomeStep && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-emerald-400 mb-2">
            TaxDome Step
          </h4>
          <div className="bg-emerald-900/10 border border-emerald-800/30 rounded p-2 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[10px] text-gray-500">Stage</span>
              <span className="text-xs text-emerald-300">{taxdomeStep.stage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-gray-500">Tag</span>
              <span className="text-xs text-emerald-300 font-mono">{taxdomeStep.tag}</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              {taxdomeStep.task}
            </div>
          </div>
        </div>
      )}

      {/* Retrieved Entries */}
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

      {/* Guardrail Flags */}
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
