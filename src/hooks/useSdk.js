import { useState, useEffect, useCallback } from 'react';
import {
  initializeSdk,
  isSdkInitialized,
  getActiveConfig,
  checkPasskeyServerHealth,
  checkBrowserWebAuthnSupport
} from '../services/dwieldSdk.js';
import { envConfig } from '../config/env.js';

export function useSdk() {
  const [initialized, setInitialized] = useState(isSdkInitialized());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(getActiveConfig() || envConfig);
  const [serverHealth, setServerHealth] = useState({ reachable: false, live: false, ready: false });
  const [webAuthnSupport, setWebAuthnSupport] = useState({ isSupported: false, isPlatformAvailable: false });

  const refreshHealth = useCallback(async () => {
    try {
      const health = await checkPasskeyServerHealth();
      setServerHealth(health);
    } catch (e) {
      setServerHealth({ reachable: false, live: false, ready: false });
    }
  }, []);

  const refreshWebAuthn = useCallback(async () => {
    const support = await checkBrowserWebAuthnSupport();
    setWebAuthnSupport(support);
  }, []);

  const init = useCallback(async (customConfig = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await initializeSdk(customConfig);
      setInitialized(true);
      setConfig(res.config);
      await refreshHealth();
      await refreshWebAuthn();
      return res;
    } catch (err) {
      setError(err.message || 'SDK initialization failed');
      setInitialized(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshHealth, refreshWebAuthn]);

  useEffect(() => {
    // Automatically initialize SDK on application load if not already initialized
    if (!isSdkInitialized()) {
      init().catch(err => {
        console.warn('[Dwield Lab] Auto-initialization warning:', err.message);
      });
    } else {
      refreshWebAuthn();
      refreshHealth();
    }
  }, [init, refreshHealth, refreshWebAuthn]);

  return {
    initialized,
    loading,
    error,
    config,
    serverHealth,
    webAuthnSupport,
    initializeSdk: init,
    refreshHealth
  };
}
