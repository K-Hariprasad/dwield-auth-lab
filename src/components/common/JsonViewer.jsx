import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { redactSensitiveData } from '../../services/diagnostics.js';

export function JsonViewer({ data, title = 'Diagnostics Payload', defaultRedacted = true }) {
  const [copied, setCopied] = useState(false);
  const [isRedacted, setIsRedacted] = useState(defaultRedacted);

  if (!data) {
    return (
      <div className="json-viewer-container" style={{ textAlign: 'center', color: '#64748B', padding: '1.5rem' }}>
        No diagnostic output available yet. Run an operation to view payload data.
      </div>
    );
  }

  const processedData = isRedacted ? redactSensitiveData(data) : data;
  const jsonString = typeof processedData === 'string' ? processedData : JSON.stringify(processedData, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="json-viewer-container">
      <div className="json-viewer-header">
        <span>{title}</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsRedacted(!isRedacted)}
            style={{
              background: 'transparent',
              border: '1px solid #334155',
              color: '#94A3B8',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '0.7rem'
            }}
          >
            {isRedacted ? 'Redacted' : 'Raw Data'}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-secondary"
            style={{ padding: '2px 8px', fontSize: '0.72rem', height: '24px' }}
          >
            {copied ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {jsonString}
      </pre>
    </div>
  );
}
