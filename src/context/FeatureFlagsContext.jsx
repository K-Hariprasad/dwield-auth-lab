import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'dwield_lab_feature_flags';

export const DEFAULT_FLAGS = {
  overview: true,
  signals: false,
  risk: true,
  enrollment: true,
  authentication: true,
  adaptive: true,
  speech: false,
  credentials: false,
  scenarios: false,
  logs: false,
  configuration: false,
};

const FeatureFlagsContext = createContext({
  flags: DEFAULT_FLAGS,
  toggleFlag: () => {},
  setFlag: () => {},
  resetFlags: () => {},
  isFeatureEnabled: () => true,
});

export function FeatureFlagsProvider({ children }) {
  const [flags, setFlags] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_FLAGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load feature flags from localStorage', e);
    }
    return DEFAULT_FLAGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
    } catch (e) {
      console.warn('Failed to save feature flags to localStorage', e);
    }
  }, [flags]);

  const toggleFlag = (flagKey) => {
    setFlags((prev) => ({
      ...prev,
      [flagKey]: !prev[flagKey],
    }));
  };

  const setFlag = (flagKey, value) => {
    setFlags((prev) => ({
      ...prev,
      [flagKey]: Boolean(value),
    }));
  };

  const resetFlags = () => {
    setFlags(DEFAULT_FLAGS);
  };

  const isFeatureEnabled = (flagKey) => {
    // If flagKey is unknown, default to true
    if (!(flagKey in flags)) return true;
    return Boolean(flags[flagKey]);
  };

  return (
    <FeatureFlagsContext.Provider
      value={{
        flags,
        toggleFlag,
        setFlag,
        resetFlags,
        isFeatureEnabled,
      }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}
