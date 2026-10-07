import React, { useState } from 'react';
import { Zap, Play, ShieldAlert, Fingerprint, ShieldCheck } from 'lucide-react';
import { Card } from '../components/common/Card.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { JsonViewer } from '../components/common/JsonViewer.jsx';
import { useSdk } from '../hooks/useSdk.js';
import { runAdaptiveAuthenticationPipeline } from '../services/dwieldSdk.js';

export function AdaptiveAuthenticationPage() {
  const { initialized } = useSdk();
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: Idle, 1: Signals & Risk, 2: Decision, 3: Step-Up, 4: Complete
  const [pipelineResult, setPipelineResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('response'); // Default to 'response' tab per user request

  const handleRunAdaptiveTest = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    setPipelineResult(null);
    setCurrentStep(1);

    try {
      // Execute complete adaptive pipeline via SDK adapter passing email and API key
      const res = await runAdaptiveAuthenticationPipeline({
        email: email.trim(),
        apiKey: apiKey.trim() || undefined
      });
      
      setCurrentStep(4);
      setPipelineResult(res);
      setActiveTab('response'); // Open Response tab by default
    } catch (err) {
      setError(err);
      setCurrentStep(err.code === 'RISK_DENIED' ? 2 : 3);
    } finally {
      setLoading(false);
    }
  };

  const deviceSignals = pipelineResult?.deviceSignals || pipelineResult?.riskAssessment?.deviceSignals;

  return (
    <div>
      <div className="page-header">
        <h1>Adaptive Authentication Test Workflow</h1>
        <p>Risk-based authentication flow requiring email ID & SDK API Key. Evaluates risk score first, triggering Passkey Step-Up authentication if decision is STEP_UP.</p>
      </div>

      {/* Visual Timeline Component */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: '1.25rem' }}>
          <Zap size={18} style={{ color: 'var(--accent-primary)' }} />
          <span>Adaptive Workflow Execution Pipeline</span>
        </div>

        <div className="workflow-timeline">
          <div className={`timeline-step ${currentStep >= 1 ? 'completed' : ''}`}>
            <div className="step-circle">1</div>
            <div className="step-label">Collect Signals</div>
          </div>
          <div className={`timeline-connector ${currentStep >= 2 ? 'completed' : ''}`} />

          <div className={`timeline-step ${currentStep >= 2 ? (pipelineResult?.decision === 'DENY' ? 'denied' : 'completed') : ''}`}>
            <div className="step-circle">2</div>
            <div className="step-label">Risk Assessment</div>
          </div>
          <div className={`timeline-connector ${currentStep >= 3 ? 'completed' : ''}`} />

          <div className={`timeline-step ${currentStep >= 3 ? (pipelineResult?.decision === 'DENY' ? 'denied' : 'completed') : ''}`}>
            <div className="step-circle">3</div>
            <div className="step-label">Policy Decision</div>
          </div>
          <div className={`timeline-connector ${currentStep >= 4 ? 'completed' : ''}`} />

          <div className={`timeline-step ${currentStep >= 4 ? (pipelineResult?.decision === 'ALLOW' ? 'completed' : pipelineResult?.passkeyResult?.verified ? 'completed' : 'active') : ''}`}>
            <div className="step-circle">4</div>
            <div className="step-label">
              {pipelineResult?.decision === 'ALLOW' ? 'Bypassed (ALLOW)' : pipelineResult?.decision === 'DENY' ? 'Prohibited (DENY)' : 'Passkey Step-Up'}
            </div>
          </div>
        </div>
      </div>

      {/* Trigger & Context Inputs */}
      <Card title="Adaptive User Payload Context" icon={Play}>
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
            If provided, this key will be passed for evaluation & authentication requests. Otherwise, the default key is used.
          </span>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleRunAdaptiveTest}
          disabled={!initialized || loading || !email.trim()}
          style={{ width: '100%', marginTop: '1.25rem', height: '44px', fontSize: '0.95rem' }}
        >
          <Zap size={18} />
          <span>{loading ? 'Evaluating Risk Score & Step-Up...' : 'Run Adaptive Authentication Test'}</span>
        </button>
      </Card>

      {/* Error Output Card */}
      {error && (
        <Card title="Pipeline Exception Handling" icon={ShieldAlert}>
          <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px' }}>
            <div style={{ color: '#991B1B', fontWeight: 600 }}>Adaptive Pipeline Error ({error.code || 'PIPELINE_ERROR'})</div>
            <div style={{ color: '#7F1D1D', fontSize: '0.85rem', marginTop: '0.3rem' }}>{error.message}</div>
          </div>
        </Card>
      )}

      {/* Tabbed Results Section: Response (Default Open) & Payload */}
      {pipelineResult && (
        <Card title="Adaptive Execution Output & Diagnostics" icon={ShieldCheck}>
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

          {/* TAB 1: RESPONSE (Open by default) */}
          {activeTab === 'response' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Risk Decision Badge Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Risk Engine Evaluation Decision
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.2rem' }}>
                    {pipelineResult.decision}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Assessment ID: <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{pipelineResult.riskAssessment?.assessmentId}</code>
                  </div>
                </div>
                <StatusBadge status={pipelineResult.decision} />
              </div>

              {/* Branch Specific Info */}
              {pipelineResult.decision === 'ALLOW' && (
                <div style={{ padding: '1rem', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px' }}>
                  <div style={{ color: '#065F46', fontWeight: 600, fontSize: '0.95rem' }}>ALLOW Policy Branch Executed</div>
                  <div style={{ color: '#047857', fontSize: '0.85rem', marginTop: '0.3rem', lineHeight: 1.5 }}>
                    Access granted by Risk Engine. Passkey step-up was bypassed.
                  </div>
                </div>
              )}

              {pipelineResult.decision === 'STEP_UP' && (
                <div style={{ padding: '1rem', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px' }}>
                  <div style={{ color: '#92400E', fontWeight: 600, fontSize: '0.95rem' }}>STEP_UP Adaptive Passkey Challenge Required & Verified</div>
                  <div style={{ color: '#78350F', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                    Passkey authentication executed and verified bound to Assessment ID <strong>{pipelineResult.riskAssessment?.assessmentId}</strong>.
                  </div>
                  {pipelineResult.stepUpVerificationToken && (
                    <div style={{ marginTop: '0.75rem', padding: '0.66rem', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #FCD34D' }}>
                      <div style={{ fontSize: '0.72rem', color: '#92400E', fontWeight: 600, textTransform: 'uppercase' }}>Verified Step-Up Token</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#2563EB', wordBreak: 'break-all', marginTop: '0.2rem' }}>
                        {pipelineResult.stepUpVerificationToken}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {pipelineResult.decision === 'DENY' && (
                <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px' }}>
                  <div style={{ color: '#991B1B', fontWeight: 600, fontSize: '0.95rem' }}>DENY Policy Strict Enforcement</div>
                  <div style={{ color: '#7F1D1D', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                    Risk Engine strictly denied the authentication attempt.
                  </div>
                </div>
              )}

              {/* Full Response JSON Viewer */}
              <JsonViewer data={pipelineResult} title="Pipeline Response JSON Payload" />
            </div>
          )}

          {/* TAB 2: PAYLOAD */}
          {activeTab === 'payload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* User Payload Info */}
              <div style={{ padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Request Context Payload
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email ID:</span>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{email}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Header Authorization / API Key:</span>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{apiKey ? apiKey : 'Default Configured Key'}</div>
                  </div>
                </div>
              </div>

              {/* Device & Biometrics Data Summary */}
              {deviceSignals && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Captured Device & Behavioral Biometrics Signals
                  </div>

                  <JsonViewer
                    data={deviceSignals}
                    title="Captured Device & Behavioral Signals JSON Payload"
                  />
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
