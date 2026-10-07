import { describe, it, expect } from 'vitest';
import { authenticatePasskey } from '@dwield/device-biometrics-sdk';

describe('Passkey 2-Step Authentication Integration', () => {
  it('exports authenticatePasskey method from SDK', () => {
    expect(typeof authenticatePasskey).toBe('function');
  });

  it('handles ALLOW decision policy bypass without throwing', async () => {
    const res = await authenticatePasskey({ riskDecision: 'ALLOW' });
    expect(res.bypassPasskey).toBe(true);
    expect(res.decision).toBe('ALLOW');
  });
});
