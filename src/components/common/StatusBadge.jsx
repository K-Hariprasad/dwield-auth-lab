import React from 'react';

export function StatusBadge({ status, label, size = 'normal' }) {
  if (!status) return null;

  const upperStatus = String(status).toUpperCase();
  let badgeClass = 'badge-neutral';
  let displayLabel = label || upperStatus;

  if (['ALLOW', 'SUCCESS', 'VERIFIED', 'ACTIVE', 'LIVE', 'READY', 'ONLINE'].includes(upperStatus)) {
    badgeClass = 'badge-allow';
  } else if (['STEP_UP', 'WARNING', 'PENDING', 'CONSUMED', 'CHALLENGE'].includes(upperStatus)) {
    badgeClass = 'badge-stepup';
  } else if (['DENY', 'FAILED', 'ERROR', 'DENIED', 'OFFLINE'].includes(upperStatus)) {
    badgeClass = 'badge-deny';
  }

  const style = size === 'small' ? { fontSize: '0.68rem', padding: '0.12rem 0.45rem' } : {};

  return (
    <span className={`badge ${badgeClass}`} style={style}>
      {displayLabel}
    </span>
  );
}
