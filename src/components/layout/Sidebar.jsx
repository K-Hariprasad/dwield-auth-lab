import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  ShieldAlert,
  KeyRound,
  Fingerprint,
  Zap,
  Mic,
  FileCode,
  CheckSquare,
  Activity,
  Settings,
  ShieldCheck,
  X
} from 'lucide-react';
import { useFeatureFlags } from '../../context/FeatureFlagsContext.jsx';

export function Sidebar({ isOpen, onClose }) {
  const { isFeatureEnabled } = useFeatureFlags();

  const allNavItems = [
    { path: '/', label: 'Overview', icon: LayoutDashboard, featureKey: 'overview' },
    { path: '/signals', label: 'Device Signals', icon: Cpu, featureKey: 'signals' },
    { path: '/risk', label: 'Risk Assessment', icon: ShieldAlert, featureKey: 'risk' },
    { path: '/enrollment', label: 'Passkey Enrollment', icon: KeyRound, featureKey: 'enrollment' },
    { path: '/authentication', label: 'Passkey Authentication', icon: Fingerprint, featureKey: 'authentication' },
    { path: '/adaptive', label: 'Adaptive Authentication', icon: Zap, featureKey: 'adaptive' },
    { path: '/speech', label: 'Speech & Biometrics', icon: Mic, featureKey: 'speech', badge: 'Req' },
    { path: '/credentials', label: 'Credentials', icon: FileCode, featureKey: 'credentials' },
    { path: '/scenarios', label: 'Test Scenarios', icon: CheckSquare, featureKey: 'scenarios' },
    { path: '/logs', label: 'Activity Logs', icon: Activity, featureKey: 'logs' },
    { path: '/configuration', label: 'Configuration', icon: Settings, featureKey: 'configuration' }
  ];

  // Only display menu options where corresponding feature flag is turned ON
  const visibleNavItems = allNavItems.filter(item => isFeatureEnabled(item.featureKey));

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <ShieldCheck size={20} />
            </div>
            <div className="brand-text">
              <h1>Dwield Lab</h1>
              <span>Adaptive Risk Testing</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            title="Close Menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                end={item.path === '/'}
                onClick={onClose}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="nav-item-badge unavailable">{item.badge}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div>Dwield SDK v1.3.7</div>
          <div style={{ color: '#64748B', marginTop: '2px' }}>
            Flags Active: {visibleNavItems.length}/{allNavItems.length}
          </div>
        </div>
      </aside>
    </>
  );
}
