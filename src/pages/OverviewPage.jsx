import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  KeyRound,
  Zap,
  CheckCircle2,
  AlertCircle,
  Activity,
  Server,
  ArrowRight
} from 'lucide-react';
import { Card } from '../components/common/Card.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { useSdk } from '../hooks/useSdk.js';
import { useActivityLogs } from '../hooks/useActivityLogs.js';

export function OverviewPage() {
  const navigate = useNavigate();
  const { initialized, serverHealth, config, initializeSdk, loading } = useSdk();
  const { stats, latestAssessment, latestPasskeyResult, logs } = useActivityLogs();

  const handleQuickInit = async () => {
    try {
      await initializeSdk();
    } catch (e) {
      // Error handled by hook log
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Overview Dashboard</h1>
        <p>Real-time status, test stats, and integration diagnostics for Dwield Adaptive Authentication.</p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid-cols-4" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">SDK Initialization</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
            <div className="stat-value" style={{ fontSize: '1.1rem' }}>
              {initialized ? 'Initialized' : 'Not Initialized'}
            </div>
            <StatusBadge status={initialized ? 'ACTIVE' : 'OFFLINE'} />
          </div>
          <div className="stat-desc">Product: device_id_with_biometrics</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Passkey Server</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
            <div className="stat-value" style={{ fontSize: '1.1rem' }}>
              {serverHealth.live ? (serverHealth.ready ? 'Ready' : 'Live') : 'Offline'}
            </div>
            <StatusBadge status={serverHealth.ready ? 'READY' : serverHealth.live ? 'LIVE' : 'OFFLINE'} />
          </div>
          <div className="stat-desc">{config.passkeyServerUrl}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Latest Assessment</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
            <div className="stat-value" style={{ fontSize: '1.1rem' }}>
              {latestAssessment ? latestAssessment.decision : 'N/A'}
            </div>
            {latestAssessment && <StatusBadge status={latestAssessment.decision} />}
          </div>
          <div className="stat-desc">
            {latestAssessment?.assessmentId ? `ID: ${latestAssessment.assessmentId.substring(0, 12)}...` : 'No assessment run yet'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Passkey Verification</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
            <div className="stat-value" style={{ fontSize: '1.1rem' }}>
              {latestPasskeyResult ? (latestPasskeyResult.verified ? 'Verified' : latestPasskeyResult.bypassPasskey ? 'Bypassed' : 'Failed') : 'N/A'}
            </div>
            {latestPasskeyResult && (
              <StatusBadge status={latestPasskeyResult.verified ? 'VERIFIED' : latestPasskeyResult.decision} />
            )}
          </div>
          <div className="stat-desc">
            {latestPasskeyResult?.credentialId ? `Cred: ${latestPasskeyResult.credentialId.substring(0, 10)}...` : 'No verification run'}
          </div>
        </div>
      </div>


      {/* Integration Stages & Operational Stats */}
      <div className="grid-cols-2">
        <Card title="System Integration Architecture Status" icon={Server}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Verification stages in Dwield Lab are distinct and un-conflated.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>1. SDK Initialized & Validated</span>
              <StatusBadge status={initialized ? 'ACTIVE' : 'OFFLINE'} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>2. Passkey Backend Server Reachable</span>
              <StatusBadge status={serverHealth.reachable ? 'READY' : 'OFFLINE'} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>3. Risk Score Assessment Evaluation</span>
              <StatusBadge status={latestAssessment ? latestAssessment.decision : 'NEUTRAL'} label={latestAssessment ? latestAssessment.decision : 'NOT TESTED'} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>4. Passkey Server Verification</span>
              <StatusBadge status={latestPasskeyResult?.verified ? 'VERIFIED' : 'NEUTRAL'} label={latestPasskeyResult?.verified ? 'VERIFIED' : 'NOT TESTED'} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>5. Customer Backend Authorization</span>
              <StatusBadge status="NEUTRAL" label="EXTERNAL APP STEP" />
            </div>
          </div>
        </Card>

        <Card title="Session Operational Statistics" icon={Activity}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ flex: 1, padding: '1rem', backgroundColor: '#F8FAFC', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{stats.totalOperations}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Operations</div>
            </div>
            <div style={{ flex: 1, padding: '1rem', backgroundColor: '#ECFDF5', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#047857' }}>{stats.successCount}</div>
              <div style={{ fontSize: '0.78rem', color: '#065F46', fontWeight: 500 }}>Successful</div>
            </div>
            <div style={{ flex: 1, padding: '1rem', backgroundColor: '#FEF2F2', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#B91C1C' }}>{stats.failureCount}</div>
              <div style={{ fontSize: '0.78rem', color: '#991B1B', fontWeight: 500 }}>Failed / Denied</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.5rem' }}>Primary Workflow Shortcut</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Execute end-to-end adaptive authentication connecting device signals, risk score evaluation, and passkey step-up.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/adaptive')} style={{ width: '100%' }}>
              <Zap size={16} />
              <span>Launch Adaptive Auth Test Workflow</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card title="Recent Session Operations" icon={Activity}>
        {logs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '1rem' }}>
            No operations recorded in the current session. Run a test scenario or initialize the SDK to begin.
          </p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Operation</th>
                  <th>Status</th>
                  <th>Correlation ID</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 6).map(log => (
                  <tr key={log.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ fontWeight: 500 }}>{log.operation}</td>
                    <td>
                      <StatusBadge status={log.status} />
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {log.correlationId || '-'}
                    </td>
                    <td>{log.durationMs ? `${log.durationMs} ms` : '-'}</td>
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
