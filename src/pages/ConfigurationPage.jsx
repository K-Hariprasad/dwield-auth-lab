import React, { useState } from 'react';
import { Settings, RefreshCw, Shield, ToggleLeft, ToggleRight, RotateCcw } from 'lucide-react';
import { Card } from '../components/common/Card.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { useSdk } from '../hooks/useSdk.js';
import { useFeatureFlags } from '../context/FeatureFlagsContext.jsx';

export function ConfigurationPage() {
  const { config, initializeSdk, loading } = useSdk();
  const { flags, toggleFlag, resetFlags } = useFeatureFlags();

  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [passkeyServerUrl, setPasskeyServerUrl] = useState(config.passkeyServerUrl || 'http://localhost:3000');
  const [userToken, setUserToken] = useState(config.userToken || '');
  const [verbose, setVerbose] = useState(config.verbose ?? true);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleApplyConfiguration = async () => {
    setError(null);
    setSaveSuccess(false);

    if (!apiKey) {
      setError('API Key is required to initialize Dwield SDK.');
      return;
    }

    try {
      await initializeSdk({
        apiKey,
        passkeyServerUrl,
        userToken,
        verbose
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to initialize SDK with new configuration');
    }
  };

  const modulesList = [
    { key: 'overview', label: 'Overview Dashboard', path: '/' },
    { key: 'signals', label: 'Device Signals', path: '/signals' },
    { key: 'risk', label: 'Risk Assessment', path: '/risk' },
    { key: 'enrollment', label: 'Passkey Enrollment', path: '/enrollment' },
    { key: 'authentication', label: 'Passkey Authentication', path: '/authentication' },
    { key: 'adaptive', label: 'Adaptive Authentication', path: '/adaptive' },
    { key: 'speech', label: 'Speech & Biometrics', path: '/speech' },
    { key: 'credentials', label: 'Credentials', path: '/credentials' },
    { key: 'scenarios', label: 'Test Scenarios', path: '/scenarios' },
    { key: 'logs', label: 'Activity Logs', path: '/logs' },
    { key: 'configuration', label: 'Configuration', path: '/configuration' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>SDK & Feature Flags Configuration</h1>
        <p>Control module feature flags, tenant API keys, Passkey Server URLs, and runtime debug options.</p>
      </div>

      {/* Feature Flags Manager Card */}
      <Card
        title="Module Feature Flags (Menu & Route Access Control)"
        icon={ToggleRight}
        action={
          <button
            className="btn btn-secondary"
            onClick={resetFlags}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          >
            <RotateCcw size={13} />
            <span>Reset Flags to Default</span>
          </button>
        }
      >
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Toggling a feature flag off instantly hides its sidebar menu option and disables its corresponding URL route.
        </p>

        <div className="grid-cols-2">
          {modulesList.map((mod) => {
            const enabled = flags[mod.key] ?? true;
            return (
              <div
                key={mod.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  backgroundColor: enabled ? '#F8FAFC' : '#FEF2F2',
                  border: `1px solid ${enabled ? '#E2E8F0' : '#FCA5A5'}`,
                  borderRadius: '8px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: enabled ? '#0F172A' : '#991B1B' }}>
                    {mod.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Route: {mod.path}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <StatusBadge
                    status={enabled ? 'ACTIVE' : 'OFFLINE'}
                    label={enabled ? 'ENABLED' : 'DISABLED'}
                    size="small"
                  />
                  <button
                    type="button"
                    onClick={() => toggleFlag(mod.key)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: enabled ? '#2563EB' : '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title={enabled ? 'Disable Module' : 'Enable Module'}
                  >
                    {enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid-cols-2">
        <Card title="Active SDK Configuration Parameters" icon={Settings}>
          <div className="form-group">
            <label className="form-label">Tenant API Key (apiKey)</label>
            <input
              type="text"
              className="form-control"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="e.g. test-tenant-api-key-12345"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Passkey Server Base URL (passkeyServerUrl)</label>
            <input
              type="text"
              className="form-control"
              value={passkeyServerUrl}
              onChange={(e) => setPasskeyServerUrl(e.target.value)}
              placeholder="e.g. http://localhost:3000"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Default User Context Token (userToken)</label>
            <input
              type="text"
              className="form-control"
              value={userToken}
              onChange={(e) => setUserToken(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input
                type="checkbox"
                checked={verbose}
                onChange={(e) => setVerbose(e.target.checked)}
              />
              <span>Enable Verbose SDK Console Logging</span>
            </label>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleApplyConfiguration}
            disabled={loading}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>{loading ? 'Re-initializing SDK...' : 'Apply & Re-initialize SDK'}</span>
          </button>

          {saveSuccess && (
            <div style={{ marginTop: '0.75rem', padding: '0.6rem', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '6px', color: '#065F46', fontSize: '0.82rem', textAlign: 'center' }}>
              SDK successfully re-initialized with updated configuration.
            </div>
          )}

          {error && (
            <div style={{ marginTop: '0.75rem', padding: '0.6rem', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', color: '#991B1B', fontSize: '0.82rem' }}>
              {error}
            </div>
          )}
        </Card>

        <Card title="Environment & Security Guidelines" icon={Shield}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.85rem', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>Active Vite Environment</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2563EB', marginTop: '0.2rem' }}>
                {config.environment}
              </div>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <strong>Feature Flags & Security Guidelines:</strong>
              <ul style={{ paddingLeft: '1.2rem', marginTop: '0.4rem' }}>
                <li>Turning off a module flag immediately hides its sidebar menu entry and blocks direct route navigation.</li>
                <li>Feature flag states are stored in <code>localStorage</code> and persist across page reloads.</li>
                <li>Environment variables prefixed with <code>VITE_</code> provide non-secret default defaults for client builds.</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
