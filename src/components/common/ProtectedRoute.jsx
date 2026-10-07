import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldOff, Settings, ArrowLeft } from 'lucide-react';
import { useFeatureFlags } from '../../context/FeatureFlagsContext.jsx';

export function ProtectedRoute({ featureKey, title, children }) {
  const { isFeatureEnabled } = useFeatureFlags();

  if (!isFeatureEnabled(featureKey)) {
    return (
      <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
        <div
          className="card"
          style={{
            maxWidth: '560px',
            margin: '0 auto',
            backgroundColor: '#FFFBEB',
            borderColor: '#FDE68A',
            padding: '2.5rem 1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D97706',
              }}
            >
              <ShieldOff size={28} />
            </div>
          </div>

          <h3 style={{ color: '#92400E', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {title || 'Module Unavailable'}
          </h3>

          <p style={{ color: '#78350F', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            This feature module (<code>{featureKey}</code>) and its corresponding route are currently disabled by feature flag configuration.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/configuration" className="btn btn-primary">
              <Settings size={16} />
              <span>Enable in Configuration</span>
            </Link>

            <Link to="/" className="btn btn-secondary">
              <ArrowLeft size={16} />
              <span>Return to Overview</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
