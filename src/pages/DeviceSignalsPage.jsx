import React, { useState } from 'react';
import { Cpu, RefreshCw, Eye, ShieldCheck, Activity } from 'lucide-react';
import { Card } from '../components/common/Card.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { JsonViewer } from '../components/common/JsonViewer.jsx';
import { useSdk } from '../hooks/useSdk.js';
import { collectDeviceSignals } from '../services/dwieldSdk.js';

export function DeviceSignalsPage() {
  const { initialized } = useSdk();
  const [testUser, setTestUser] = useState('');
  const [signals, setSignals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCollect = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await collectDeviceSignals();
      setSignals(data);
    } catch (err) {
      setError(err.message || 'Failed to collect device signals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Device Signals & Biometrics Collection</h1>
        <p>Inspect raw and aggregate device fingerprinting signals collected by `@dwield/device-biometrics-sdk`.</p>
      </div>

      {/* Control Panel Card */}
      <Card title="Signal Collection Trigger" icon={Cpu}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: '1 1 240px', minWidth: 'min(240px, 100%)', marginBottom: 0 }}>
            <label className="form-label">Test User Identifier / Email Context</label>
            <input
              type="text"
              className="form-control"
              value={testUser}
              onChange={e => setTestUser(e.target.value)}
              placeholder="e.g. user@example.com"
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleCollect}
            disabled={!initialized || loading}
            style={{ height: '40px' }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>{loading ? 'Collecting Signals...' : 'Collect Device & Biometric Signals'}</span>
          </button>
        </div>


      </Card>

      {error && (
        <div className="card" style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }}>
          <div style={{ color: '#991B1B', fontWeight: 600, fontSize: '0.9rem' }}>Signal Collection Error</div>
          <div style={{ color: '#7F1D1D', fontSize: '0.85rem', marginTop: '0.25rem' }}>{error}</div>
        </div>
      )}

      {/* Breakdown Cards if Signals Collected */}
      {signals && (
        <>
          <div className="grid-cols-3" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div className="stat-label">Device & Operating System</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.3rem 0' }}>
                {signals.device?.osDetails?.osName || 'Unknown OS'}
              </div>
              <div className="stat-desc">
                Incognito: {signals.device?.browserInfo?.is_incognito ? 'YES (Private)' : 'NO'}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Browser & Hardware Fingerprint</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.3rem 0' }}>
                {signals.device?.browserInfo?.browser_platform || 'Browser'}
              </div>
              <div className="stat-desc">
                Canvas Hash: {signals.device?.canvasId ? `${signals.device.canvasId.substring(0, 10)}...` : 'N/A'}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Behavioural Dynamics State</div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                <StatusBadge
                  status={signals.behavioural?.keystroke ? 'ACTIVE' : 'NEUTRAL'}
                  label={signals.behavioural?.keystroke ? 'Keystroke Active' : 'No Typing'}
                />
                <StatusBadge
                  status={signals.behavioural?.mouse ? 'ACTIVE' : 'NEUTRAL'}
                  label={signals.behavioural?.mouse ? 'Mouse Active' : 'No Motion'}
                />
              </div>
              <div className="stat-desc" style={{ marginTop: '0.4rem' }}>
                Collection TS: {new Date(signals.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>

          <Card title="Raw Device & Biometric Signal Diagnostics (Redacted)" icon={Eye}>
            <JsonViewer data={signals} title="Dwield SDK Signal Payload" />
          </Card>
        </>
      )}
    </div>
  );
}
