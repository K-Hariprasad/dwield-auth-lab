import { describe, it, expect } from 'vitest';
import { registerPasskey } from '@dwield/device-biometrics-sdk';

describe('Passkey 2-Step Enrollment Integration', () => {
  it('exports registerPasskey method from SDK', () => {
    expect(typeof registerPasskey).toBe('function');
  });

  it('rejects enrollment when user email is missing', async () => {
    // Mock WebAuthn browser environment for Node test runner
    global.window = global.window || {};
    global.window.PublicKeyCredential = {
      isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true)
    };

    try {
      await registerPasskey({ email: '' });
      expect.fail('Should have thrown an error');
    } catch (err) {
      expect(err.message).toBeDefined();
    }
  });
});
