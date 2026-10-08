import React, { useState } from 'react';
import { ShieldAlert, Play, Trash2, Info, Fingerprint, ShieldCheck } from 'lucide-react';
import { Card } from '../components/common/Card.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { JsonViewer } from '../components/common/JsonViewer.jsx';
import { useSdk } from '../hooks/useSdk.js';
import { evaluateRiskScore } from '../services/dwieldSdk.js';

export function RiskAssessmentPage() {
  const { initialized } = useSdk();
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_DWIELD_API_KEY || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('response'); // Default to 'response' tab per user request

  const handleRunRiskAssessment = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await evaluateRiskScore({ email: email.trim(), apiKey: apiKey.trim() || undefined });
      setResult(res);
      setActiveTab('response'); // Open Response tab by default
    } catch (err) {
      setError(err.message || 'Risk Assessment API evaluation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setResult(null);
    setError(null);
  };

  const deviceSignals = result?.deviceSignals;

  return (
    <div>
      <div className="page-header">
        <h1>Risk Assessment Evaluation</h1>
        <p>Run device & behavioural risk evaluation using email ID and an optional custom API key.</p>
      </div>

      <div className="grid-cols-2">
        <Card title="Risk Evaluation Form" icon={ShieldAlert}>
          <div className="form-group">
            <label className="form-label">User Email Address (Required)</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. user@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">SDK API Key (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="Leave blank to use default API Key"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              If provided, this key will be passed for risk score evaluation. Otherwise, the default SDK API key is used.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              className="btn btn-primary"
              onClick={handleRunRiskAssessment}
              disabled={!initialized || loading || !email.trim()}
              style={{ flex: 1 }}
            >
              <Play size={16} />
              <span>{loading ? 'Evaluating Risk...' : 'Run Risk Assessment'}</span>
            </button>

            {result && (
              <button className="btn btn-secondary" onClick={handleClear}>
                <Trash2 size={16} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </Card>

        {/* Output Assessment Summary Card */}
        <Card title="Assessment Output & Policy Decision" icon={Info}>
          {error ? (
            <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px' }}>
              <div style={{ color: '#991B1B', fontWeight: 600 }}>Evaluation Error</div>
              <div style={{ color: '#7F1D1D', fontSize: '0.85rem', marginTop: '0.3rem' }}>{error}</div>
            </div>
          ) : result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Risk Decision Policy
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.2rem' }}>
                    {result.decision}
                  </div>
                </div>
                <StatusBadge status={result.decision} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assessment ID</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600, marginTop: '0.2rem' }}>
                    {result.assessmentId}
                  </div>
                </div>

                <div style={{ padding: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Risk Score</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem' }}>
                    {result.riskScore !== undefined ? result.riskScore : (result.score !== undefined ? result.score : 'Evaluated')}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Evaluated via Risk Engine endpoint (<code>https://testweb.dwield.ai:8762/risk-score</code>)
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem 1rem' }}>
              Enter email address and click "Run Risk Assessment" to view risk score output.
            </div>
          )}
        </Card>
      </div>

      {/* Tabbed Diagnostic Section: Response (Default Open) & Payload */}
      {result && (
        <Card title="Risk Engine Execution Output & Diagnostics" icon={ShieldCheck}>
          {/* Tab Navigation Header */}
          <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: '1.25rem', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('response')}
              style={{
                padding: '0.6rem 1.25rem',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: activeTab === 'response' ? 'var(--accent-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'response' ? '2.5px solid var(--accent-primary)' : '2.5px solid transparent',
                background: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                borderTop: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <ShieldCheck size={16} />
              <span>Response</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payload')}
              style={{
                padding: '0.6rem 1.25rem',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: activeTab === 'payload' ? 'var(--accent-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'payload' ? '2.5px solid var(--accent-primary)' : '2.5px solid transparent',
                background: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                borderTop: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Fingerprint size={16} />
              <span>Payload</span>
            </button>
          </div>

          {/* TAB 1: RESPONSE (Default Open) */}
          {activeTab === 'response' && (
            <JsonViewer data={result} title="Risk Assessment Response JSON" />
          )}

          {/* TAB 2: PAYLOAD */}
          {activeTab === 'payload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Risk Evaluation Request Context
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email ID:</span>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{email}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>API Key:</span>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                      {apiKey ? apiKey : 'Default Configured Key'}
                    </div>
                  </div>
                </div>
              </div>

              {deviceSignals && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Captured Device & Behavioral Signals
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>OS / Platform</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.2rem' }}>
                        {deviceSignals?.device?.osDetails?.osName || 'Desktop / Mobile OS'}
                      </div>
                    </div>

                    <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Browser Engine</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.2rem' }}>
                        {deviceSignals?.device?.browserInfo?.browser_product || 'Web Browser'}
                      </div>
                    </div>

                    <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Keystroke Dynamics</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.2rem', color: 'var(--accent-primary)' }}>
                        {(deviceSignals?.behavioural?.keystroke?.length || 0)} Events Captured
                      </div>
                    </div>

                    <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Mouse Dynamics</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.2rem', color: 'var(--accent-primary)' }}>
                        {(deviceSignals?.behavioural?.mouse?.length || 0)} Events Captured
                      </div>
                    </div>
                  </div>

                  <JsonViewer data={deviceSignals} title="Captured Device & Behavioral Signals JSON Payload" />
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
