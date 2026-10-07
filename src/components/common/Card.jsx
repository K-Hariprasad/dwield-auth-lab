import React from 'react';

export function Card({ title, subtitle, icon: Icon, action, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {(title || subtitle || Icon || action) && (
        <div className="card-header">
          <div>
            {title && (
              <div className="card-title">
                {Icon && <Icon size={18} style={{ color: 'var(--accent-primary)' }} />}
                <span>{title}</span>
              </div>
            )}
            {subtitle && <div className="card-subtitle">{subtitle}</div>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}
