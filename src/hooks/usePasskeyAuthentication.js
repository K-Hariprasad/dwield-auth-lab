import { useState, useCallback } from 'react';
import { authenticatePasskey, checkBrowserWebAuthnSupport } from '../services/dwieldSdk.js';
import { PasskeyErrorCode } from '@dwield/device-biometrics-sdk';

export function usePasskeyAuthentication() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('idle'); // 'idle' | 'options' | 'browser_ceremony' | 'verifying' | 'success' | 'error'
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const startAuthentication = useCallback(async (email, options = {}) => {
    if (!email || typeof email !== 'string' || !email.trim()) {
      const err = new Error('A valid email address is required for passkey login.');
      setError(err.message);
      setStep('error');
      throw err;
    }

    setLoading(true);
    setStep('options');
    setError(null);
    setResult(null);

    try {
      const support = await checkBrowserWebAuthnSupport();
      if (!support.isSupported) {
        const errMessage = 'WebAuthn passkeys are not supported by this browser or device.';
        setError(errMessage);
        setStep('error');
        throw new Error(errMessage);
      }

      setStep('browser_ceremony');

      const authResult = await authenticatePasskey({
        email: email.trim(),
        ...options,
      });

      setStep('success');
      setResult(authResult);
      return authResult;
    } catch (err) {
      setStep('error');
      let friendlyError = err.message || 'Passkey authentication failed.';

      if (err.code === PasskeyErrorCode.USER_CANCELLED || err.name === 'NotAllowedError') {
        friendlyError = 'Passkey authentication prompt was cancelled by the user or timed out.';
      } else if (err.code === PasskeyErrorCode.NOT_SUPPORTED) {
        friendlyError = 'WebAuthn passkeys are not supported by this browser environment.';
      } else if (err.code === PasskeyErrorCode.RISK_DENIED) {
        friendlyError = 'Access denied by risk policy.';
      }

      setError(friendlyError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetAuthentication = useCallback(() => {
    setLoading(false);
    setStep('idle');
    setResult(null);
    setError(null);
  }, []);

  return {
    loading,
    step,
    result,
    error,
    authenticatePasskey: startAuthentication,
    resetAuthentication,
  };
}
