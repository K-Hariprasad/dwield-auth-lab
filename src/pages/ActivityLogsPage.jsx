import React, { useState } from 'react';
import { Activity, Trash2, Copy, Check, Filter, ShieldCheck } from 'lucide-react';
import { Card } from '../components/common/Card.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { JsonViewer } from '../components/common/JsonViewer.jsx';
import { useActivityLogs } from '../hooks/useActivityLogs.js';

export function ActivityLogsPage() {
  const { logs, clearLogs } = useActivityLogs();
  const [operationFilter, setOperationFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);
  const [copied, setCopied] = useState(false);

  const filteredLogs = logs.filter(log => {
    if (operationFilter !== 'ALL' && log.operation !== operationFilter) return false;
    if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
    return true;
  });

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(JSON.stringify(filteredLogs, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Session Activity Logs & Diagnostics</h1>
        <p>Audit trail of session-level operations with automatic sensitive data redaction.</p>
      </div>

      <Card title="Activity Log Controls & Security Audit" icon={Activity}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Filter by Operation</label>
              <select
                className="form-control"
                value={operationFilter}
                onChange={e => setOperationFilter(e.target.value)}
              >
                <option value="ALL">All Operations ({logs.length})</option>
                <option value="SDK_INITIALIZATION">SDK Initialization</option>
                <option value="COLLECT_DEVICE_SIGNALS">Collect Signals</option>
                <option value="RISK_ASSESSMENT">Risk Assessment</option>
                <option value="PASSKEY_REGISTRATION">Passkey Enrollment</option>
                <option value="PASSKEY_AUTHENTICATION">Passkey Authentication</option>
                <option value="ADAPTIVE_AUTHENTICATION_PIPELINE">Adaptive Pipeline</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Filter by Status</label>
              <select
                className="form-control"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
                <option value="DENIED">DENIED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={handleCopyLogs} disabled={filteredLogs.length === 0}>
              {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              <span>{copied ? 'Copied Redacted Logs' : 'Copy Redacted Logs'}</span>
            </button>

            <button className="btn btn-danger" onClick={clearLogs} disabled={logs.length === 0}>
              <Trash2 size={14} />
              <span>Clear Log History</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: '1rem', padding: '0.65rem 0.85rem', backgroundColor: '#EFF6FF', borderRadius: '6px', fontSize: '0.78rem', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={14} color="#2563EB" />
          <span>Security Audit Verified: Private keys, raw WebAuthn assertion signatures, and passwords are automatically redacted.</span>
        </div>
      </Card>

      <Card title="Activity Log Entry Stream" icon={Activity}>
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            No log entries match the selected filters.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Operation Name</th>
                  <th>Status</th>
                  <th>Correlation ID</th>
                  <th>Duration</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ fontWeight: 600 }}>{log.operation}</td>
                    <td>
                      <StatusBadge status={log.status} />
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {log.correlationId || '-'}
                    </td>
                    <td>{log.durationMs ? `${log.durationMs} ms` : '-'}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setSelectedLog(log)}
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                      >
                        Inspect Payload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedLog && (
        <Card title={`Inspecting Log Details: ${selectedLog.operation}`} icon={Activity}>
          <JsonViewer data={selectedLog} title={`Log Entry ID ${selectedLog.id}`} />
        </Card>
      )}
    </div>
  );
}
