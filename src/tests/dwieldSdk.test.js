import { describe, it, expect, vi } from 'vitest';
import { isSdkInitialized, checkPasskeyServerHealth } from '../services/dwieldSdk.js';

describe('Dwield SDK Integration Adapter', () => {
  it('reports uninitialized state by default before init', () => {
    expect(isSdkInitialized()).toBe(false);
  });

  it('handles health check fetch failures gracefully', async () => {
    // Mock fetch to simulate offline server
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    const health = await checkPasskeyServerHealth('http://localhost:9999');

    expect(health.reachable).toBe(false);
    expect(health.live).toBe(false);
    expect(health.ready).toBe(false);
    expect(health.error).toBe('Network offline');
  });

  describe('parseRiskSuggestion', () => {
    it('handles Good, Accept, Low Risky case-insensitively (bypasses passkey)', async () => {
      const { parseRiskSuggestion } = await import('../services/dwieldSdk.js');

      ['Good', 'good', 'GOOD', 'Accept', 'ACCEPT', 'accept', 'Low Risky', 'low risky', 'LOW RISKY'].forEach(val => {
        const parsed = parseRiskSuggestion(val);
        expect(parsed).not.toBeNull();
        expect(parsed.decision).toBe('ALLOW');
        expect(parsed.requiresPasskey).toBe(false);
        expect(parsed.isRejected).toBe(false);
      });
    });

    it('handles High case-insensitively (requires passkey)', async () => {
      const { parseRiskSuggestion } = await import('../services/dwieldSdk.js');

      ['High', 'high', 'HIGH'].forEach(val => {
        const parsed = parseRiskSuggestion(val);
        expect(parsed).not.toBeNull();
        expect(parsed.decision).toBe('STEP_UP');
        expect(parsed.requiresPasskey).toBe(true);
        expect(parsed.isRejected).toBe(false);
      });
    });

    it('handles Reject case-insensitively (strictly terminates/denies)', async () => {
      const { parseRiskSuggestion } = await import('../services/dwieldSdk.js');

      ['Reject', 'reject', 'REJECT'].forEach(val => {
        const parsed = parseRiskSuggestion(val);
        expect(parsed).not.toBeNull();
        expect(parsed.decision).toBe('DENY');
        expect(parsed.requiresPasskey).toBe(false);
        expect(parsed.isRejected).toBe(true);
      });
    });
  });
});
