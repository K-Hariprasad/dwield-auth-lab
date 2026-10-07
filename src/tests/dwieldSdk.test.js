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
});
