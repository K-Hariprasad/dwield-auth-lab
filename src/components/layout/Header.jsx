import React from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCw, Server, Shield, Key, Menu } from 'lucide-react';
import { useSdk } from '../../hooks/useSdk.js';

export function Header({ onMenuClick }) {
  const location = useLocation();
  const { initialized, serverHealth, config, refreshHealth, loading } = useSdk();

  const getPageTitle = (path) => {
    switch (path) {
      case '/': return 'Overview Dashboard';
      case '/signals': return 'Device Signals Testing';
      case '/risk': return 'Risk Assessment Evaluation';
      case '/enrollment': return 'Passkey Enrollment Testing';
      case '/authentication': return 'Passkey Authentication Testing';
      case '/adaptive': return 'Adaptive Authentication Workflow';
      case '/speech': return 'Speech & Voice Biometrics';
      case '/credentials': return 'Enrolled Credential Management';
      case '/scenarios': return 'Integration Test Scenarios';
      case '/logs': return 'Session Activity & Diagnostics';
      case '/configuration': return 'SDK & Environment Configuration';
      default: return 'Dwield Lab';
    }
  };

  return (
    <header className="header-navbar">
      <div className="header-title">
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={onMenuClick}
          title="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>
        <h2>{getPageTitle(location.pathname)}</h2>
      </div>

      <div className="header-status-group">
        <div className="status-indicator-pill" title="Dwield SDK Initialization Status">
          <Shield size={13} color="#475569" />
          <span className={`status-dot ${initialized ? 'online' : 'offline'}`} />
          <span>SDK {initialized ? 'Initialized' : 'Not Initialized'}</span>
        </div>

        <div className="status-indicator-pill" title="Passkey Server Liveness and Readiness Status">
          <Key size={13} color="#475569" />
          <span className={`status-dot ${serverHealth.live ? (serverHealth.ready ? 'online' : 'warning') : 'offline'}`} />
          <span>Passkey Server {serverHealth.live ? (serverHealth.ready ? 'Ready' : 'Live (No DB)') : 'Offline'}</span>
        </div>

        <div className="status-indicator-pill" title="Active Tenant API Key & Target Environment">
          <Server size={13} color="#475569" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563EB' }}>
            {config?.environment || 'dev'}
          </span>
        </div>

        <button
          type="button"
          onClick={refreshHealth}
          disabled={loading}
          className="btn btn-secondary"
          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
          title="Refresh Backend Diagnostics Health"
        >
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>
    </header>
  );
}
