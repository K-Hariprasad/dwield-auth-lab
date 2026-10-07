import React, { useState } from 'react';
import { FileCode, Trash2, RefreshCw, KeyRound, AlertCircle } from 'lucide-react';
import { Card } from '../components/common/Card.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { useSdk } from '../hooks/useSdk.js';
import { listPasskeys, revokePasskey } from '../services/dwieldSdk.js';

export function CredentialsPage() {
  const { initialized, serverHealth } = useSdk();
  const [userToken, setUserToken] = useState('');
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const [error, setError] = useState(null);

  const handleFetchCredentials = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPasskeys(userToken);
      setCredentials(data);
    } catch (err) {
      setError(err.message || 'Failed to list enrolled credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (credentialId) => {
    setRevokingId(credentialId);
    try {
      await revokePasskey(credentialId, userToken);
      // Refresh list after revocation
      await handleFetchCredentials();
    } catch (err) {
      setError(err.message || 'Credential revocation failed');
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Enrolled Passkey Credentials</h1>
        <p>Inspect and manage WebAuthn credentials registered for the current user identity.</p>
      </div>

      <Card title="User Credentials Query" icon={FileCode}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '280px', marginBottom: 0 }}>
            <label className="form-label">User Identity Token (userToken)</label>
            <input
              type="text"
              className="form-control"
              value={userToken}
              onChange={e => setUserToken(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleFetchCredentials}
            disabled={!initialized || !serverHealth.live || loading}
            style={{ height: '40px' }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>{loading ? 'Fetching Credentials...' : 'Fetch User Passkeys'}</span>
          </button>
        </div>
      </Card>

      {error && (
        <div className="card" style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }}>
          <div style={{ color: '#991B1B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertCircle size={16} />
            <span>Credential Management Error</span>
          </div>
          <div style={{ color: '#7F1D1D', fontSize: '0.85rem', marginTop: '0.25rem' }}>{error}</div>
        </div>
      )}

      <Card title="Enrolled Credential Inventory" icon={KeyRound}>
        {credentials.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            No enrolled passkeys found for user token <strong>{userToken}</strong>.
            <br />
            Register a passkey via the <strong>Passkey Enrollment</strong> page to see it listed here.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Credential ID</th>
                  <th>Friendly Name</th>
                  <th>Status</th>
                  <th>Created Timestamp</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {credentials.map(cred => (
                  <tr key={cred.credentialId}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                      {cred.credentialId.substring(0, 16)}...{cred.credentialId.substring(cred.credentialId.length - 8)}
                    </td>
                    <td style={{ fontWeight: 500 }}>{cred.credentialName || cred.name || 'Passkey Credential'}</td>
                    <td>
                      <StatusBadge status="ACTIVE" label="Enrolled" />
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                      {cred.createdAt ? new Date(cred.createdAt).toLocaleString() : 'Recent'}
                    </td>
                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleRevoke(cred.credentialId)}
                        disabled={revokingId === cred.credentialId}
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                      >
                        <Trash2 size={13} />
                        <span>{revokingId === cred.credentialId ? 'Revoking...' : 'Revoke'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
