import { describe, it, expect, beforeEach } from 'vitest';
import { redactSensitiveData, logActivity, getLogs, clearLogs, getStats } from '../services/diagnostics.js';

describe('Diagnostics & Data Redaction Service', () => {
  beforeEach(() => {
    clearLogs();
  });

  it('redacts sensitive security parameters from objects', () => {
    const rawData = {
      userToken: 'user-token-123',
      privateKey: 'secret_key_data_here',
      password: 'mySecretPassword',
      clientDataJSON: 'raw_webauthn_client_data',
      normalField: 'safe_value'
    };

    const redacted = redactSensitiveData(rawData);

    expect(redacted.normalField).toBe('safe_value');
    expect(redacted.userToken).toBe('user-token-123');
    expect(redacted.privateKey).toBe('[REDACTED SENSITIVE DATA]');
    expect(redacted.password).toBe('[REDACTED SENSITIVE DATA]');
    expect(redacted.clientDataJSON).toBe('[REDACTED SENSITIVE DATA]');
  });

  it('tracks session activity logs and calculates success/failure stats', () => {
    logActivity('SDK_INIT', 'SUCCESS', { version: '1.3.7' });
    logActivity('RISK_ASSESSMENT', 'DENIED', { riskDecision: 'DENY' });
    logActivity('PASSKEY_AUTH', 'FAILED', { error: 'Invalid challenge' });

    const logs = getLogs();
    const stats = getStats();

    expect(logs.length).toBe(3);
    expect(stats.totalOperations).toBe(3);
    expect(stats.successCount).toBe(1);
    expect(stats.failureCount).toBe(2);
  });
});
