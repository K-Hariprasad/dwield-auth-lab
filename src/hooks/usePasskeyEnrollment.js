import { useState, useCallback } from 'react';
import { enrollPasskey, checkBrowserWebAuthnSupport } from '../services/dwieldSdk.js';
import { PasskeyErrorCode } from '@dwield/device-biometrics-sdk';

export function usePasskeyEnrollment() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('idle'); // 'idle' | 'options' | 'browser_ceremony' | 'verifying' | 'success' | 'error'
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const startEnrollment = useCallback(async (email, options = {}) => {
    if (!email || typeof email !== 'string' || !email.trim()) {
      const err = new Error('A valid email address is required for passkey enrollment.');
      setError(err.message);
      setStep('error');
      throw err;
    }

    setLoading(true);
    setStep('options');
    setError(null);
    setResult(null);

    try {
      // Check WebAuthn support
      const support = await checkBrowserWebAuthnSupport();
      if (!support.isSupported) {
        const errMessage = 'WebAuthn passkeys are not supported by this browser or device.';
        setError(errMessage);
        setStep('error');
        throw new Error(errMessage);
      }

      setStep('browser_ceremony');

      // Call 2-step enrollment flow via SDK
      const enrollmentOptions = typeof options === 'string'
        ? { email: email.trim(), apiKey: options }
        : { email: email.trim(), ...(options || {}) };

      const enrollmentResult = await enrollPasskey(enrollmentOptions);

      setStep('success');
      setResult(enrollmentResult);
      return enrollmentResult;
    } catch (err) {
      setStep('error');
      let friendlyError = err.message || 'Passkey enrollment failed.';

      if (err.code === PasskeyErrorCode.USER_CANCELLED || err.name === 'NotAllowedError') {
        friendlyError = 'Passkey registration prompt was cancelled by the user or timed out.';
      } else if (err.code === PasskeyErrorCode.NOT_SUPPORTED) {
        friendlyError = 'WebAuthn passkeys are not supported by this browser environment.';
      } else if (err.code === PasskeyErrorCode.UNAUTHORIZED) {
        friendlyError = err.message || 'SDK API Key authorization failed.';
      }

      setError(friendlyError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetEnrollment = useCallback(() => {
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
    enrollPasskey: startEnrollment,
    resetEnrollment,
  };
}
