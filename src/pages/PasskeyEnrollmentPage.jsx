import React, { useState } from 'react';
import { KeyRound, ShieldCheck, AlertCircle, RefreshCw, Mail } from 'lucide-react';
import { Card } from '../components/common/Card.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { JsonViewer } from '../components/common/JsonViewer.jsx';
import { useSdk } from '../hooks/useSdk.js';
import { usePasskeyEnrollment } from '../hooks/usePasskeyEnrollment.js';

export function PasskeyEnrollmentPage() {
  const { initialized, webAuthnSupport, serverHealth } = useSdk();
  const { loading, step, result, error, enrollPasskey } = usePasskeyEnrollment();
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_DWIELD_API_KEY || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      await enrollPasskey(email, { apiKey: apiKey.trim() || undefined });
    } catch (err) {
      // Error handled by hook state
    }
  };

  const getStepText = () => {
    switch (step) {
      case 'options':
        return 'Step 1/2: Requesting registration options (POST /v1/passkeys/registration/options)...';
      case 'browser_ceremony':
        return 'Step 2/2: Awaiting browser biometric / security key prompt...';
      case 'verifying':
        return 'Verifying registration assertion with Passkey Server (POST /v1/passkeys/registration/verify)...';
      default:
        return 'Register New Passkey';
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Passkey Enrollment & Registration</h1>
        <p>2-Step WebAuthn passkey enrollment with Dwield Passkey Server sending user email & X-API-Key header.</p>
      </div>

      <div className="grid-cols-2">
        {/* Step 1: Input Setup Form */}
        <Card title="Passkey Enrollment Setup" icon={KeyRound}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">User Email Address (Required)</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. user@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">SDK API Key (Optional)</label>
              <input
                type="text"
                className="form-control"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Leave blank to use default API Key"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                If provided, this key will be sent in X-API-Key header. Otherwise, the default key is used.
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!initialized || !serverHealth.live || loading || !webAuthnSupport.isSupported || !email}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  <span>{getStepText()}</span>
                </>
              ) : (
                <>
                  <KeyRound size={16} />
                  <span>Register Passkey for {email || 'User'}</span>
                </>
              )}
            </button>
          </form>

          {!webAuthnSupport.isSupported && (
            <div style={{ marginTop: '0.75rem', color: '#EF4444', fontSize: '0.82rem' }}>
              * WebAuthn passkeys are not supported by this browser environment.
            </div>
          )}
        </Card>

        {/* Step 2: Verification Results */}
        <Card title="Server Verification Outcome" icon={ShieldCheck}>
          {error ? (
            <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px' }}>
              <div style={{ color: '#991B1B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={16} />
                <span>Passkey Enrollment Error</span>
              </div>
              <div style={{ color: '#7F1D1D', fontSize: '0.85rem', marginTop: '0.3rem' }}>{error}</div>
            </div>
          ) : result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px' }}>
                <div>
                  <div style={{ color: '#065F46', fontWeight: 600, fontSize: '0.95rem' }}>Passkey Enrolled & Verified</div>
                  <div style={{ color: '#047857', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                    Server verified WebAuthn attestation ceremony for {email}.
                  </div>
                </div>
                <StatusBadge status="VERIFIED" />
              </div>

              {result.credentialId && (
                <div style={{ padding: '0.85rem', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Credential ID</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600, marginTop: '0.2rem', wordBreak: 'break-all' }}>
                    {result.credentialId}
                  </div>
                </div>
              )}

              {result.friendlyName && (
                <div style={{ padding: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Friendly Credential Name</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, marginTop: '0.2rem' }}>
                    {result.friendlyName}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem 1rem' }}>
              Enter email address and click "Register Passkey" to initiate WebAuthn enrollment.
            </div>
          )}
        </Card>
      </div>

      {result && (
        <Card title="Raw Server Registration Diagnostics" icon={KeyRound}>
          <JsonViewer data={result} title="2-Step Enrollment Verification Response" />
        </Card>
      )}
    </div>
  );
}
